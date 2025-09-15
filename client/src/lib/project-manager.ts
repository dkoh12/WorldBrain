import { format } from "date-fns";

export interface CreativeProject {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
  tools: string[];
  data: {
    codeFiles?: CodeFile[];
    models3D?: any[];
    musicTracks?: any[];
    videoClips?: any[];
    collaborators?: string[];
    [key: string]: any; // Allow dynamic tool data
  };
  settings: {
    aiAssistanceEnabled: boolean;
    theme: 'dark' | 'light' | 'auto';
    autoSave: boolean;
  };
}

export interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
}

class ProjectManager {
  private readonly STORAGE_KEY = 'creativeStudio_projects';
  private readonly CURRENT_PROJECT_KEY = 'creativeStudio_currentProject';
  
  // Get all saved projects
  getAllProjects(): CreativeProject[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const projects = JSON.parse(saved);
        // Convert date strings back to Date objects
        return projects.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }));
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
    return [];
  }

  // Create a new project
  createProject(name: string, description: string = "", tools: string[] = []): CreativeProject {
    const project: CreativeProject = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      tools,
      data: {},
      settings: {
        aiAssistanceEnabled: true,
        theme: 'auto',
        autoSave: true
      }
    };

    this.saveProject(project);
    this.setCurrentProject(project.id);
    return project;
  }

  // Save/update a project
  saveProject(project: CreativeProject): void {
    try {
      const projects = this.getAllProjects();
      const existingIndex = projects.findIndex(p => p.id === project.id);
      
      project.updatedAt = new Date();
      
      if (existingIndex >= 0) {
        projects[existingIndex] = project;
      } else {
        projects.push(project);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
      console.log(`Project "${project.name}" saved successfully`);
    } catch (error) {
      console.error('Failed to save project:', error);
      throw new Error('Failed to save project');
    }
  }

  // Load a specific project
  getProject(id: string): CreativeProject | null {
    const projects = this.getAllProjects();
    return projects.find(p => p.id === id) || null;
  }

  // Delete a project
  deleteProject(id: string): boolean {
    try {
      const projects = this.getAllProjects();
      const filteredProjects = projects.filter(p => p.id !== id);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredProjects));
      
      // Clear current project if it was deleted
      if (this.getCurrentProjectId() === id) {
        localStorage.removeItem(this.CURRENT_PROJECT_KEY);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }

  // Duplicate a project
  duplicateProject(id: string, newName?: string): CreativeProject | null {
    const originalProject = this.getProject(id);
    if (!originalProject) return null;

    const duplicatedProject: CreativeProject = {
      ...originalProject,
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newName || `${originalProject.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.saveProject(duplicatedProject);
    return duplicatedProject;
  }

  // Set current active project
  setCurrentProject(id: string): void {
    localStorage.setItem(this.CURRENT_PROJECT_KEY, id);
  }

  // Get current active project ID
  getCurrentProjectId(): string | null {
    return localStorage.getItem(this.CURRENT_PROJECT_KEY);
  }

  // Get current active project
  getCurrentProject(): CreativeProject | null {
    const currentId = this.getCurrentProjectId();
    return currentId ? this.getProject(currentId) : null;
  }

  // Update project data for a specific tool
  updateProjectToolData(projectId: string, tool: string, data: any): void {
    const project = this.getProject(projectId);
    if (!project) return;

    // Update tool data
    switch (tool.toLowerCase()) {
      case 'code':
        project.data.codeFiles = data;
        break;
      case '3d':
        project.data.models3D = data;
        break;
      case 'music':
        project.data.musicTracks = data;
        break;
      case 'video':
        project.data.videoClips = data;
        break;
      default:
        project.data[tool] = data;
    }

    // Add tool to tools array if not already present
    if (!project.tools.includes(tool)) {
      project.tools.push(tool);
    }

    this.saveProject(project);
  }

  // Get projects by tool
  getProjectsByTool(tool: string): CreativeProject[] {
    return this.getAllProjects().filter(p => p.tools.includes(tool));
  }

  // Import project from file
  importProject(projectData: any): CreativeProject | null {
    try {
      const project: CreativeProject = {
        ...projectData,
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(projectData.createdAt || Date.now()),
        updatedAt: new Date(),
      };
      
      this.saveProject(project);
      return project;
    } catch (error) {
      console.error('Failed to import project:', error);
      return null;
    }
  }

  // Export project to downloadable file
  exportProject(id: string): void {
    const project = this.getProject(id);
    if (!project) return;

    const exportData = {
      ...project,
      exportedAt: new Date().toISOString(),
      version: "1.0"
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Get project statistics
  getProjectStats(): {
    totalProjects: number;
    totalTools: number;
    recentProjects: CreativeProject[];
    topTools: { tool: string; count: number }[];
  } {
    const projects = this.getAllProjects();
    const toolCounts = new Map<string, number>();

    projects.forEach(project => {
      project.tools.forEach(tool => {
        toolCounts.set(tool, (toolCounts.get(tool) || 0) + 1);
      });
    });

    const topTools = Array.from(toolCounts.entries())
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalProjects: projects.length,
      totalTools: toolCounts.size,
      recentProjects: projects
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 6),
      topTools
    };
  }

  // Search projects
  searchProjects(query: string): CreativeProject[] {
    const projects = this.getAllProjects();
    const searchTerm = query.toLowerCase();
    
    return projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm) ||
      project.description.toLowerCase().includes(searchTerm) ||
      project.tools.some(tool => tool.toLowerCase().includes(searchTerm))
    );
  }
}

// Export singleton instance
export const projectManager = new ProjectManager();

// Utility functions
export const formatProjectDate = (date: Date): string => {
  return format(date, 'MMM d, yyyy');
};

export const getProjectIcon = (tools: string[]): string => {
  if (tools.includes('code')) return '💻';
  if (tools.includes('3d')) return '🎯';
  if (tools.includes('music')) return '🎵';
  if (tools.includes('video')) return '🎬';
  return '🎨';
};

export const getToolDisplayName = (tool: string): string => {
  const toolNames: { [key: string]: string } = {
    'code': 'Code Editor',
    '3d': '3D Designer',
    'music': 'Music Studio',
    'video': 'Video Editor'
  };
  
  return toolNames[tool.toLowerCase()] || tool;
};