import { downloadBlob, toBlob, encodeWav, buildHtmlRunner } from './utils/export-utils';
import { projectManager } from './project-manager';

// Download handlers for each creative tool
export const downloadHandlers = {
  async downloadCode() {
    const currentProject = projectManager.getCurrentProject();
    const files = currentProject?.data.code || [];
    
    if (files.length === 0) {
      alert('No code files to download');
      return;
    }
    
    // Create HTML runner
    const htmlContent = buildHtmlRunner(files);
    const htmlBlob = toBlob(htmlContent, 'text/html');
    downloadBlob(htmlBlob, 'code-export.html');
    
    // Also export project data as JSON
    const projectData = {
      files,
      projectName: currentProject?.name || 'Untitled Project',
      exportedAt: new Date().toISOString()
    };
    const jsonBlob = toBlob(JSON.stringify(projectData, null, 2), 'application/json');
    downloadBlob(jsonBlob, 'code-project.json');
  },

  async download3D() {
    const currentProject = projectManager.getCurrentProject();
    const sceneData = currentProject?.data.threeD || {};
    
    // Export scene as PNG snapshot (would need actual canvas)
    // For now, export scene data as JSON
    const sceneExport = {
      scene: sceneData,
      projectName: currentProject?.name || 'Untitled 3D Project',
      exportedAt: new Date().toISOString()
    };
    
    const jsonBlob = toBlob(JSON.stringify(sceneExport, null, 2), 'application/json');
    downloadBlob(jsonBlob, '3d-scene.json');
  },

  async downloadMusic() {
    const currentProject = projectManager.getCurrentProject();
    const musicData = (currentProject?.data.musicTracks as any) || {};
    
    // Export music project data
    const musicExport = {
      tracks: musicData.tracks || [],
      drumPattern: musicData.drumPattern || {},
      bpm: musicData.bpm || 120,
      projectName: musicData.projectName || 'Untitled Song',
      exportedAt: new Date().toISOString()
    };
    
    const jsonBlob = toBlob(JSON.stringify(musicExport, null, 2), 'application/json');
    downloadBlob(jsonBlob, 'music-project.json');
    
    // TODO: Add actual WAV audio export using encodeWav
    console.log('Audio export would render audio to WAV file');
  },

  async downloadVideo() {
    const currentProject = projectManager.getCurrentProject();
    const videoData = (currentProject?.data.video as any) || {};
    
    // Export video project data
    const videoExport = {
      timeline: videoData.timeline || [],
      projectName: videoData.projectName || 'Untitled Video',
      exportedAt: new Date().toISOString()
    };
    
    const jsonBlob = toBlob(JSON.stringify(videoExport, null, 2), 'application/json');
    downloadBlob(jsonBlob, 'video-project.json');
    
    // TODO: Add actual video export using MediaRecorder
    console.log('Video export would render timeline to video file');
  }
};