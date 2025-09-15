import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Sparkles, Lightbulb, Palette, Code2, Music, Video } from "lucide-react";

interface Suggestion {
  id: number;
  type: 'creative' | 'technical' | 'optimization';
  icon: any;
  title: string;
  description: string;
  category: string;
}

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // TODO: Remove mock functionality 
  const suggestions: Suggestion[] = [
    {
      id: 1,
      type: 'creative',
      icon: Palette,
      title: "Color Harmony Enhancement",
      description: "Your 3D model could benefit from a complementary color scheme. Try adding warm oranges to balance the cool blues.",
      category: "3D Design"
    },
    {
      id: 2,
      type: 'technical',
      icon: Music,
      title: "Audio Optimization",
      description: "Consider adding a subtle reverb to the melody line around measure 16 to create more spatial depth.",
      category: "Music"
    },
    {
      id: 3,
      type: 'optimization',
      icon: Code2,
      title: "Code Efficiency",
      description: "Your render loop could be optimized by implementing object pooling for particle systems.",
      category: "Code"
    },
    {
      id: 4,
      type: 'creative',
      icon: Video,
      title: "Transition Suggestion",
      description: "A subtle crossfade between scenes 3 and 4 would enhance the narrative flow.",
      category: "Video"
    }
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    setIsProcessing(true);
    console.log('Sending message to AI:', message);
    
    // TODO: Remove mock functionality
    setTimeout(() => {
      setIsProcessing(false);
      setMessage("");
      console.log('AI response received');
    }, 2000);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    console.log('AI suggestion clicked:', suggestion.title);
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'creative': return 'bg-purple-500';
      case 'technical': return 'bg-blue-500';
      case 'optimization': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          AI Assistant
          <Badge className="ml-auto bg-green-500/10 text-green-600 dark:text-green-400" data-testid="badge-ai-status">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
            Active
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="text-xs" data-testid="button-analyze-project">
            <Sparkles className="w-3 h-3 mr-1" />
            Analyze Project
          </Button>
          <Button variant="outline" size="sm" className="text-xs" data-testid="button-generate-ideas">
            <Lightbulb className="w-3 h-3 mr-1" />
            Generate Ideas
          </Button>
        </div>

        {/* AI Suggestions */}
        <div className="flex-1 space-y-3 overflow-y-auto max-h-64">
          <h4 className="text-sm font-medium text-muted-foreground">Smart Suggestions</h4>
          {suggestions.map((suggestion) => {
            const IconComponent = suggestion.icon;
            return (
              <div 
                key={suggestion.id}
                className="p-3 bg-muted/30 rounded-lg hover-elevate cursor-pointer transition-all"
                onClick={() => handleSuggestionClick(suggestion)}
                data-testid={`suggestion-${suggestion.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 ${getTypeColor(suggestion.type)} rounded-md flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-sm font-medium truncate">{suggestion.title}</h5>
                      <Badge variant="outline" className="text-xs" data-testid={`badge-category-${suggestion.category.toLowerCase()}`}>
                        {suggestion.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chat Input */}
        <div className="space-y-2">
          <Textarea 
            placeholder="Ask AI anything about your creative work..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[80px] resize-none text-sm"
            data-testid="textarea-ai-chat"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {isProcessing ? "AI is thinking..." : "Press Enter to send"}
            </span>
            <Button 
              size="sm"
              onClick={handleSendMessage}
              disabled={isProcessing || !message.trim()}
              data-testid="button-send-message"
            >
              {isProcessing ? (
                <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}