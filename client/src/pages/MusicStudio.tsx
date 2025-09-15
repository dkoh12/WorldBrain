import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Square, Save, Download, Activity, Music, Volume2, RotateCcw } from "lucide-react";
import { projectManager } from "@/lib/project-manager";
import { ReplitAI } from "@/lib/replit-ai";
import { useToast } from "@/hooks/use-toast";
import { isPreviewMode } from "@/lib/utils/export-utils";

interface AudioTrack {
  id: string;
  name: string;
  type: 'synth' | 'drum' | 'bass' | 'lead';
  isPlaying: boolean;
  volume: number;
  frequency: number;
  waveform: OscillatorType;
  notes: { time: number; note: string; duration: number }[];
}

interface DrumPattern {
  kick: boolean[];
  snare: boolean[];
  hihat: boolean[];
}

export default function MusicStudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [tracks, setTracks] = useState<AudioTrack[]>([
    {
      id: '1',
      name: 'Lead Synth',
      type: 'lead',
      isPlaying: true,
      volume: 0.7,
      frequency: 440,
      waveform: 'sine',
      notes: []
    },
    {
      id: '2', 
      name: 'Bass',
      type: 'bass',
      isPlaying: true,
      volume: 0.8,
      frequency: 220,
      waveform: 'sawtooth',
      notes: []
    }
  ]);
  
  const [drumPattern, setDrumPattern] = useState<DrumPattern>({
    kick: [true, false, false, false, true, false, false, false],
    snare: [false, false, true, false, false, false, true, false],
    hihat: [true, true, true, true, true, true, true, true]
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('Untitled Song');

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<{ [key: string]: OscillatorNode[] }>({});
  const drumBuffersRef = useRef<{ [key: string]: AudioBuffer | null }>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  // Using singleton instance
  const replitAI = new ReplitAI();

  // Initialize Web Audio API and load project data
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Create simple drum sounds using oscillators
        await createDrumSounds();
        
        toast({
          title: "Audio initialized",
          description: "Music studio is ready to create!"
        });
      } catch (error) {
        console.error('Audio initialization failed:', error);
        toast({
          title: "Audio unavailable",
          description: "Some audio features may not work in this environment.",
          variant: "destructive"
        });
      }
    };

    const loadProjectData = () => {
      try {
        const currentProjectId = projectManager.getCurrentProjectId();
        if (currentProjectId) {
          const project = projectManager.getProject(currentProjectId);
          if (project && project.data.musicTracks) {
            // musicTracks contains the entire music data object
            const musicData = project.data.musicTracks as any;
            if (musicData.tracks) setTracks(musicData.tracks);
            if (musicData.drumPattern) setDrumPattern(musicData.drumPattern);
            if (musicData.bpm) setBpm(musicData.bpm);
            if (musicData.projectName) setProjectName(musicData.projectName);
            
            toast({
              title: "Project loaded",
              description: `Loaded music data for ${project.name}`
            });
          }
        }
      } catch (error) {
        console.error('Failed to load project data:', error);
      }
    };

    initAudio();
    
    // Auto-play if preview mode is enabled
    if (isPreviewMode() && audioContextRef.current?.state === 'suspended') {
      // Resume audio context on user gesture (click anywhere)
      const resumeAudio = () => {
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            startPlayback();
            document.removeEventListener('click', resumeAudio);
          });
        }
      };
      document.addEventListener('click', resumeAudio);
    } else if (isPreviewMode()) {
      setTimeout(() => startPlayback(), 500);
    }
    loadProjectData();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const createDrumSounds = async () => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    
    // Create kick drum sound
    const kickBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const kickData = kickBuffer.getChannelData(0);
    for (let i = 0; i < kickData.length; i++) {
      kickData[i] = Math.sin(2 * Math.PI * 60 * i / ctx.sampleRate) * Math.exp(-i / (ctx.sampleRate * 0.1));
    }
    drumBuffersRef.current.kick = kickBuffer;

    // Create snare drum sound
    const snareBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const snareData = snareBuffer.getChannelData(0);
    for (let i = 0; i < snareData.length; i++) {
      snareData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }
    drumBuffersRef.current.snare = snareBuffer;

    // Create hi-hat sound
    const hihatBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const hihatData = hihatBuffer.getChannelData(0);
    for (let i = 0; i < hihatData.length; i++) {
      hihatData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
    }
    drumBuffersRef.current.hihat = hihatBuffer;
  };

  const playDrumSound = (type: keyof DrumPattern) => {
    if (!audioContextRef.current || !drumBuffersRef.current[type]) return;

    const ctx = audioContextRef.current;
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    
    source.buffer = drumBuffersRef.current[type];
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    gainNode.gain.value = type === 'kick' ? 0.8 : type === 'snare' ? 0.6 : 0.4;
    source.start();
  };

  const playNote = (frequency: number, waveform: OscillatorType, volume: number, duration: number = 0.2) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const startPlayback = () => {
    if (!audioContextRef.current) return;

    setIsPlaying(true);
    setCurrentBeat(0);
    
    const beatDuration = 60 / bpm / 4; // 16th note duration
    
    intervalRef.current = setInterval(() => {
      setCurrentBeat(prevBeat => {
        const newBeat = (prevBeat + 1) % 8;
        
        // Play drum patterns
        if (drumPattern.kick[newBeat]) playDrumSound('kick');
        if (drumPattern.snare[newBeat]) playDrumSound('snare');
        if (drumPattern.hihat[newBeat]) playDrumSound('hihat');
        
        // Play synth notes based on simple patterns
        tracks.forEach(track => {
          if (track.isPlaying && newBeat % 2 === 0) {
            playNote(track.frequency, track.waveform, track.volume * 0.3, beatDuration * 2);
          }
        });
        
        return newBeat;
      });
    }, beatDuration * 1000);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const updateTrack = (trackId: string, updates: Partial<AudioTrack>) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, ...updates } : track
    ));
  };

  const toggleDrumBeat = (drum: keyof DrumPattern, beat: number) => {
    setDrumPattern(prev => ({
      ...prev,
      [drum]: prev[drum].map((active, index) => index === beat ? !active : active)
    }));
  };

  const handleAIGeneration = async () => {
    if (!aiPrompt.trim()) return;

    try {
      const response = await replitAI.generateResponse(aiPrompt, { 
        tool: 'music', 
        project: projectName, 
        currentWork: 'music composition' 
      });
      setAiSuggestions(response.suggestions || []);
      
      toast({
        title: "AI suggestions generated",
        description: response.content
      });
    } catch (error) {
      toast({
        title: "AI generation failed",
        description: "Could not generate music suggestions. Please try again.",
        variant: "destructive"
      });
    }
  };

  const saveProject = async () => {
    try {
      const projectData = {
        tracks,
        drumPattern,
        bpm,
        projectName
      };

      // Get current project ID or create new project
      let projectId = projectManager.getCurrentProjectId();
      if (!projectId) {
        const newProject = projectManager.createProject(projectName, 'Music project', ['music']);
        projectId = newProject.id;
      }

      await projectManager.updateProjectToolData(projectId, 'music', projectData);
      
      toast({
        title: "Project saved",
        description: `${projectName} has been saved successfully.`
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Could not save project. Please try again.",
        variant: "destructive"
      });
    }
  };

  const addNewTrack = () => {
    const newTrack: AudioTrack = {
      id: `track-${Date.now()}`,
      name: `Track ${tracks.length + 1}`,
      type: 'synth',
      isPlaying: true,
      volume: 0.5,
      frequency: 440,
      waveform: 'sine',
      notes: []
    };
    setTracks(prev => [...prev, newTrack]);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2" data-testid="text-music-studio-title">Music Studio</h1>
            <p className="text-muted-foreground">AI-powered music composition and production</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveProject} data-testid="button-save-music">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" data-testid="button-export-music">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Controls */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="tracks" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tracks" data-testid="tab-tracks">Tracks</TabsTrigger>
                <TabsTrigger value="drums" data-testid="tab-drums">Drums</TabsTrigger>
                <TabsTrigger value="ai" data-testid="tab-ai">AI Assistant</TabsTrigger>
              </TabsList>

              <TabsContent value="tracks" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Music className="w-5 h-5" />
                        Audio Tracks
                      </CardTitle>
                      <Button onClick={addNewTrack} size="sm" data-testid="button-add-track">
                        Add Track
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tracks.map(track => (
                      <div key={track.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Input 
                            value={track.name}
                            onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                            className="font-medium w-48"
                            data-testid={`input-track-name-${track.id}`}
                          />
                          <div className="flex items-center gap-2">
                            <Badge variant={track.isPlaying ? "default" : "secondary"}>
                              {track.type}
                            </Badge>
                            <Button
                              size="sm"
                              variant={track.isPlaying ? "default" : "outline"}
                              onClick={() => updateTrack(track.id, { isPlaying: !track.isPlaying })}
                              data-testid={`button-track-toggle-${track.id}`}
                            >
                              {track.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium">Volume</label>
                            <Slider
                              value={[track.volume]}
                              max={1}
                              step={0.1}
                              onValueChange={(value) => updateTrack(track.id, { volume: value[0] })}
                              data-testid={`slider-volume-${track.id}`}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Frequency</label>
                            <Slider
                              value={[track.frequency]}
                              min={100}
                              max={800}
                              onValueChange={(value) => updateTrack(track.id, { frequency: value[0] })}
                              data-testid={`slider-frequency-${track.id}`}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Waveform</label>
                            <Select value={track.waveform} onValueChange={(value: OscillatorType) => updateTrack(track.id, { waveform: value })}>
                              <SelectTrigger data-testid={`select-waveform-${track.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sine">Sine</SelectItem>
                                <SelectItem value="square">Square</SelectItem>
                                <SelectItem value="sawtooth">Sawtooth</SelectItem>
                                <SelectItem value="triangle">Triangle</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="drums" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Drum Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(drumPattern).map(([drum, pattern]) => (
                      <div key={drum} className="space-y-2">
                        <label className="text-sm font-medium capitalize">{drum}</label>
                        <div className="grid grid-cols-8 gap-1">
                          {pattern.map((active: boolean, index: number) => (
                            <Button
                              key={index}
                              size="sm"
                              variant={active ? "default" : "outline"}
                              className={`h-8 ${currentBeat === index && isPlaying ? 'ring-2 ring-primary' : ''}`}
                              onClick={() => toggleDrumBeat(drum as keyof DrumPattern, index)}
                              data-testid={`button-drum-${drum}-${index}`}
                            >
                              {index + 1}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Music Assistant</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Describe the music you want to create... (e.g., 'upbeat electronic dance track' or 'peaceful ambient soundscape')"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      data-testid="textarea-ai-prompt"
                    />
                    <Button onClick={handleAIGeneration} data-testid="button-generate-ai-music">
                      Generate AI Suggestions
                    </Button>
                    
                    {aiSuggestions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">AI Suggestions:</h4>
                        {aiSuggestions.map((suggestion, index) => (
                          <div key={index} className="p-3 bg-muted rounded-lg">
                            <p className="text-sm" data-testid={`text-ai-suggestion-${index}`}>{suggestion}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Playback Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Playback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center gap-2">
                  <Button
                    size="lg"
                    onClick={togglePlayback}
                    data-testid="button-play-pause"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      stopPlayback();
                      setCurrentBeat(0);
                    }}
                    data-testid="button-stop"
                  >
                    <Square className="w-6 h-6" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">BPM: {bpm}</label>
                  <Slider
                    value={[bpm]}
                    min={60}
                    max={180}
                    onValueChange={(value) => setBpm(value[0])}
                    data-testid="slider-bpm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Project Name</label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    data-testid="input-project-name"
                  />
                </div>

                {isPlaying && (
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Current Beat</div>
                    <div className="text-2xl font-bold text-primary" data-testid="text-current-beat">
                      {currentBeat + 1}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setTracks([]);
                    setDrumPattern({
                      kick: [false, false, false, false, false, false, false, false],
                      snare: [false, false, false, false, false, false, false, false],
                      hihat: [false, false, false, false, false, false, false, false]
                    });
                  }}
                  data-testid="button-clear-all"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}