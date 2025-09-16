import { useState, useRef, useEffect } from "react";
import { projectManager } from "@/lib/project-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Editor } from "@monaco-editor/react";
import { replitAI } from "@/lib/replit-ai";
import { buildHtmlRunner } from "@/lib/utils/export-utils";
import TerminalPanel from "@/components/TerminalPanel";
import { JavaScriptRunner } from "@/lib/runners/jsRunner";
import { PythonRunner } from "@/lib/runners/pythonRunner";
import { 
  Play, 
  Save, 
  Download, 
  Share2, 
  Settings, 
  Bot, 
  Lightbulb, 
  Bug, 
  Sparkles,
  FileText,
  FolderOpen,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from "lucide-react";

interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
}

interface LanguagePreset {
  extension: string;
  template: string;
  defaultName: string;
}

const languagePresets: Record<string, LanguagePreset> = {
  javascript: {
    extension: 'js',
    template: `// Welcome to AI-Powered Code Editor
// Ask AI for help, generate functions, or debug your code!

function createAIAssistant() {
  console.log("Building amazing things with AI!");
  
  // TODO: Add your creative code here
  return "Ready to create!";
}

createAIAssistant();`,
    defaultName: 'main'
  },
  typescript: {
    extension: 'ts',
    template: `// Welcome to AI-Powered TypeScript Editor
// Strongly typed code with AI assistance!

interface AIAssistant {
  name: string;
  capabilities: string[];
}

function createAIAssistant(): AIAssistant {
  console.log("Building amazing things with TypeScript!");
  
  return {
    name: "AI Creative Assistant",
    capabilities: ["code generation", "debugging", "optimization"]
  };
}

const assistant = createAIAssistant();
console.log(assistant);`,
    defaultName: 'main'
  },
  python: {
    extension: 'py',
    template: `# Welcome to AI-Powered Python Editor
# Build amazing things with Python and AI!

def create_ai_assistant():
    print("Building amazing things with Python!")
    
    # TODO: Add your creative code here
    return "Ready to create!"

if __name__ == "__main__":
    result = create_ai_assistant()
    print(result)`,
    defaultName: 'main'
  },
  html: {
    extension: 'html',
    template: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Creative Studio</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            padding: 2rem;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to AI Creative Studio</h1>
        <p>Build amazing web experiences with AI assistance!</p>
    </div>
</body>
</html>`,
    defaultName: 'index'
  },
  css: {
    extension: 'css',
    template: `/* AI-Generated Styles */
body {
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #333;
  margin: 0;
  padding: 0;
}

.ai-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.ai-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 2rem;
  margin: 1rem 0;
}`,
    defaultName: 'styles'
  }
};

export default function CodeEditor() {
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [showTerminal, setShowTerminal] = useState(false);
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [htmlOutput, setHtmlOutput] = useState<string>("");
  const [showFilesPanel, setShowFilesPanel] = useState(true);
  const [showAssistantPanel, setShowAssistantPanel] = useState(true);
  const [showLanguageConfirmation, setShowLanguageConfirmation] = useState(false);
  const [pendingLanguageChange, setPendingLanguageChange] = useState<{ newLanguage: string; currentLanguage: string } | null>(null);
  const editorRef = useRef<any>(null);
  const jsRunner = useRef<JavaScriptRunner>(new JavaScriptRunner());
  const pythonRunner = useRef<PythonRunner>(new PythonRunner());
  
  // Load files from current project or use defaults
  const [files, setFiles] = useState<CodeFile[]>(() => {
    const currentProject = projectManager.getCurrentProject();
    
    if (currentProject && currentProject.data.code) {
      return currentProject.data.code;
    }
    
    // Fall back to localStorage for backward compatibility
    const saved = localStorage.getItem('codeEditor_files');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fall back to defaults if parsing fails
      }
    }
    
    return [
      {
        id: "main",
        name: "main.js",
        language: "javascript",
        content: `// Welcome to AI-Powered Code Editor
// Ask AI for help, generate functions, or debug your code!

function createAIAssistant() {
  console.log("Building amazing things with AI!");
  
  // TODO: Add your creative code here
  return "Ready to create!";
}

createAIAssistant();`
      },
      {
        id: "styles",
        name: "styles.css", 
        language: "css",
        content: `/* AI-Generated Styles */
body {
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #333;
}

.ai-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}`
      }
    ];
  });

  // Set active file to first available file
  const [activeFile, setActiveFile] = useState<string>(() => {
    return files.length > 0 ? files[0].id : "main";
  });

  // Monitor running status
  useEffect(() => {
    const checkRunningStatus = () => {
      const jsRunning = jsRunner.current.isCodeRunning();
      const pythonRunning = pythonRunner.current.isCodeRunning();
      setIsCodeRunning(jsRunning || pythonRunning);
    };

    const interval = setInterval(checkRunningStatus, 100);
    return () => clearInterval(interval);
  }, []);

  const activeFileData = files.find(f => f.id === activeFile);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure Monaco for better AI experience
    monaco.editor.defineTheme('ai-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A737D', fontStyle: 'italic' },
        { token: 'keyword', foreground: '79C0FF' },
        { token: 'string', foreground: 'A5D6FF' },
      ],
      colors: {
        'editor.background': '#0D1117',
        'editor.foreground': '#F0F6FC',
      }
    });
    
    monaco.editor.setTheme('ai-theme');
  };

  const handleCodeChange = (value: string | undefined) => {
    if (!value || !activeFileData) return;
    
    const updatedFiles = files.map(file => 
      file.id === activeFile 
        ? { ...file, content: value }
        : file
    );
    
    setFiles(updatedFiles);
    
    // Save to current project and localStorage (auto-save)
    setTimeout(() => {
      // Save to localStorage for backward compatibility
      localStorage.setItem('codeEditor_files', JSON.stringify(updatedFiles));
      
      // Save to current project if one exists
      const currentProjectId = projectManager.getCurrentProjectId();
      if (currentProjectId) {
        projectManager.updateProjectToolData(currentProjectId, 'code', updatedFiles);
      }
    }, 1000);
  };

  const handleRunCode = async () => {
    if (!activeFileData) return;
    
    // Show terminal if not visible
    if (!showTerminal) {
      setShowTerminal(true);
    }
    
    const language = activeFileData.language.toLowerCase();
    
    try {
      // Clear HTML output
      setHtmlOutput("");
      
      switch (language) {
        case 'javascript':
        case 'js':
          await jsRunner.current.runCode(activeFileData.content);
          break;
          
        case 'typescript':
        case 'ts':
          // For TypeScript, we'll transpile to JavaScript (simplified approach)
          setAiSuggestion("TypeScript execution: Converting to JavaScript...");
          // Remove type annotations (basic approach)
          const jsCode = activeFileData.content.replace(/:\s*\w+/g, '');
          await jsRunner.current.runCode(jsCode);
          break;
          
        case 'python':
        case 'py':
          await pythonRunner.current.runCode(activeFileData.content);
          break;
          
        case 'html':
        case 'css':
          // For HTML/CSS, generate output for the webview
          setHtmlOutput(buildHtmlRunner(files.map(f => ({
            name: f.name,
            content: f.content,
            language: f.language
          }))));
          if ((window as any).writeToTerminal) {
            (window as any).writeToTerminal('$ Rendering HTML/CSS output...', 'info');
            (window as any).writeToTerminal('Output rendered in Output tab', 'stdout');
            (window as any).setTerminalExitCode(0, 100);
            (window as any).writePrompt();
          }
          break;
          
        default:
          setAiSuggestion(`Code execution for ${language} is not yet supported in the browser environment. 
          
The AI Code Editor currently supports running:
• JavaScript/TypeScript (transpiled)
• Python (via WebAssembly)
• HTML/CSS (rendered output)

Try creating a web-based version of your ${language} code, or use the AI Assistant to help convert it to a supported language!`);
          break;
      }
    } catch (error) {
      console.error('Code execution error:', error);
      if ((window as any).writeToTerminal) {
        (window as any).writeToTerminal(`Execution failed: ${error}`, 'stderr');
      }
    }
  };

  const handleStopCode = () => {
    jsRunner.current.stop();
    pythonRunner.current.stop();
  };

  const handleSaveProject = () => {
    // Save to localStorage for backward compatibility
    localStorage.setItem('codeEditor_files', JSON.stringify(files));
    
    // Save to current project
    const currentProjectId = projectManager.getCurrentProjectId();
    if (currentProjectId) {
      projectManager.updateProjectToolData(currentProjectId, 'code', files);
      console.log('Project saved to project manager');
    } else {
      // Create new project if none exists
      const newProject = projectManager.createProject(
        `Code Project ${new Date().toLocaleDateString()}`,
        "Created from Code Editor",
        ['code']
      );
      projectManager.updateProjectToolData(newProject.id, 'code', files);
      console.log('New project created and saved');
    }
  };

  const handleGenerateCode = async () => {
    if (!activeFileData) return;
    
    setIsAIProcessing(true);
    try {
      const response = await replitAI.generateResponse(
        `Generate ${activeFileData.language} code for: creative web application`,
        {
          tool: "Code Editor",
          project: "AI Creative Platform",
          currentWork: `Writing ${activeFileData.language} in ${activeFileData.name}`
        }
      );
      
      setAiSuggestion(response.content);
    } catch (error) {
      console.error('AI code generation error:', error);
      setAiSuggestion("Sorry, AI assistance is temporarily unavailable.");
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleDebugCode = async () => {
    if (!activeFileData || !editorRef.current) return;
    
    setIsAIProcessing(true);
    try {
      const response = await replitAI.generateResponse(
        `Debug this ${activeFileData.language} code and suggest improvements: ${activeFileData.content}`,
        {
          tool: "Code Editor",
          project: "AI Creative Platform", 
          currentWork: `Debugging ${activeFileData.name}`
        }
      );
      
      setAiSuggestion(response.content);
    } catch (error) {
      console.error('AI debugging error:', error);
      setAiSuggestion("Sorry, AI debugging is temporarily unavailable.");
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleExplainCode = async () => {
    if (!activeFileData) return;
    
    setIsAIProcessing(true);
    try {
      const selectedText = editorRef.current?.getModel()?.getValueInRange(
        editorRef.current?.getSelection()
      ) || activeFileData.content.substring(0, 200);
      
      const response = await replitAI.generateResponse(
        `Explain this ${activeFileData.language} code in simple terms: ${selectedText}`,
        {
          tool: "Code Editor",
          project: "AI Creative Platform",
          currentWork: `Explaining code in ${activeFileData.name}`
        }
      );
      
      setAiSuggestion(response.content);
    } catch (error) {
      console.error('AI explanation error:', error);
      setAiSuggestion("Sorry, AI explanation is temporarily unavailable.");
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    if (!activeFileData) return;
    
    const currentLanguage = activeFileData.language;
    
    // Check if this is a significant language change that might warrant conversion
    const significantChange = (
      (currentLanguage === 'javascript' && newLanguage === 'python') ||
      (currentLanguage === 'python' && newLanguage === 'javascript') ||
      (currentLanguage === 'typescript' && newLanguage === 'python') ||
      (currentLanguage === 'python' && newLanguage === 'typescript')
    );
    
    if (significantChange && activeFileData.content.trim().length > 50) {
      // Show confirmation dialog for significant changes
      setPendingLanguageChange({ newLanguage, currentLanguage });
      setShowLanguageConfirmation(true);
    } else {
      // Apply language change immediately
      applyLanguageChange(newLanguage);
    }
  };

  const applyLanguageChange = (newLanguage: string) => {
    if (!activeFileData) return;
    
    const preset = languagePresets[newLanguage];
    if (!preset) return;
    
    // Create new filename with proper extension
    const baseName = activeFileData.name.split('.')[0];
    const isDefaultName = Object.values(languagePresets).some(p => 
      p.defaultName === baseName || baseName === 'untitled' || baseName === 'main'
    );
    
    const newFileName = isDefaultName 
      ? `${preset.defaultName}.${preset.extension}`
      : `${baseName}.${preset.extension}`;
    
    const updatedFiles = files.map(file => 
      file.id === activeFile
        ? { 
            ...file, 
            name: newFileName,
            language: newLanguage,
            content: preset.template
          }
        : file
    );
    
    setFiles(updatedFiles);
    
    // Save to current project
    const currentProjectId = projectManager.getCurrentProjectId();
    if (currentProjectId) {
      projectManager.updateProjectToolData(currentProjectId, 'code', updatedFiles);
    }
    
    // Save to localStorage for backward compatibility
    localStorage.setItem('codeEditor_files', JSON.stringify(updatedFiles));
  };

  const handleCreateNewFile = () => {
    const newId = `file_${Date.now()}`;
    const preset = languagePresets.javascript;
    const newFile: CodeFile = {
      id: newId,
      name: `untitled.${preset.extension}`,
      language: "javascript", 
      content: "// New file created with AI assistance\n\n"
    };
    
    const updatedFiles = [...files, newFile];
    setFiles(updatedFiles);
    setActiveFile(newId);
    
    // Save to current project
    const currentProjectId = projectManager.getCurrentProjectId();
    if (currentProjectId) {
      projectManager.updateProjectToolData(currentProjectId, 'code', updatedFiles);
    }
  };
  
  const handleToggleFilesPanel = () => {
    setShowFilesPanel(!showFilesPanel);
    // Trigger editor layout after a short delay to ensure proper resizing
    setTimeout(() => {
      editorRef.current?.layout();
    }, 300);
  };
  
  const handleToggleAssistantPanel = () => {
    setShowAssistantPanel(!showAssistantPanel);
    // Trigger editor layout after a short delay to ensure proper resizing
    setTimeout(() => {
      editorRef.current?.layout();
    }, 300);
  };

  const handleToggleTerminal = () => {
    setShowTerminal(!showTerminal);
  };

  const getLanguageIcon = (language: string) => {
    switch(language) {
      case 'javascript': return '🟨';
      case 'typescript': return '🔷';
      case 'css': return '🎨';
      case 'html': return '🌐';
      case 'python': return '🐍';
      default: return '📄';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-2 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-lg">AI Code Editor</h1>
          <Badge className="bg-primary/10 text-primary" data-testid="badge-ai-powered">
            <Bot className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleRunCode} data-testid="button-run-code">
            <Play className="w-4 h-4 mr-2" />
            Run
          </Button>
          <Button size="sm" variant="outline" onClick={handleSaveProject} data-testid="button-save-project">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button size="sm" variant="outline" data-testid="button-share-code">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button size="sm" variant="outline" data-testid="button-settings">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* File Explorer */}
        {showFilesPanel && (
          <div className="w-64 border-r bg-muted/30">
            <div className="p-3 border-b bg-card">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Files</h3>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCreateNewFile} data-testid="button-new-file">
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleToggleFilesPanel} data-testid="button-toggle-files">
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          
            <div className="p-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover-elevate text-sm ${
                    activeFile === file.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveFile(file.id)}
                  data-testid={`file-${file.id}`}
                >
                  <span>{getLanguageIcon(file.language)}</span>
                  <span className="truncate">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Toggle button when files panel is hidden */}
        {!showFilesPanel && (
          <div className="border-r bg-muted/30 flex items-start pt-3">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleToggleFilesPanel} data-testid="button-show-files">
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Editor and AI Panel */}
        <div className="flex-1 flex">
          {/* Code Editor */}
          <div className="flex-1 flex flex-col">
            <div className="border-b px-4 py-2 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{getLanguageIcon(activeFileData?.language || '')}</span>
                  <span className="font-medium">{activeFileData?.name}</span>
                </div>
                
                <Select value={activeFileData?.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="css">CSS</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex-1">
              <Editor
                height="100%"
                defaultLanguage={activeFileData?.language || "javascript"}
                language={activeFileData?.language || "javascript"}
                value={activeFileData?.content || ""}
                onMount={handleEditorDidMount}
                onChange={handleCodeChange}
                options={{
                  fontSize: 14,
                  minimap: { enabled: true },
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on'
                }}
                data-testid="monaco-editor"
              />
            </div>
          </div>

          {/* AI Assistant Panel */}
          {showAssistantPanel && (
            <div className="w-72 border-l bg-muted/30 flex flex-col overflow-hidden">
              <div className="p-3 border-b bg-card">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI Assistant
                  </h3>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleToggleAssistantPanel} data-testid="button-toggle-assistant">
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto overflow-x-hidden">
              {/* AI Action Buttons */}
              <div className="space-y-2">
                <Button 
                  className="w-full justify-start h-8 px-3 text-sm" 
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateCode}
                  disabled={isAIProcessing}
                  data-testid="button-generate-code"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  <span className="truncate">Generate Code</span>
                </Button>
                
                <Button 
                  className="w-full justify-start h-8 px-3 text-sm" 
                  variant="outline"
                  size="sm"
                  onClick={handleDebugCode}
                  disabled={isAIProcessing}
                  data-testid="button-debug-code"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  <span className="truncate">Debug Code</span>
                </Button>
                
                <Button 
                  className="w-full justify-start h-8 px-3 text-sm" 
                  variant="outline"
                  size="sm"
                  onClick={handleExplainCode}
                  disabled={isAIProcessing}
                  data-testid="button-explain-code"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="truncate">Explain Code</span>
                </Button>
              </div>

              {/* AI Response */}
              {(aiSuggestion || isAIProcessing) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      {isAIProcessing ? "AI is thinking..." : "AI Suggestion"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {isAIProcessing ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Analyzing your code...
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden">{aiSuggestion}</div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Code Snippets */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Quick Templates</h4>
                <div className="space-y-1">
                  <Button 
                    className="w-full justify-start text-xs h-8 px-2" 
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCodeChange(activeFileData?.content + "\n\n// AI Template: React Component\nfunction MyComponent() {\n  return <div>Hello AI!</div>;\n}")}
                    data-testid="template-react"
                  >
                    <span className="truncate">React Component</span>
                  </Button>
                  <Button 
                    className="w-full justify-start text-xs h-8 px-2" 
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCodeChange(activeFileData?.content + "\n\n// AI Template: Async Function\nasync function fetchData() {\n  try {\n    const response = await fetch('/api/data');\n    return response.json();\n  } catch (error) {\n    console.error('Error:', error);\n  }\n}")}
                    data-testid="template-async"
                  >
                    <span className="truncate">Async Function</span>
                  </Button>
                  <Button 
                    className="w-full justify-start text-xs h-8 px-2" 
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCodeChange(activeFileData?.content + "\n\n// AI Template: API Route\napp.get('/api/endpoint', (req, res) => {\n  res.json({ message: 'Hello from AI!' });\n});")}
                    data-testid="template-api"
                  >
                    <span className="truncate">API Route</span>
                  </Button>
                </div>
              </div>
            </div>
            </div>
          )}
          
          {/* Toggle button when assistant panel is hidden */}
          {!showAssistantPanel && (
            <div className="border-l bg-muted/30 flex items-start pt-3">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleToggleAssistantPanel} data-testid="button-show-assistant">
                <ChevronLeft className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Language Change Confirmation Dialog */}
      <AlertDialog open={showLanguageConfirmation} onOpenChange={setShowLanguageConfirmation}>
        <AlertDialogContent data-testid="dialog-language-change">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Convert Project Language?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You're switching from {pendingLanguageChange?.currentLanguage} to {pendingLanguageChange?.newLanguage}. 
              This will replace your current file content with a new template for the selected language.
              
              <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
                <strong>What will happen:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>File extension will be updated</li>
                  <li>Current content will be replaced with {pendingLanguageChange?.newLanguage} template</li>
                  <li>Your previous code will be lost</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowLanguageConfirmation(false);
                setPendingLanguageChange(null);
              }}
              data-testid="button-cancel-language-change"
            >
              Keep Current Language
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingLanguageChange) {
                  applyLanguageChange(pendingLanguageChange.newLanguage);
                }
                setShowLanguageConfirmation(false);
                setPendingLanguageChange(null);
              }}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-confirm-language-change"
            >
              Convert to {pendingLanguageChange?.newLanguage}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Terminal Panel */}
      <TerminalPanel
        isVisible={showTerminal}
        onToggle={handleToggleTerminal}
        isRunning={isCodeRunning}
        onRun={handleRunCode}
        onStop={handleStopCode}
        htmlContent={htmlOutput}
      />
    </div>
  );
}