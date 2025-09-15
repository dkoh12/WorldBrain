import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Play, Pause, Square, Save, Download, Upload, Scissors, 
  Volume2, Eye, EyeOff, Film, Palette, Sparkles, RotateCcw,
  FastForward, Rewind, SkipBack, SkipForward
} from "lucide-react";
import { projectManager } from "@/lib/project-manager";
import { ReplitAI } from "@/lib/replit-ai";
import { useToast } from "@/hooks/use-toast";

interface VideoClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  type: 'video' | 'image' | 'text' | 'audio';
  src?: string;
  filters: VideoFilter[];
  visible: boolean;
  volume: number;
  layer: number;
}

interface VideoFilter {
  id: string;
  type: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'sepia' | 'grayscale';
  intensity: number;
}

interface Timeline {
  duration: number;
  fps: number;
  resolution: { width: number; height: number };
}

export default function VideoEditor() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [timeline, setTimeline] = useState<Timeline>({
    duration: 30,
    fps: 30,
    resolution: { width: 1920, height: 1080 }
  });
  
  const [clips, setClips] = useState<VideoClip[]>([
    {
      id: 'demo-1',
      name: 'Sample Video Clip',
      startTime: 0,
      duration: 5,
      type: 'video',
      filters: [],
      visible: true,
      volume: 1,
      layer: 0
    },
    {
      id: 'demo-2',
      name: 'Title Text',
      startTime: 2,
      duration: 3,
      type: 'text',
      filters: [{ id: 'f1', type: 'brightness', intensity: 1.2 }],
      visible: true,
      volume: 0,
      layer: 1
    }
  ]);

  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('Untitled Video');
  const [renderProgress, setRenderProgress] = useState(0);
  const [isRendering, setIsRendering] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const replitAI = new ReplitAI();

  // Initialize canvas and load project data
  useEffect(() => {
    const initCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 640;
      canvas.height = 360;

      // Draw initial preview
      drawPreview(ctx);
      
      toast({
        title: "Video Editor initialized",
        description: "Ready to create amazing videos!"
      });
    };

    const loadProjectData = () => {
      try {
        const currentProjectId = projectManager.getCurrentProjectId();
        if (currentProjectId) {
          const project = projectManager.getProject(currentProjectId);
          if (project && project.data.video) {
            const videoData = project.data.video as any;
            if (videoData.clips) setClips(videoData.clips);
            if (videoData.timeline) setTimeline(videoData.timeline);
            if (videoData.projectName) setProjectName(videoData.projectName);
            if (videoData.currentTime) setCurrentTime(videoData.currentTime);
            
            toast({
              title: "Project loaded",
              description: `Loaded video data for ${project.name}`
            });
          }
        }
      } catch (error) {
        console.error('Failed to load project data:', error);
      }
    };

    initCanvas();
    loadProjectData();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const drawPreview = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw visible clips at current time
    const visibleClips = clips
      .filter(clip => 
        clip.visible && 
        currentTime >= clip.startTime && 
        currentTime < clip.startTime + clip.duration
      )
      .sort((a, b) => a.layer - b.layer);

    visibleClips.forEach(clip => {
      drawClip(ctx, clip);
    });

    // Draw timeline indicator
    const timelinePosition = (currentTime / timeline.duration) * ctx.canvas.width;
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(timelinePosition, 0);
    ctx.lineTo(timelinePosition, ctx.canvas.height);
    ctx.stroke();
  };

  const drawClip = (ctx: CanvasRenderingContext2D, clip: VideoClip) => {
    const progress = (currentTime - clip.startTime) / clip.duration;
    
    switch (clip.type) {
      case 'video':
        // Simulate video frame with gradient
        const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, ctx.canvas.height);
        gradient.addColorStop(0, '#4f46e5');
        gradient.addColorStop(progress, '#7c3aed');
        gradient.addColorStop(1, '#ec4899');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        break;
        
      case 'text':
        ctx.fillStyle = '#ffffff';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(clip.name, ctx.canvas.width / 2, ctx.canvas.height / 2);
        break;
        
      case 'image':
        // Placeholder for image
        ctx.fillStyle = '#10b981';
        ctx.fillRect(50, 50, ctx.canvas.width - 100, ctx.canvas.height - 100);
        break;
    }

    // Apply filters
    clip.filters.forEach(filter => {
      applyFilter(ctx, filter);
    });
  };

  const applyFilter = (ctx: CanvasRenderingContext2D, filter: VideoFilter) => {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;

    switch (filter.type) {
      case 'brightness':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * filter.intensity);     // Red
          data[i + 1] = Math.min(255, data[i + 1] * filter.intensity); // Green
          data[i + 2] = Math.min(255, data[i + 2] * filter.intensity); // Blue
        }
        break;
        
      case 'contrast':
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, (data[i] - 128) * filter.intensity + 128));
          data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * filter.intensity + 128));
          data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * filter.intensity + 128));
        }
        break;
        
      case 'saturation':
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
          data[i] = Math.min(255, gray + (data[i] - gray) * filter.intensity);
          data[i + 1] = Math.min(255, gray + (data[i + 1] - gray) * filter.intensity);
          data[i + 2] = Math.min(255, gray + (data[i + 2] - gray) * filter.intensity);
        }
        break;
        
      case 'blur':
        // Simple box blur approximation for demonstration
        const blurRadius = Math.floor(filter.intensity * 3);
        if (blurRadius > 0) {
          for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 0.8 + 0.2 * 128);     // Simple blur effect
            data[i + 1] = Math.min(255, data[i + 1] * 0.8 + 0.2 * 128);
            data[i + 2] = Math.min(255, data[i + 2] * 0.8 + 0.2 * 128);
          }
        }
        break;
        
      case 'grayscale':
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        break;
        
      case 'sepia':
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
        break;
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const startPlayback = () => {
    setIsPlaying(true);
    
    intervalRef.current = setInterval(() => {
      setCurrentTime(prevTime => {
        const newTime = prevTime + 1/timeline.fps;
        if (newTime >= timeline.duration) {
          stopPlayback();
          return timeline.duration;
        }
        return newTime;
      });
    }, 1000 / timeline.fps);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const seekTo = (time: number) => {
    setCurrentTime(Math.max(0, Math.min(timeline.duration, time)));
  };

  const addClip = (type: VideoClip['type']) => {
    const newClip: VideoClip = {
      id: `clip-${Date.now()}`,
      name: `New ${type} clip`,
      startTime: currentTime,
      duration: 3,
      type,
      filters: [],
      visible: true,
      volume: type === 'audio' ? 1 : 0,
      layer: clips.length
    };
    setClips(prev => [...prev, newClip]);
  };

  const updateClip = (clipId: string, updates: Partial<VideoClip>) => {
    setClips(prev => prev.map(clip => 
      clip.id === clipId ? { ...clip, ...updates } : clip
    ));
  };

  const addFilter = (clipId: string, filterType: VideoFilter['type']) => {
    const newFilter: VideoFilter = {
      id: `filter-${Date.now()}`,
      type: filterType,
      intensity: 1
    };
    
    setClips(prev => prev.map(clip => 
      clip.id === clipId 
        ? { ...clip, filters: [...clip.filters, newFilter] }
        : clip
    ));
  };

  const updateFilter = (clipId: string, filterId: string, intensity: number) => {
    setClips(prev => prev.map(clip => 
      clip.id === clipId 
        ? {
            ...clip,
            filters: clip.filters.map(filter =>
              filter.id === filterId ? { ...filter, intensity } : filter
            )
          }
        : clip
    ));
  };

  const handleAIGeneration = async () => {
    if (!aiPrompt.trim()) return;

    try {
      const response = await replitAI.generateResponse(aiPrompt, { 
        tool: 'video', 
        project: projectName, 
        currentWork: 'video editing' 
      });
      setAiSuggestions(response.suggestions || []);
      
      toast({
        title: "AI suggestions generated",
        description: response.content
      });
    } catch (error) {
      toast({
        title: "AI generation failed",
        description: "Could not generate video suggestions. Please try again.",
        variant: "destructive"
      });
    }
  };

  const saveProject = async () => {
    try {
      const projectData = {
        clips,
        timeline,
        projectName,
        currentTime
      };

      let projectId = projectManager.getCurrentProjectId();
      if (!projectId) {
        const newProject = projectManager.createProject(projectName, 'Video project', ['video']);
        projectId = newProject.id;
      }

      await projectManager.updateProjectToolData(projectId, 'video', projectData);
      
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

  const simulateRender = async () => {
    setIsRendering(true);
    setRenderProgress(0);
    
    // Simulate rendering process
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setRenderProgress(i);
    }
    
    setIsRendering(false);
    toast({
      title: "Video rendered successfully",
      description: "Your video is ready for download!"
    });
  };

  // Update canvas when currentTime or clips change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawPreview(ctx);
  }, [currentTime, clips]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2" data-testid="text-video-editor-title">Video Editor</h1>
            <p className="text-muted-foreground">Professional video editing with AI assistance</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveProject} data-testid="button-save-video">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" onClick={simulateRender} disabled={isRendering} data-testid="button-render-video">
              <Download className="w-4 h-4 mr-2" />
              {isRendering ? 'Rendering...' : 'Render'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Video Preview */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Film className="w-5 h-5" />
                    Video Preview
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{timeline.resolution.width}x{timeline.resolution.height}</Badge>
                    <Badge variant="outline">{timeline.fps}fps</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-black rounded-lg overflow-hidden aspect-video">
                  <canvas 
                    ref={canvasRef}
                    className="w-full h-full object-contain"
                    data-testid="canvas-video-preview"
                  />
                </div>

                {/* Transport Controls */}
                <div className="flex items-center justify-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => seekTo(0)} data-testid="button-seek-start">
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => seekTo(currentTime - 1)} data-testid="button-rewind">
                    <Rewind className="w-4 h-4" />
                  </Button>
                  <Button size="lg" onClick={togglePlayback} data-testid="button-play-pause-video">
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => seekTo(currentTime + 1)} data-testid="button-forward">
                    <FastForward className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => seekTo(timeline.duration)} data-testid="button-seek-end">
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>

                {/* Timeline Scrubber */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{currentTime.toFixed(1)}s</span>
                    <span>{timeline.duration}s</span>
                  </div>
                  <Slider
                    value={[currentTime]}
                    max={timeline.duration}
                    step={0.1}
                    onValueChange={(value) => seekTo(value[0])}
                    className="w-full"
                    data-testid="slider-timeline"
                  />
                </div>

                {/* Render Progress */}
                {isRendering && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Rendering video...</span>
                      <span>{renderProgress}%</span>
                    </div>
                    <Progress value={renderProgress} className="w-full" data-testid="progress-render" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Timeline</span>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => addClip('video')} data-testid="button-add-video-clip">
                      <Film className="w-4 h-4 mr-1" />
                      Video
                    </Button>
                    <Button size="sm" onClick={() => addClip('text')} data-testid="button-add-text-clip">
                      <span className="text-sm mr-1">T</span>
                      Text
                    </Button>
                    <Button size="sm" onClick={() => addClip('image')} data-testid="button-add-image-clip">
                      <Eye className="w-4 h-4 mr-1" />
                      Image
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {clips.map(clip => (
                    <div 
                      key={clip.id}
                      className={`relative bg-muted rounded p-2 cursor-pointer transition-colors ${
                        selectedClip?.id === clip.id ? 'bg-primary/20' : 'hover:bg-muted/80'
                      }`}
                      onClick={() => setSelectedClip(clip)}
                      data-testid={`clip-${clip.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{clip.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{clip.type}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateClip(clip.id, { visible: !clip.visible });
                            }}
                            data-testid={`button-toggle-visibility-${clip.id}`}
                          >
                            {clip.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {clip.startTime}s - {clip.startTime + clip.duration}s (Layer {clip.layer})
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            <Tabs defaultValue="clip" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="clip" data-testid="tab-clip">Clip</TabsTrigger>
                <TabsTrigger value="effects" data-testid="tab-effects">Effects</TabsTrigger>
                <TabsTrigger value="ai" data-testid="tab-ai">AI</TabsTrigger>
              </TabsList>

              <TabsContent value="clip" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Clip Properties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedClip ? (
                      <>
                        <div>
                          <label className="text-sm font-medium">Name</label>
                          <Input 
                            value={selectedClip.name}
                            onChange={(e) => updateClip(selectedClip.id, { name: e.target.value })}
                            data-testid="input-clip-name"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Start Time: {selectedClip.startTime}s</label>
                          <Slider
                            value={[selectedClip.startTime]}
                            max={timeline.duration - selectedClip.duration}
                            step={0.1}
                            onValueChange={(value) => updateClip(selectedClip.id, { startTime: value[0] })}
                            data-testid="slider-clip-start-time"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Duration: {selectedClip.duration}s</label>
                          <Slider
                            value={[selectedClip.duration]}
                            min={0.1}
                            max={10}
                            step={0.1}
                            onValueChange={(value) => updateClip(selectedClip.id, { duration: value[0] })}
                            data-testid="slider-clip-duration"
                          />
                        </div>
                        {(selectedClip.type === 'video' || selectedClip.type === 'audio') && (
                          <div>
                            <label className="text-sm font-medium">Volume: {Math.round(selectedClip.volume * 100)}%</label>
                            <Slider
                              value={[selectedClip.volume]}
                              max={1}
                              step={0.1}
                              onValueChange={(value) => updateClip(selectedClip.id, { volume: value[0] })}
                              data-testid="slider-clip-volume"
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Select a clip to edit its properties
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="effects" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Filters & Effects
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedClip ? (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          {['brightness', 'contrast', 'saturation', 'blur', 'sepia', 'grayscale'].map(filterType => (
                            <Button
                              key={filterType}
                              size="sm"
                              variant="outline"
                              onClick={() => addFilter(selectedClip.id, filterType as VideoFilter['type'])}
                              data-testid={`button-add-filter-${filterType}`}
                            >
                              {filterType}
                            </Button>
                          ))}
                        </div>
                        
                        {selectedClip.filters.map(filter => (
                          <div key={filter.id} className="space-y-2 p-3 border rounded">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium capitalize">{filter.type}</span>
                              <Badge variant="secondary">{filter.intensity.toFixed(2)}</Badge>
                            </div>
                            <Slider
                              value={[filter.intensity]}
                              min={0}
                              max={2}
                              step={0.1}
                              onValueChange={(value) => updateFilter(selectedClip.id, filter.id, value[0])}
                              data-testid={`slider-filter-${filter.type}-${filter.id}`}
                            />
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Select a clip to add effects
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      AI Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Describe your video editing needs... (e.g., 'create a smooth transition between clips' or 'add cinematic color grading')"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      data-testid="textarea-ai-prompt-video"
                    />
                    <Button onClick={handleAIGeneration} className="w-full" data-testid="button-generate-ai-video">
                      Generate AI Suggestions
                    </Button>
                    
                    {aiSuggestions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">AI Suggestions:</h4>
                        {aiSuggestions.map((suggestion, index) => (
                          <div key={index} className="p-3 bg-muted rounded-lg">
                            <p className="text-sm" data-testid={`text-ai-suggestion-video-${index}`}>{suggestion}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Project Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Project Name</label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    data-testid="input-video-project-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Duration: {timeline.duration}s</label>
                  <Slider
                    value={[timeline.duration]}
                    min={10}
                    max={300}
                    onValueChange={(value) => setTimeline(prev => ({ ...prev, duration: value[0] }))}
                    data-testid="slider-timeline-duration"
                  />
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setClips([]);
                    setCurrentTime(0);
                    setSelectedClip(null);
                  }}
                  data-testid="button-clear-timeline"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear Timeline
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}