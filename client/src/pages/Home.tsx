import Hero from "@/components/Hero";
import CreativeModule from "@/components/CreativeModule";
import AIAssistant from "@/components/AIAssistant";
import CollaborationPanel from "@/components/CollaborationPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Users, Globe, TrendingUp, Award } from "lucide-react";
import { useLocation } from "wouter";

// Import generated images
import threeDImage from "@assets/generated_images/3D_Design_Interface_68eed078.png";
import musicImage from "@assets/generated_images/Music_Production_Studio_346551fb.png";
import videoImage from "@assets/generated_images/Video_Editing_Suite_0f983225.png";
import codeImage from "@assets/generated_images/AI_Code_Editor_7a973b59.png";

export default function Home() {
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    console.log('Get started with creative tools');
    navigate('/studio');
  };

  // TODO: Remove mock functionality
  const stats = [
    { icon: Users, label: "Active Users", value: "50K+", trend: "+23%" },
    { icon: Globe, label: "Projects Created", value: "125K+", trend: "+45%" },
    { icon: TrendingUp, label: "AI Generations", value: "2.3M+", trend: "+67%" },
    { icon: Award, label: "Success Rate", value: "98.5%", trend: "+5%" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Creative Tools Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20" data-testid="badge-tools">
              <Sparkles className="w-3 h-3 mr-1" />
              Creative Suite
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Your Complete Creative Toolkit
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Four powerful AI-enhanced tools that work seamlessly together to bring your creative visions to life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <CreativeModule
              title="3D Designer"
              description="AI-powered 3D modeling and animation with real-time rendering"
              image={threeDImage}
              features={["Parametric Modeling", "Real-time Ray Tracing", "AI Materials", "Animation Tools"]}
              status="active"
              aiSuggestions={5}
            />
            
            <CreativeModule
              title="Music Studio"
              description="Intelligent music composition and production suite"
              image={musicImage}
              features={["AI Composition", "Multi-track Recording", "Virtual Instruments", "Smart Mixing"]}
              status="processing"
              aiSuggestions={3}
            />
            
            <CreativeModule
              title="Video Editor"
              description="Professional video editing with AI-powered assistance"
              image={videoImage}
              features={["Auto-cut Detection", "Color Grading", "Motion Graphics", "Smart Transitions"]}
              status="complete"
              aiSuggestions={2}
            />
            
            <CreativeModule
              title="Code Editor"
              description="AI-powered development environment for creative coding"
              image={codeImage}
              features={["AI Copilot", "Multi-language Support", "Real-time Collab", "Smart Debugging"]}
              status="active"
              aiSuggestions={8}
            />
          </div>

          <div className="text-center">
            <Button 
              size="lg"
              onClick={handleGetStarted}
              data-testid="button-start-creating"
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Creating Now
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20" data-testid="badge-stats">
              <TrendingUp className="w-3 h-3 mr-1" />
              Platform Statistics
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Powering Creative Excellence Worldwide
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join thousands of creators who are pushing the boundaries of what's possible with AI-powered creative tools.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card key={index} className="text-center hover-elevate" data-testid={`stat-card-${index}`}>
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200" data-testid={`trend-${index}`}>
                      {stat.trend}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI & Collaboration Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20" data-testid="badge-ai-collab">
              <Users className="w-3 h-3 mr-1" />
              AI & Collaboration
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Intelligent Assistance & Seamless Teamwork
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Work smarter with AI-powered suggestions and collaborate in real-time with your team, no matter where they are.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-display text-2xl font-semibold mb-4">AI-Powered Creative Assistant</h3>
              <AIAssistant />
            </div>
            
            <div className="space-y-4">
              <h3 className="font-display text-2xl font-semibold mb-4">Real-time Team Collaboration</h3>
              <CollaborationPanel />
            </div>
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover-elevate" data-testid="feature-ai">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-4">AI-Powered Everything</h3>
                <p className="text-muted-foreground">
                  Every tool is enhanced with cutting-edge AI to accelerate your creative process and provide intelligent suggestions.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-elevate" data-testid="feature-realtime">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-4">Real-time Everything</h3>
                <p className="text-muted-foreground">
                  See changes instantly with real-time rendering, live collaboration, and immediate AI feedback across all tools.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover-elevate" data-testid="feature-unified">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-4">Unified Workspace</h3>
                <p className="text-muted-foreground">
                  All your creative tools in one place with seamless asset sharing and unified project management.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}