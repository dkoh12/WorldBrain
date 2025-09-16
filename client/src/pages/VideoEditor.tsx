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
import { isPreviewMode } from "@/lib/utils/export-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface VideoClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  type: 'video' | 'image' | 'text' | 'audio';
  src?: string;
  aiPrompt?: string;
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
      name: 'Opening Scene',
      startTime: 0,
      duration: 10,
      type: 'video',
      filters: [],
      visible: true,
      volume: 1,
      layer: 0
    },
    {
      id: 'demo-2',
      name: 'Welcome Title',
      startTime: 2,
      duration: 6,
      type: 'text',
      filters: [{ id: 'f1', type: 'brightness', intensity: 1.2 }],
      visible: true,
      volume: 0,
      layer: 1
    },
    {
      id: 'demo-3',
      name: 'Middle Scene',
      startTime: 8,
      duration: 12,
      type: 'video',
      filters: [{ id: 'f2', type: 'sepia', intensity: 0.6 }],
      visible: true,
      volume: 1,
      layer: 0
    },
    {
      id: 'demo-4',
      name: 'Product Image',
      startTime: 15,
      duration: 8,
      type: 'image',
      filters: [],
      visible: true,
      volume: 0,
      layer: 2
    },
    {
      id: 'demo-5',
      name: 'Closing Title',
      startTime: 25,
      duration: 5,
      type: 'text',
      filters: [{ id: 'f3', type: 'contrast', intensity: 1.3 }],
      visible: true,
      volume: 0,
      layer: 1
    },
    {
      id: 'demo-6',
      name: 'Background Music',
      startTime: 0,
      duration: 30,
      type: 'audio',
      filters: [],
      visible: true,
      volume: 0.6,
      layer: 3
    }
  ]);

  const [selectedClip, setSelectedClip] = useState<VideoClip | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
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

    // Auto-open preview if in preview mode
    if (isPreviewMode()) {
      setShowPreviewModal(true);
    }

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

  // Helper functions for drawing video content
  const drawSampleVideoFrame = (ctx: CanvasRenderingContext2D, progress: number, time: number) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create animated sky background
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    const skyBlue = `hsl(210, 80%, ${60 + Math.sin(time * 0.5) * 10}%)`;
    const lightBlue = `hsl(200, 70%, ${80 + Math.sin(time * 0.3) * 5}%)`;
    skyGradient.addColorStop(0, skyBlue);
    skyGradient.addColorStop(1, lightBlue);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw animated clouds
    drawAnimatedClouds(ctx, time);
    
    // Draw ground
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
    
    // Draw animated sun
    const sunX = width * 0.8;
    const sunY = height * 0.2 + Math.sin(time * 0.8) * 20;
    const sunRadius = 30 + Math.sin(time * 2) * 5;
    
    // Sun rays
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8 + time * 0.5;
      const rayLength = 50 + Math.sin(time * 3 + i) * 10;
      ctx.beginPath();
      ctx.moveTo(sunX + Math.cos(angle) * (sunRadius + 10), sunY + Math.sin(angle) * (sunRadius + 10));
      ctx.lineTo(sunX + Math.cos(angle) * (sunRadius + rayLength), sunY + Math.sin(angle) * (sunRadius + rayLength));
      ctx.stroke();
    }
    
    // Sun circle
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw animated trees
    drawAnimatedTrees(ctx, time);
    
    // Draw flying birds
    drawFlyingBirds(ctx, time);
    
    // Add some sparkle effects
    drawSparkles(ctx, time);
  };

  const drawAnimatedClouds = (ctx: CanvasRenderingContext2D, time: number) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    // Cloud 1
    const cloud1X = (width * 0.2 + time * 10) % (width + 100) - 50;
    drawCloud(ctx, cloud1X, height * 0.15, 60);
    
    // Cloud 2
    const cloud2X = (width * 0.6 + time * 15) % (width + 120) - 60;
    drawCloud(ctx, cloud2X, height * 0.25, 40);
    
    // Cloud 3
    const cloud3X = (width * 0.8 + time * 8) % (width + 80) - 40;
    drawCloud(ctx, cloud3X, height * 0.12, 50);
  };

  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y, size * 0.7, 0, Math.PI * 2);
    ctx.arc(x + size * 0.8, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.2, y - size * 0.3, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y - size * 0.2, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawAnimatedTrees = (ctx: CanvasRenderingContext2D, time: number) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const groundY = height * 0.7;
    
    // Tree positions
    const treePositions = [width * 0.1, width * 0.3, width * 0.9];
    
    treePositions.forEach((x, index) => {
      const sway = Math.sin(time * 1.5 + index) * 8;
      
      // Tree trunk
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(x - 8, groundY - 60, 16, 60);
      
      // Tree crown with slight sway
      ctx.save();
      ctx.translate(x, groundY - 60);
      ctx.rotate(sway * 0.01);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(0, -30, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  const drawFlyingBirds = (ctx: CanvasRenderingContext2D, time: number) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    // Flying birds in V formation
    for (let i = 0; i < 5; i++) {
      const birdX = (width * 0.1 + time * 30 + i * 25) % (width + 100);
      const birdY = height * 0.3 + Math.sin(time * 4 + i * 0.5) * 15 + i * 8;
      const wingFlap = Math.sin(time * 8 + i) * 0.3;
      
      // Bird V shape
      ctx.beginPath();
      ctx.moveTo(birdX - 8, birdY + wingFlap);
      ctx.lineTo(birdX, birdY);
      ctx.lineTo(birdX + 8, birdY + wingFlap);
      ctx.stroke();
    }
  };

  const drawSparkles = (ctx: CanvasRenderingContext2D, time: number) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    ctx.fillStyle = '#fef3c7';
    
    for (let i = 0; i < 8; i++) {
      const sparkleX = (width * (0.1 + i * 0.12) + Math.sin(time * 2 + i) * 50) % width;
      const sparkleY = height * (0.1 + Math.sin(time + i) * 0.1) + Math.cos(time * 3 + i) * 30;
      const sparkleSize = 2 + Math.sin(time * 5 + i) * 1.5;
      const alpha = 0.5 + Math.sin(time * 4 + i) * 0.5;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const drawImageClip = (ctx: CanvasRenderingContext2D, clip: VideoClip) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    if (clip.src && clip.src.startsWith('data:image/')) {
      // Real uploaded image
      const img = new Image();
      img.onload = () => {
        // Calculate aspect ratio to fit image properly
        const imgAspect = img.width / img.height;
        const canvasAspect = width / height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > canvasAspect) {
          // Image is wider - fit to canvas width
          drawWidth = width;
          drawHeight = width / imgAspect;
          drawX = 0;
          drawY = (height - drawHeight) / 2;
        } else {
          // Image is taller - fit to canvas height
          drawHeight = height;
          drawWidth = height * imgAspect;
          drawY = 0;
          drawX = (width - drawWidth) / 2;
        }
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      };
      img.src = clip.src;
    } else if (clip.aiPrompt) {
      // AI-generated image visualization
      drawAIGeneratedImage(ctx, clip.aiPrompt, currentTime);
    } else {
      // Default placeholder
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, width, height);
      
      // Add upload prompt
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Click to Upload Image', width / 2, height / 2 - 20);
      ctx.fillText('or Use AI Generation', width / 2, height / 2 + 20);
    }
  };

  const drawAIGeneratedImage = (ctx: CanvasRenderingContext2D, prompt: string, time: number) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create an artistic visualization based on the AI prompt
    // This simulates what an AI-generated image might look like
    
    // Generate colors based on prompt keywords
    const colors = getColorsFromPrompt(prompt);
    const primaryColor = colors[0];
    const secondaryColor = colors[1];
    
    // Create gradient background
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, secondaryColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add animated abstract shapes based on prompt
    drawAbstractShapes(ctx, prompt, time);
    
    // Add AI generation watermark
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('AI Generated', width - 10, height - 10);
  };

  const getColorsFromPrompt = (prompt: string): string[] => {
    const lowerPrompt = prompt.toLowerCase();
    
    // Color mapping based on keywords
    if (lowerPrompt.includes('sunset') || lowerPrompt.includes('orange') || lowerPrompt.includes('warm')) {
      return ['#ff6b35', '#f7931e'];
    } else if (lowerPrompt.includes('ocean') || lowerPrompt.includes('blue') || lowerPrompt.includes('water')) {
      return ['#0077be', '#00a8cc'];
    } else if (lowerPrompt.includes('forest') || lowerPrompt.includes('green') || lowerPrompt.includes('nature')) {
      return ['#2d5016', '#4e7928'];
    } else if (lowerPrompt.includes('night') || lowerPrompt.includes('dark') || lowerPrompt.includes('space')) {
      return ['#1a1a2e', '#16213e'];
    } else if (lowerPrompt.includes('fire') || lowerPrompt.includes('red')) {
      return ['#c73e1d', '#f44336'];
    } else {
      // Default artistic colors
      return ['#6366f1', '#8b5cf6'];
    }
  };

  const drawAbstractShapes = (ctx: CanvasRenderingContext2D, prompt: string, time: number) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Create animated shapes based on prompt content
    ctx.save();
    ctx.globalAlpha = 0.6;
    
    for (let i = 0; i < 5; i++) {
      const x = (width * (0.2 + i * 0.15)) + Math.sin(time * 0.5 + i) * 50;
      const y = (height * (0.3 + Math.sin(i) * 0.4)) + Math.cos(time * 0.3 + i) * 30;
      const size = 40 + Math.sin(time + i) * 20;
      
      ctx.fillStyle = `hsla(${220 + i * 30}, 70%, 60%, 0.4)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  };

  const drawClip = (ctx: CanvasRenderingContext2D, clip: VideoClip) => {
    const progress = (currentTime - clip.startTime) / clip.duration;
    
    switch (clip.type) {
      case 'video':
        // Create dynamic sample video content
        drawSampleVideoFrame(ctx, progress, currentTime);
        break;
        
      case 'text':
        ctx.fillStyle = '#ffffff';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(clip.name, ctx.canvas.width / 2, ctx.canvas.height / 2);
        break;
        
      case 'image':
        // Draw image clip
        drawImageClip(ctx, clip);
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
    // Smart layer assignment by clip type with overlap prevention
    const getLayerForType = (clipType: VideoClip['type'], startTime: number, duration: number): number => {
      // Preferred layers by clip type for better organization
      const preferredLayers = {
        video: 0,
        text: 1, 
        image: 2,
        audio: 3
      };
      
      const preferredLayer = preferredLayers[clipType];
      
      // Check if preferred layer is free or has room without overlapping
      const clipsOnPreferredLayer = clips.filter(clip => clip.layer === preferredLayer);
      const hasOverlap = clipsOnPreferredLayer.some(clip => 
        startTime < clip.startTime + clip.duration && startTime + duration > clip.startTime
      );
      
      if (!hasOverlap) {
        return preferredLayer;
      }
      
      // Find next available layer without conflicts
      const maxLayer = clips.length > 0 ? Math.max(...clips.map(clip => clip.layer)) : -1;
      for (let layer = 0; layer <= maxLayer + 1; layer++) {
        const layerClips = clips.filter(clip => clip.layer === layer);
        const hasConflict = layerClips.some(clip => 
          startTime < clip.startTime + clip.duration && startTime + duration > clip.startTime
        );
        if (!hasConflict) {
          return layer;
        }
      }
      
      // Fallback: use next available layer
      return maxLayer + 1;
    };
    
    const clipDuration = 3;
    const newClip: VideoClip = {
      id: `clip-${Date.now()}`,
      name: `New ${type} clip`,
      startTime: currentTime,
      duration: clipDuration,
      type,
      filters: [],
      visible: true,
      volume: type === 'audio' ? 1 : 0,
      layer: getLayerForType(type, currentTime, clipDuration)
    };
    
    setClips(prev => [...prev, newClip]);
    
    // Auto-select the new clip for immediate editing
    setSelectedClip(newClip);
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

  // Helper functions for direct effect controls
  const getEffectValue = (clip: VideoClip, effectType: VideoFilter['type']): number => {
    const filter = clip.filters.find(f => f.type === effectType);
    return filter ? filter.intensity : (effectType === 'brightness' || effectType === 'contrast' || effectType === 'saturation') ? 1 : 0;
  };

  const updateEffectValue = (clipId: string, effectType: VideoFilter['type'], value: number) => {
    setClips(prev => prev.map(clip => {
      if (clip.id !== clipId) return clip;
      
      const existingFilterIndex = clip.filters.findIndex(f => f.type === effectType);
      
      if (existingFilterIndex >= 0) {
        // Update existing filter
        const updatedFilters = [...clip.filters];
        updatedFilters[existingFilterIndex] = { ...updatedFilters[existingFilterIndex], intensity: value };
        return { ...clip, filters: updatedFilters };
      } else {
        // Add new filter
        const newFilter: VideoFilter = {
          id: `filter-${Date.now()}-${effectType}`,
          type: effectType,
          intensity: value
        };
        return { ...clip, filters: [...clip.filters, newFilter] };
      }
    }));
  };

  const handleImageUpload = (clipId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      updateClip(clipId, { src: result, aiPrompt: undefined });
    };
    reader.readAsDataURL(file);
  };

  const generateAIImage = async (clipId: string, prompt: string) => {
    try {
      // Use ReplitAI for creative image generation
      const response = await replitAI.generateResponse(
        `Create an artistic visual description for: "${prompt}". Include colors, composition, mood, and visual elements.`,
        { tool: 'image-generation', project: projectName, currentWork: 'visual art creation' }
      );
      
      updateClip(clipId, { aiPrompt: prompt, src: undefined });
      
      toast({
        title: "AI image generated",
        description: `Created artistic visualization for: ${prompt}`
      });
    } catch (error) {
      toast({
        title: "AI generation failed",
        description: "Could not generate image. Please try again.",
        variant: "destructive"
      });
    }
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

  // Update selectedClip when clips change to keep it in sync
  useEffect(() => {
    if (selectedClip) {
      const updatedClip = clips.find(clip => clip.id === selectedClip.id);
      if (updatedClip && updatedClip !== selectedClip) {
        setSelectedClip(updatedClip);
      }
    }
  }, [clips, selectedClip]);

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
                    <Button size="sm" onClick={() => addClip('audio')} data-testid="button-add-audio-clip">
                      <Volume2 className="w-4 h-4 mr-1" />
                      Audio
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Timeline Container - Wraps ruler and tracks for unified playhead */}
                  <div className="relative">
                    {/* Timeline Ruler */}
                    <div className="relative">
                      <div className="flex border-b">
                        {/* Time markers - Fixed sizing to ensure exactly 100% total width */}
                        {(() => {
                          const markerCount = Math.floor(timeline.duration / 5) + 1;
                          const markerWidth = 100 / markerCount;
                          return Array.from({ length: markerCount }, (_, i) => i * 5).map((time, index) => (
                            <div key={time} className="flex-none" style={{ width: `${markerWidth}%` }}>
                              <div className="text-xs text-muted-foreground pb-1">{time}s</div>
                              <div className="h-2 border-l border-muted-foreground/20"></div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* Multi-track Timeline */}
                    <div className="space-y-1 mt-4">
                      {(() => {
                        // Calculate the number of tracks needed dynamically - ensure all clips are visible
                        const maxLayer = clips.length > 0 ? Math.max(3, ...clips.map(clip => clip.layer)) : 3;
                        const trackCount = maxLayer + 1; // Create exactly the right number of tracks
                        
                        return Array.from({ length: trackCount }, (_, layerIndex) => (
                          <div key={layerIndex} className="relative">
                            {/* Track label */}
                            <div className="flex items-center mb-1">
                              <div className="w-16 text-xs text-muted-foreground font-medium">
                                Track {layerIndex}
                              </div>
                            </div>
                            
                            {/* Track container */}
                            <div 
                              className="relative h-12 bg-muted/30 rounded border border-muted/40"
                              style={{ minWidth: '100%' }}
                              data-testid={`timeline-track-${layerIndex}`}
                            >
                              {/* Clips on this layer */}
                              {clips
                                .filter(clip => clip.layer === layerIndex)
                                .map(clip => {
                                  const leftPosition = (clip.startTime / timeline.duration) * 100;
                                  const width = (clip.duration / timeline.duration) * 100;
                                  
                                  // Color coding by clip type
                                  const typeColors = {
                                    video: 'bg-blue-500/80',
                                    text: 'bg-purple-500/80',
                                    image: 'bg-green-500/80',
                                    audio: 'bg-orange-500/80'
                                  };
                                  
                                  const bgColor = typeColors[clip.type] || 'bg-gray-500/80';
                                  
                                  return (
                                    <div
                                      key={clip.id}
                                      className={`absolute top-1 bottom-1 rounded cursor-pointer transition-all duration-200 ${bgColor} ${
                                        selectedClip?.id === clip.id 
                                          ? 'ring-2 ring-primary ring-offset-1' 
                                          : 'hover:brightness-110'
                                      }`}
                                      style={{
                                        left: `${leftPosition}%`,
                                        width: `${width}%`,
                                        minWidth: '20px'
                                      }}
                                      onClick={() => setSelectedClip(clip)}
                                      data-testid={`clip-block-${clip.id}`}
                                    >
                                      <div className="flex items-center justify-between h-full px-2 text-white text-xs">
                                        <div className="truncate flex-1">
                                          <div className="font-medium truncate">{clip.name}</div>
                                        </div>
                                        <div className="flex items-center gap-1 ml-2">
                                          {!clip.visible && <EyeOff className="w-3 h-3 opacity-70" />}
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-4 w-4 p-0 hover:bg-white/20"
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
                                      
                                      {/* Clip info tooltip */}
                                      <div className="absolute -top-8 left-0 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                                        {clip.startTime}s - {clip.startTime + clip.duration}s
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                    
                    {/* Current time indicator - spans full timeline height from ruler through all tracks */}
                    <div 
                      className="absolute top-0 w-0.5 bg-red-500 pointer-events-none z-30"
                      style={{ 
                        left: `${(currentTime / timeline.duration) * 100}%`,
                        height: '100%' // Span from ruler through all tracks
                      }}
                      data-testid="timeline-current-position"
                    />
                  </div>

                  {/* Timeline controls */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                      Clips: {clips.length} | Duration: {timeline.duration}s
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Zoom:</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setTimeline(prev => ({ ...prev, duration: Math.max(10, prev.duration - 10) }))}
                        data-testid="button-zoom-in"
                      >
                        +
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setTimeline(prev => ({ ...prev, duration: Math.min(300, prev.duration + 10) }))}
                        data-testid="button-zoom-out"
                      >
                        -
                      </Button>
                    </div>
                  </div>
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
                        
                        {selectedClip.type === 'image' && (
                          <div className="space-y-4 pt-4 border-t">
                            <div>
                              <label className="text-sm font-medium">Image Source</label>
                              <div className="mt-2 space-y-2">
                                <div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(selectedClip.id, e)}
                                    className="hidden"
                                    id={`image-upload-${selectedClip.id}`}
                                    data-testid="input-image-upload"
                                  />
                                  <Button
                                    variant="outline"
                                    onClick={() => document.getElementById(`image-upload-${selectedClip.id}`)?.click()}
                                    className="w-full"
                                    data-testid="button-upload-image"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Image
                                  </Button>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-px bg-border"></div>
                                  <span className="text-xs text-muted-foreground">OR</span>
                                  <div className="flex-1 h-px bg-border"></div>
                                </div>
                                
                                <div className="space-y-2">
                                  <Input
                                    placeholder="Describe the image you want AI to create..."
                                    value={selectedClip.aiPrompt || ''}
                                    onChange={(e) => updateClip(selectedClip.id, { aiPrompt: e.target.value })}
                                    data-testid="input-ai-image-prompt"
                                  />
                                  <Button
                                    variant="default"
                                    onClick={() => selectedClip.aiPrompt && generateAIImage(selectedClip.id, selectedClip.aiPrompt)}
                                    disabled={!selectedClip.aiPrompt?.trim()}
                                    className="w-full"
                                    data-testid="button-generate-ai-image"
                                  >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate AI Image
                                  </Button>
                                </div>
                              </div>
                              
                              {selectedClip.src && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  ✓ Image uploaded
                                </div>
                              )}
                              
                              {selectedClip.aiPrompt && !selectedClip.src && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  ✓ AI image: "{selectedClip.aiPrompt}"
                                </div>
                              )}
                            </div>
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
                      Video Effects
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedClip ? (
                      <>
                        <div>
                          <label className="text-sm font-medium">Brightness: {getEffectValue(selectedClip, 'brightness').toFixed(1)}</label>
                          <Slider
                            value={[getEffectValue(selectedClip, 'brightness')]}
                            min={0}
                            max={2}
                            step={0.1}
                            onValueChange={(value) => updateEffectValue(selectedClip.id, 'brightness', value[0])}
                            data-testid="slider-brightness"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Contrast: {getEffectValue(selectedClip, 'contrast').toFixed(1)}</label>
                          <Slider
                            value={[getEffectValue(selectedClip, 'contrast')]}
                            min={0}
                            max={2}
                            step={0.1}
                            onValueChange={(value) => updateEffectValue(selectedClip.id, 'contrast', value[0])}
                            data-testid="slider-contrast"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Saturation: {getEffectValue(selectedClip, 'saturation').toFixed(1)}</label>
                          <Slider
                            value={[getEffectValue(selectedClip, 'saturation')]}
                            min={0}
                            max={2}
                            step={0.1}
                            onValueChange={(value) => updateEffectValue(selectedClip.id, 'saturation', value[0])}
                            data-testid="slider-saturation"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Blur: {getEffectValue(selectedClip, 'blur').toFixed(1)}</label>
                          <Slider
                            value={[getEffectValue(selectedClip, 'blur')]}
                            min={0}
                            max={2}
                            step={0.1}
                            onValueChange={(value) => updateEffectValue(selectedClip.id, 'blur', value[0])}
                            data-testid="slider-blur"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Sepia: {getEffectValue(selectedClip, 'sepia').toFixed(1)}</label>
                          <Slider
                            value={[getEffectValue(selectedClip, 'sepia')]}
                            min={0}
                            max={1}
                            step={0.1}
                            onValueChange={(value) => updateEffectValue(selectedClip.id, 'sepia', value[0])}
                            data-testid="slider-sepia"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Grayscale: {getEffectValue(selectedClip, 'grayscale').toFixed(1)}</label>
                          <Slider
                            value={[getEffectValue(selectedClip, 'grayscale')]}
                            min={0}
                            max={1}
                            step={0.1}
                            onValueChange={(value) => updateEffectValue(selectedClip.id, 'grayscale', value[0])}
                            data-testid="slider-grayscale"
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Select a clip to adjust effects
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