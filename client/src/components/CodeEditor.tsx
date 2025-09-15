import { useState, useRef, useEffect } from "react";
import { projectManager } from "@/lib/project-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Editor } from "@monaco-editor/react";
import { replitAI } from "@/lib/replit-ai";
import { isPreviewMode, buildHtmlRunner } from "@/lib/utils/export-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Plus
} from "lucide-react";

interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
}

export default function CodeEditor() {
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const editorRef = useRef<any>(null);
  
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

  // Auto-open preview if in preview mode
  useEffect(() => {
    if (isPreviewMode()) {
      setShowPreviewModal(true);
    }
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

  const handleRunCode = () => {
    console.log('Running code:', activeFileData?.content);
    // TODO: Implement actual code execution (sandbox environment)
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

  const handleCreateNewFile = () => {
    const newId = `file_${Date.now()}`;
    const newFile: CodeFile = {
      id: newId,
      name: "untitled.js",
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

  const handlePreview = () => {
    setShowPreviewModal(true);
  };

  const generatePreviewHtml = () => {
    return buildHtmlRunner(files.map(f => ({
      name: f.name,
      content: f.content,
      language: f.language
    })));
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
        <div className="w-64 border-r bg-muted/30">
          <div className="p-3 border-b bg-card">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Files</h3>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCreateNewFile} data-testid="button-new-file">
                <Plus className="w-3 h-3" />
              </Button>
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
                
                <Select value={activeFileData?.language} onValueChange={(value) => {
                  if (!activeFileData) return;
                  setFiles(prevFiles => 
                    prevFiles.map(file => 
                      file.id === activeFile 
                        ? { ...file, language: value }
                        : file
                    )
                  );
                }}>
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
          <div className="w-80 border-l bg-muted/30 flex flex-col">
            <div className="p-3 border-b bg-card">
              <h3 className="font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AI Assistant
              </h3>
            </div>

            <div className="flex-1 p-3 space-y-3">
              {/* AI Action Buttons */}
              <div className="space-y-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateCode}
                  disabled={isAIProcessing}
                  data-testid="button-generate-code"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Generate Code
                </Button>
                
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  size="sm"
                  onClick={handleDebugCode}
                  disabled={isAIProcessing}
                  data-testid="button-debug-code"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Debug Code
                </Button>
                
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  size="sm"
                  onClick={handleExplainCode}
                  disabled={isAIProcessing}
                  data-testid="button-explain-code"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Explain Code
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
                      <div className="text-sm leading-relaxed">{aiSuggestion}</div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Code Snippets */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Quick Templates</h4>
                <div className="space-y-1">
                  <Button 
                    className="w-full justify-start text-xs" 
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCodeChange(activeFileData?.content + "\n\n// AI Template: React Component\nfunction MyComponent() {\n  return <div>Hello AI!</div>;\n}")}
                    data-testid="template-react"
                  >
                    React Component
                  </Button>
                  <Button 
                    className="w-full justify-start text-xs" 
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCodeChange(activeFileData?.content + "\n\n// AI Template: Async Function\nasync function fetchData() {\n  try {\n    const response = await fetch('/api/data');\n    return response.json();\n  } catch (error) {\n    console.error('Error:', error);\n  }\n}")}
                    data-testid="template-async"
                  >
                    Async Function
                  </Button>
                  <Button 
                    className="w-full justify-start text-xs" 
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCodeChange(activeFileData?.content + "\n\n// AI Template: API Route\napp.get('/api/endpoint', (req, res) => {\n  res.json({ message: 'Hello from AI!' });\n});")}
                    data-testid="template-api"
                  >
                    API Route
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Code Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 border rounded-md overflow-hidden">
            <iframe
              srcDoc={generatePreviewHtml()}
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-96 border-0"
              title="Code Preview"
              data-testid="code-preview-iframe"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}