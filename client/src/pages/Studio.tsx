import CreativeModule from "@/components/CreativeModule";
import AIAssistant from "@/components/AIAssistant";
import CollaborationPanel from "@/components/CollaborationPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings } from "lucide-react";

// Import generated images
import threeDImage from "@assets/generated_images/3D_Design_Interface_68eed078.png";
import musicImage from "@assets/generated_images/Music_Production_Studio_346551fb.png";
import videoImage from "@assets/generated_images/Video_Editing_Suite_0f983225.png";
import codeImage from "@assets/generated_images/AI_Code_Editor_7a973b59.png";

export default function Studio() {
  const handleNewProject = () => {
    console.log('Creating new project');
  };


  const handleSettings = () => {
    console.log('Opening studio settings');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Studio Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Creative Studio</h1>
            <p className="text-muted-foreground">Your AI-powered creative workspace</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleNewProject} data-testid="button-new-project">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
            <Button variant="outline" size="icon" onClick={handleSettings} data-testid="button-settings">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">4</div>
              <div className="text-sm text-muted-foreground">Active Tools</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">12</div>
              <div className="text-sm text-muted-foreground">Projects</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">3</div>
              <div className="text-sm text-muted-foreground">Team Members</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">98%</div>
              <div className="text-sm text-muted-foreground">AI Efficiency</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Creative Tools - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-semibold">Creative Tools</h2>
                <Badge variant="outline" data-testid="badge-tools-status">All Active</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CreativeModule
                  title="3D Designer"
                  description="AI-powered 3D modeling workspace"
                  image={threeDImage}
                  features={["Parametric", "Real-time", "AI Materials"]}
                  status="active"
                  aiSuggestions={5}
                />
                
                <CreativeModule
                  title="Music Studio"
                  description="Intelligent music composition"
                  image={musicImage}
                  features={["AI Compose", "Multi-track", "Virtual Instruments"]}
                  status="processing"
                  aiSuggestions={3}
                />
                
                <CreativeModule
                  title="Video Editor"
                  description="Professional video editing suite"
                  image={videoImage}
                  features={["Auto-cut", "Color Grade", "Motion Graphics"]}
                  status="complete"
                  aiSuggestions={2}
                />
                
                <CreativeModule
                  title="Code Editor"
                  description="AI-powered development environment"
                  image={codeImage}
                  features={["AI Copilot", "Multi-lang", "Live Collab"]}
                  status="active"
                  aiSuggestions={8}
                />
              </div>
            </div>
          </div>

          {/* Right Side Panels */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Assistant */}
            <div>
              <h2 className="font-display text-xl font-semibold mb-4">AI Assistant</h2>
              <AIAssistant />
            </div>

            {/* Team Collaboration */}
            <div>
              <h2 className="font-display text-xl font-semibold mb-4">Team Collaboration</h2>
              <CollaborationPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}