import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { FolderOpen, Plus, Search, Filter, MoreHorizontal, Users, Calendar, Star } from "lucide-react";

interface Project {
  id: number;
  name: string;
  type: string;
  progress: number;
  collaborators: number;
  lastModified: string;
  status: 'active' | 'completed' | 'draft';
  thumbnail: string;
}

export default function Projects() {
  // TODO: Remove mock functionality - replace with real project data
  const projects: Project[] = [
    {
      id: 1,
      name: "Futuristic City Model",
      type: "3D Design",
      progress: 85,
      collaborators: 3,
      lastModified: "2 hours ago",
      status: 'active',
      thumbnail: "/api/placeholder/200/120"
    },
    {
      id: 2,
      name: "Epic Soundtrack",
      type: "Music",
      progress: 100,
      collaborators: 2,
      lastModified: "1 day ago", 
      status: 'completed',
      thumbnail: "/api/placeholder/200/120"
    },
    {
      id: 3,
      name: "Product Demo Video",
      type: "Video",
      progress: 60,
      collaborators: 4,
      lastModified: "3 hours ago",
      status: 'active',
      thumbnail: "/api/placeholder/200/120"
    },
    {
      id: 4,
      name: "Interactive Dashboard",
      type: "Code",
      progress: 45,
      collaborators: 1,
      lastModified: "5 hours ago",
      status: 'active',
      thumbnail: "/api/placeholder/200/120"
    },
    {
      id: 5,
      name: "Character Animation",
      type: "3D Design",
      progress: 25,
      collaborators: 2,
      lastModified: "1 week ago",
      status: 'draft',
      thumbnail: "/api/placeholder/200/120"
    },
    {
      id: 6,
      name: "Ambient Soundscape",
      type: "Music",
      progress: 90,
      collaborators: 1,
      lastModified: "4 days ago",
      status: 'active',
      thumbnail: "/api/placeholder/200/120"
    }
  ];

  const handleCreateProject = () => {
    console.log('Creating new project');
  };

  const handleOpenProject = (projectId: number) => {
    console.log('Opening project:', projectId);
  };

  const handleSearchProjects = () => {
    console.log('Searching projects');
  };

  const handleFilterProjects = () => {
    console.log('Filtering projects');
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'draft': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case '3D Design': return '🎨';
      case 'Music': return '🎵';
      case 'Video': return '🎬';
      case 'Code': return '💻';
      default: return '📁';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Projects Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">My Projects</h1>
            <p className="text-muted-foreground">Manage your creative projects and collaborations</p>
          </div>
          <Button onClick={handleCreateProject} data-testid="button-create-project">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background"
              data-testid="input-search-projects"
            />
          </div>
          <Button variant="outline" onClick={handleFilterProjects} data-testid="button-filter">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">{projects.length}</div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{projects.filter(p => p.status === 'active').length}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{projects.filter(p => p.status === 'completed').length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">{projects.filter(p => p.status === 'draft').length}</div>
              <div className="text-sm text-muted-foreground">Drafts</div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover-elevate cursor-pointer" onClick={() => handleOpenProject(project.id)} data-testid={`project-card-${project.id}`}>
              <div className="relative">
                <div 
                  className="h-32 bg-muted rounded-t-lg bg-cover bg-center"
                  style={{ backgroundImage: `url(${project.thumbnail})` }}
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs" data-testid={`badge-type-${project.id}`}>
                    {getTypeIcon(project.type)} {project.type}
                  </Badge>
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg truncate pr-2" data-testid={`project-name-${project.id}`}>
                    {project.name}
                  </h3>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" data-testid={`progress-${project.id}`} />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{project.collaborators} collaborators</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{project.lastModified}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <Badge variant="outline" className={`capitalize ${project.status === 'completed' ? 'bg-blue-50 text-blue-700' : project.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      {project.status}
                    </Badge>
                    <Button size="sm" variant="ghost" data-testid={`button-favorite-${project.id}`}>
                      <Star className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State for when no projects match filter */}
        {projects.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">Create your first project to get started</p>
            <Button onClick={handleCreateProject}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}