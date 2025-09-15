import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, Play, Download, Share2, Bot } from "lucide-react";
import { useLocation } from "wouter";
import { downloadHandlers } from "@/lib/download-handlers";
import { shareHandlers, shareUrl } from "@/lib/share-handlers";
import { useToast } from "@/hooks/use-toast";

interface CreativeModuleProps {
  title: string;
  description: string;
  image: string;
  features: string[];
  progress?: number;
  status?: 'active' | 'processing' | 'complete';
  aiSuggestions?: number;
}

export default function CreativeModule({ 
  title, 
  description, 
  image, 
  features, 
  progress = 0,
  status = 'active',
  aiSuggestions = 0
}: CreativeModuleProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const handleOpen = () => {
    console.log(`Opening ${title} module`);
    
    // Navigate to specific creative tool
    if (title.toLowerCase().includes('code')) {
      navigate('/code');
    } else if (title.toLowerCase().includes('3d') || title.toLowerCase().includes('design')) {
      navigate('/3d');
    } else if (title.toLowerCase().includes('music')) {
      navigate('/music');
    } else if (title.toLowerCase().includes('video')) {
      navigate('/video');
    } else {
      console.log(`${title} tool will be available soon!`);
    }
  };

  const handlePreview = () => {
    console.log(`Previewing ${title}`);
    
    // Navigate to the tool with preview parameter
    if (title.toLowerCase().includes('code')) {
      navigate('/code?preview=1');
    } else if (title.toLowerCase().includes('3d') || title.toLowerCase().includes('design')) {
      navigate('/3d?preview=1');
    } else if (title.toLowerCase().includes('music')) {
      navigate('/music?preview=1');
    } else if (title.toLowerCase().includes('video')) {
      navigate('/video?preview=1');
    }
  };

  const handleDownload = async () => {
    console.log(`Downloading from ${title}`);
    
    try {
      if (title.toLowerCase().includes('code')) {
        await downloadHandlers.downloadCode();
        toast({ title: "Download started", description: "Code files exported successfully" });
      } else if (title.toLowerCase().includes('3d') || title.toLowerCase().includes('design')) {
        await downloadHandlers.download3D();
        toast({ title: "Download started", description: "3D scene exported successfully" });
      } else if (title.toLowerCase().includes('music')) {
        await downloadHandlers.downloadMusic();
        toast({ title: "Download started", description: "Music project exported successfully" });
      } else if (title.toLowerCase().includes('video')) {
        await downloadHandlers.downloadVideo();
        toast({ title: "Download started", description: "Video project exported successfully" });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: "Download failed", description: "Unable to export project", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    console.log(`Sharing ${title} project`);
    
    try {
      let shareUrlResult = '';
      
      if (title.toLowerCase().includes('code')) {
        shareUrlResult = await shareHandlers.shareCode();
      } else if (title.toLowerCase().includes('3d') || title.toLowerCase().includes('design')) {
        shareUrlResult = await shareHandlers.share3D();
      } else if (title.toLowerCase().includes('music')) {
        shareUrlResult = await shareHandlers.shareMusic();
      } else if (title.toLowerCase().includes('video')) {
        shareUrlResult = await shareHandlers.shareVideo();
      }
      
      if (shareUrlResult) {
        await shareUrl(shareUrlResult, `${title} Project`);
        toast({ title: "Share link created", description: "Project shared successfully" });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({ title: "Share failed", description: "Unable to create share link", variant: "destructive" });
    }
  };

  const getStatusColor = () => {
    switch(status) {
      case 'processing': return 'bg-yellow-500';
      case 'complete': return 'bg-green-500';
      default: return 'bg-primary';
    }
  };

  return (
    <Card className="hover-elevate transition-all duration-300 overflow-hidden">
      <div className="relative">
        <div 
          className="h-48 bg-cover bg-center bg-gray-100 dark:bg-gray-800"
          style={{ backgroundImage: `url(${image})` }}
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm" data-testid={`badge-status-${title.toLowerCase().replace(' ', '-')}`}>
            <div className={`w-2 h-2 rounded-full mr-1 ${getStatusColor()}`} />
            {status}
          </Badge>
          {aiSuggestions > 0 && (
            <Badge className="bg-primary/80 backdrop-blur-sm text-primary-foreground" data-testid={`badge-ai-suggestions-${title.toLowerCase().replace(' ', '-')}`}>
              <Bot className="w-3 h-3 mr-1" />
              {aiSuggestions} AI
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-display" data-testid={`title-${title.toLowerCase().replace(' ', '-')}`}>
              {title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1" data-testid={`description-${title.toLowerCase().replace(' ', '-')}`}>
              {description}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Features</h4>
          <div className="flex flex-wrap gap-1">
            {features.map((feature, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs"
                data-testid={`badge-feature-${feature.toLowerCase().replace(' ', '-')}`}
              >
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={handlePreview}
            data-testid={`button-preview-${title.toLowerCase().replace(' ', '-')}`}
          >
            <Play className="w-3 h-3 mr-1" />
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}