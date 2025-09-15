import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users, Video, MessageSquare, Share2, Mic, MicOff, VideoOff } from "lucide-react";

interface Collaborator {
  id: number;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'busy';
  role: string;
  currentTool: string;
}

interface Activity {
  id: number;
  user: string;
  action: string;
  timestamp: string;
  tool: string;
}

export default function CollaborationPanel() {
  // TODO: Remove mock functionality
  const collaborators: Collaborator[] = [
    {
      id: 1,
      name: "Sarah Chen",
      avatar: "/api/placeholder/32/32",
      status: 'online',
      role: "3D Artist",
      currentTool: "3D Designer"
    },
    {
      id: 2,
      name: "Mike Rodriguez",
      avatar: "/api/placeholder/32/32", 
      status: 'online',
      role: "Music Producer",
      currentTool: "Audio Studio"
    },
    {
      id: 3,
      name: "Emma Watson",
      avatar: "/api/placeholder/32/32",
      status: 'away',
      role: "Video Editor", 
      currentTool: "Video Suite"
    },
    {
      id: 4,
      name: "David Kim",
      avatar: "/api/placeholder/32/32",
      status: 'busy',
      role: "Developer",
      currentTool: "Code Editor"
    }
  ];

  const recentActivity: Activity[] = [
    { id: 1, user: "Sarah", action: "Updated 3D model materials", timestamp: "2m ago", tool: "3D Design" },
    { id: 2, user: "Mike", action: "Added new melody track", timestamp: "5m ago", tool: "Music" },
    { id: 3, user: "Emma", action: "Applied color correction", timestamp: "8m ago", tool: "Video" },
    { id: 4, user: "David", action: "Optimized render pipeline", timestamp: "12m ago", tool: "Code" }
  ];

  const handleStartCall = () => {
    console.log('Starting video call');
  };

  const handleToggleMic = () => {
    console.log('Toggling microphone');
  };

  const handleToggleVideo = () => {
    console.log('Toggling video');
  };

  const handleOpenChat = () => {
    console.log('Opening chat');
  };

  const handleShareProject = () => {
    console.log('Sharing project');
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500'; 
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            Team Collaboration
          </CardTitle>
          <Badge variant="outline" data-testid="badge-collaborators-count">
            {collaborators.filter(c => c.status === 'online').length} online
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Video Call Controls */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={handleStartCall}
            data-testid="button-start-call"
          >
            <Video className="w-3 h-3 mr-1" />
            Start Call
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleToggleMic}
            data-testid="button-toggle-mic"
          >
            <Mic className="w-3 h-3" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleToggleVideo}
            data-testid="button-toggle-video"
          >
            <VideoOff className="w-3 h-3" />
          </Button>
        </div>

        {/* Active Collaborators */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Active Now</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {collaborators.map((collaborator) => (
              <div 
                key={collaborator.id}
                className="flex items-center gap-3 p-2 rounded-lg hover-elevate cursor-pointer"
                data-testid={`collaborator-${collaborator.id}`}
              >
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={collaborator.avatar} alt={collaborator.name} />
                    <AvatarFallback className="text-xs">
                      {collaborator.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(collaborator.status)} rounded-full border-2 border-background`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{collaborator.name}</p>
                    <Badge variant="outline" className="text-xs" data-testid={`badge-role-${collaborator.id}`}>
                      {collaborator.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    Working in {collaborator.currentTool}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Recent Activity</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="text-xs space-y-1" data-testid={`activity-${activity.id}`}>
                <div className="flex justify-between items-start">
                  <span className="font-medium">{activity.user}</span>
                  <span className="text-muted-foreground">{activity.timestamp}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {activity.action}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={handleOpenChat}
            data-testid="button-open-chat"
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Chat
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleShareProject}
            data-testid="button-share-project"
          >
            <Share2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}