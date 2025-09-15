import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Sparkles, Users, Zap } from "lucide-react";
import { useLocation } from "wouter";
import heroImage from "@assets/generated_images/AI_Creative_Studio_Hero_daee97ae.png";

export default function Hero() {
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    console.log('Get started clicked');
    navigate('/studio');
  };

  const handleWatchDemo = () => {
    console.log('Watch demo clicked');
    navigate('/learn');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Hero Background with Dark Wash */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(45deg, rgba(0,0,0,0.7) 0%, rgba(67,56,202,0.4) 50%, rgba(0,0,0,0.6) 100%), url(${heroImage})`
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="mb-8">
          <Badge variant="outline" className="bg-background/20 backdrop-blur-sm border-primary/20 text-white mb-4" data-testid="badge-new">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by Advanced AI
          </Badge>
          
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            The Ultimate
            <span className="text-white block">
              Creative AI Studio
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
            Design in 3D, compose music, edit videos, and code—all powered by cutting-edge AI. 
            Collaborate in real-time and bring your wildest creative visions to life.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <div className="flex items-center bg-background/10 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
            <Zap className="w-4 h-4 mr-2 text-primary" />
            <span className="text-sm font-medium">AI-Powered Tools</span>
          </div>
          <div className="flex items-center bg-background/10 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
            <Users className="w-4 h-4 mr-2 text-primary" />
            <span className="text-sm font-medium">Real-time Collaboration</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="text-lg px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleGetStarted}
            data-testid="button-get-started"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Start Creating Now
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 py-3 bg-background/20 backdrop-blur-sm border-white/30 text-white hover:bg-background/30"
            onClick={handleWatchDemo}
            data-testid="button-watch-demo"
          >
            <Play className="w-5 h-5 mr-2" />
            Watch Demo
          </Button>
        </div>
      </div>
    </section>
  );
}