// Utility functions for downloading and exporting content

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function toBlob(content: string, type: string = 'text/plain'): Blob {
  return new Blob([content], { type });
}

// Encode PCM audio data to WAV format
export function encodeWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const arrayBuffer = new ArrayBuffer(44 + length * numChannels * 2);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numChannels * 2, true);

  // Convert audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}

// Build a runnable HTML file from code files
export function buildHtmlRunner(files: { name: string; content: string; language: string }[]): string {
  const jsFiles = files.filter(f => f.language === 'javascript' || f.name.endsWith('.js'));
  const cssFiles = files.filter(f => f.language === 'css' || f.name.endsWith('.css'));
  const htmlFiles = files.filter(f => f.language === 'html' || f.name.endsWith('.html'));

  const mainHtml = htmlFiles.length > 0 ? htmlFiles[0].content : '';
  const allJs = jsFiles.map(f => f.content).join('\n\n');
  const allCss = cssFiles.map(f => f.content).join('\n\n');

  if (mainHtml) {
    // If there's HTML, inject CSS and JS
    let html = mainHtml;
    if (allCss) {
      html = html.replace('</head>', `  <style>\n${allCss}\n  </style>\n</head>`);
    }
    if (allJs) {
      html = html.replace('</body>', `  <script>\n${allJs}\n  </script>\n</body>`);
    }
    return html;
  } else {
    // Create a simple HTML wrapper
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Code Export</title>
  ${allCss ? `<style>\n${allCss}\n</style>` : ''}
</head>
<body>
  <div id="app">
    <h1>AI Generated Code</h1>
    <p>Open the browser console to see output</p>
  </div>
  ${allJs ? `<script>\n${allJs}\n</script>` : ''}
</body>
</html>`;
  }
}

// Get URL search parameters
export function getUrlParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

// Check if preview mode is enabled
export function isPreviewMode(): boolean {
  return getUrlParams().get('preview') === '1';
}