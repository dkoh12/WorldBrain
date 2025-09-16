import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Search, 
  Plus, 
  FolderOpen, 
  Clock, 
  Star, 
  Filter,
  MoreVertical,
  Play,
  Edit,
  Trash2,
  Share2,
  Download,
  Copy,
  Code2,
  Palette,
  Music,
  Video,
  Folder,
  Calendar,
  Settings,
  Users
} from "lucide-react";
import { 
  projectManager, 
  CreativeProject, 
  formatProjectDate, 
  getProjectIcon, 
  getToolDisplayName 
} from "@/lib/project-manager";

export default function Projects() {
  const [projects, setProjects] = useState<CreativeProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTool, setFilterTool] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isEditToolsDialogOpen, setIsEditToolsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<CreativeProject | null>(null);
  const [editProjectTools, setEditProjectTools] = useState<string[]>([]);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const allProjects = projectManager.getAllProjects();
    setProjects(allProjects);
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Project name required",
        description: "Please enter a name for your project",
        variant: "destructive"
      });
      return;
    }

    try {
      const newProject = projectManager.createProject(
        newProjectName.trim(), 
        newProjectDescription.trim(),
        selectedTools
      );
      
      loadProjects();
      setIsCreateDialogOpen(false);
      setNewProjectName("");
      setNewProjectDescription("");
      setSelectedTools([]);
      
      toast({
        title: "Project created!",
        description: `"${newProject.name}" is ready for your creativity`,
      });
    } catch (error) {
      toast({
        title: "Failed to create project",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleOpenProject = (projectId: string) => {
    projectManager.setCurrentProject(projectId);
    const project = projectManager.getProject(projectId);
    
    if (project) {
      toast({
        title: `Opened "${project.name}"`,
        description: "Continue your creative work!",
      });
      
      // Navigate based on the project's tools
      if (project.tools.includes('code')) {
        navigate('/code');
      } else if (project.tools.includes('video')) {
        navigate('/video');
      } else if (project.tools.includes('3d')) {
        navigate('/3d');
      } else if (project.tools.includes('music')) {
        navigate('/music');
      } else {
        // Fallback to studio if no specific tools or multiple tools
        navigate('/studio');
      }
    }
  };

  const handleDuplicateProject = (projectId: string) => {
    const duplicated = projectManager.duplicateProject(projectId);
    
    if (duplicated) {
      loadProjects();
      toast({
        title: "Project duplicated!",
        description: `Created "${duplicated.name}"`,
      });
    }
  };

  const handleDeleteProject = (projectId: string) => {
    const project = projectManager.getProject(projectId);
    
    if (project && window.confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      if (projectManager.deleteProject(projectId)) {
        loadProjects();
        toast({
          title: "Project deleted",
          description: `"${project.name}" has been removed`,
        });
      }
    }
  };

  const handleExportProject = (projectId: string) => {
    projectManager.exportProject(projectId);
    
    toast({
      title: "Project exported!",
      description: "Download will start shortly",
    });
  };

  const handleEditTools = (project: CreativeProject) => {
    setEditingProject(project);
    setEditProjectTools([...project.tools]);
    setIsEditToolsDialogOpen(true);
  };

  const handleSaveToolsEdit = () => {
    if (!editingProject) return;
    
    const updatedProject = {
      ...editingProject,
      tools: editProjectTools,
      updatedAt: new Date()
    };
    
    projectManager.saveProject(updatedProject);
    loadProjects();
    setIsEditToolsDialogOpen(false);
    setEditingProject(null);
    setEditProjectTools([]);
    
    toast({
      title: "Project updated!",
      description: `Tools updated for "${editingProject.name}"`
    });
  };

  const getStatusColor = (tools: string[]) => {
    if (tools.length === 0) return 'bg-gray-500/10 text-gray-600';
    if (tools.length === 1) return 'bg-yellow-500/10 text-yellow-600';
    if (tools.length >= 2) return 'bg-green-500/10 text-green-600';
    return 'bg-blue-500/10 text-blue-600';
  };

  const getStatusText = (tools: string[]) => {
    if (tools.length === 0) return 'Draft';
    if (tools.length === 1) return 'In Progress';
    if (tools.length >= 2) return 'Multi-Tool';
    return 'Active';
  };

  const getToolIcon = (tool: string) => {
    switch (tool.toLowerCase()) {
      case 'code':
        return <Code2 className="w-4 h-4" />;
      case '3d':
        return <Palette className="w-4 h-4" />;
      case 'music':
        return <Music className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <Folder className="w-4 h-4" />;
    }
  };

  // Filter projects based on search and tool filter
  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchQuery === "" || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTool = filterTool === "all" || 
      project.tools.some(tool => tool.toLowerCase().includes(filterTool.toLowerCase()));

    return matchesSearch && matchesTool;
  });

  // Get unique tools for filter dropdown
  const availableTools = Array.from(new Set(projects.flatMap(p => p.tools)));
  const stats = projectManager.getProjectStats();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Creative Projects</h1>
            <p className="text-muted-foreground">Manage your AI-powered creative work</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-project">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start a new creative project with AI assistance
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="My Amazing Project"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    data-testid="input-project-name"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="project-description">Description (Optional)</Label>
                  <Textarea
                    id="project-description"
                    placeholder="Describe your creative vision..."
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    data-testid="input-project-description"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Creative Tools (Select your focus areas)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'code', label: 'Code Editor', icon: '💻' },
                      { key: '3d', label: '3D Designer', icon: '🎨' },
                      { key: 'music', label: 'Music Studio', icon: '🎵' },
                      { key: 'video', label: 'Video Editor', icon: '🎬' }
                    ].map(tool => (
                      <Button
                        key={tool.key}
                        type="button"
                        variant={selectedTools.includes(tool.key) ? "default" : "outline"}
                        className="justify-start h-auto p-3"
                        onClick={() => {
                          setSelectedTools(prev => 
                            prev.includes(tool.key) 
                              ? prev.filter(t => t !== tool.key)
                              : [...prev, tool.key]
                          );
                        }}
                        data-testid={`button-tool-${tool.key}`}
                      >
                        <span className="mr-2">{tool.icon}</span>
                        {tool.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select one or more tools to focus on. You can change this later.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject} data-testid="button-confirm-create">
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-projects"
            />
          </div>
          
          <Select value={filterTool} onValueChange={setFilterTool}>
            <SelectTrigger className="w-48" data-testid="select-filter-tool">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Tools" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tools</SelectItem>
              {availableTools.map(tool => (
                <SelectItem key={tool} value={tool.toLowerCase()}>
                  <div className="flex items-center gap-2">
                    {getToolIcon(tool)}
                    {getToolDisplayName(tool)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">{stats.totalProjects}</div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{stats.totalTools}</div>
              <div className="text-sm text-muted-foreground">Tools Used</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stats.recentProjects.length}</div>
              <div className="text-sm text-muted-foreground">Recent Work</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {stats.topTools[0]?.count || 0}
              </div>
              <div className="text-sm text-muted-foreground">Top Tool Uses</div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id} 
                className="hover-elevate cursor-pointer" 
                onClick={() => handleOpenProject(project.id)}
                data-testid={`project-card-${project.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate mb-1" data-testid={`project-name-${project.id}`}>
                        {project.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description || "No description"}
                      </p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenProject(project.id)}>
                          <Play className="w-4 h-4 mr-2" />
                          Open
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTools(project);
                          }}
                          data-testid={`button-edit-tools-${project.id}`}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Edit Tools
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateProject(project.id)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportProject(project.id)}>
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Tools Used */}
                    <div className="flex flex-wrap gap-1">
                      {project.tools.slice(0, 3).map((tool) => (
                        <Badge key={tool} variant="secondary" className="text-xs">
                          <div className="flex items-center gap-1">
                            {getToolIcon(tool)}
                            {getToolDisplayName(tool)}
                          </div>
                        </Badge>
                      ))}
                      {project.tools.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.tools.length - 3} more
                        </Badge>
                      )}
                    </div>

                    {/* Status and Date */}
                    <div className="flex items-center justify-between text-sm">
                      <Badge className={getStatusColor(project.tools)}>
                        {getStatusText(project.tools)}
                      </Badge>
                      
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatProjectDate(project.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button 
                      size="sm" 
                      className="w-full" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProject(project.id);
                      }}
                      data-testid={`button-open-${project.id}`}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Continue Working
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">
              {projects.length === 0 ? "No projects yet" : "No projects match your search"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {projects.length === 0 
                ? "Create your first AI-powered creative project to get started"
                : "Try adjusting your search or filter criteria"
              }
            </p>
            {projects.length === 0 && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Project
                  </Button>
                </DialogTrigger>
              </Dialog>
            )}
          </div>
        )}
      </div>

      {/* Edit Tools Dialog */}
      <Dialog open={isEditToolsDialogOpen} onOpenChange={setIsEditToolsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tools - {editingProject?.name}</DialogTitle>
            <DialogDescription>
              Modify which creative tools are included in this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'code', label: 'Code Editor', icon: Code2 },
                { value: '3d', label: '3D Designer', icon: Palette },
                { value: 'music', label: 'Music Studio', icon: Music },
                { value: 'video', label: 'Video Editor', icon: Video }
              ].map(tool => (
                <div
                  key={tool.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    editProjectTools.includes(tool.value)
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  }`}
                  onClick={() => {
                    setEditProjectTools(prev =>
                      prev.includes(tool.value)
                        ? prev.filter(t => t !== tool.value)
                        : [...prev, tool.value]
                    );
                  }}
                  data-testid={`tool-toggle-${tool.value}`}
                >
                  <div className="flex items-center space-x-2">
                    <tool.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{tool.label}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditToolsDialogOpen(false)}
                data-testid="button-cancel-edit-tools"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveToolsEdit}
                data-testid="button-save-edit-tools"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}