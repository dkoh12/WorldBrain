import { apiRequest } from './queryClient';
import { projectManager } from './project-manager';

// Share handlers for each creative tool
export const shareHandlers = {
  async shareCode(): Promise<string> {
    const currentProject = projectManager.getCurrentProject();
    const files = currentProject?.data.code || [];
    
    const shareData = {
      tool: 'code' as const,
      name: currentProject?.name || 'Untitled Code Project',
      data: {
        files,
        projectName: currentProject?.name || 'Untitled Project'
      }
    };
    
    const response = await apiRequest('POST', '/api/share', shareData);
    const result = await response.json();
    
    return result.url;
  },

  async share3D(): Promise<string> {
    const currentProject = projectManager.getCurrentProject();
    const sceneData = currentProject?.data.threeD || {};
    
    const shareData = {
      tool: '3d' as const,
      name: currentProject?.name || 'Untitled 3D Project',
      data: {
        scene: sceneData,
        projectName: currentProject?.name || 'Untitled 3D Project'
      }
    };
    
    const response = await apiRequest('POST', '/api/share', shareData);
    const result = await response.json();
    
    return result.url;
  },

  async shareMusic(): Promise<string> {
    const currentProject = projectManager.getCurrentProject();
    const musicData = (currentProject?.data.musicTracks as any) || {};
    
    const shareData = {
      tool: 'music' as const,
      name: musicData.projectName || 'Untitled Song',
      data: {
        tracks: musicData.tracks || [],
        drumPattern: musicData.drumPattern || {},
        bpm: musicData.bpm || 120,
        projectName: musicData.projectName || 'Untitled Song'
      }
    };
    
    const response = await apiRequest('POST', '/api/share', shareData);
    const result = await response.json();
    
    return result.url;
  },

  async shareVideo(): Promise<string> {
    const currentProject = projectManager.getCurrentProject();
    const videoData = currentProject?.data.video || {};
    
    const shareData = {
      tool: 'video' as const,
      name: videoData.projectName || 'Untitled Video',
      data: {
        timeline: videoData.timeline || [],
        projectName: videoData.projectName || 'Untitled Video'
      }
    };
    
    const response = await apiRequest('POST', '/api/share', shareData);
    const result = await response.json();
    
    return result.url;
  }
};

// Utility function to copy URL to clipboard and show native share dialog
export async function shareUrl(url: string, title: string) {
  // Try native Web Share API first
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        url: url
      });
      return;
    } catch (error) {
      // Fall back to clipboard
    }
  }
  
  // Fall back to copying to clipboard
  try {
    await navigator.clipboard.writeText(url);
    alert(`Share link copied to clipboard: ${url}`);
  } catch (error) {
    // Final fallback: show URL in alert
    alert(`Share URL: ${url}`);
  }
}