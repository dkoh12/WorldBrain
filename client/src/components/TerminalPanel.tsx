import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Square, Trash2, Copy } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TerminalPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  htmlContent?: string;
}

export default function TerminalPanel({ 
  isVisible, 
  onToggle, 
  isRunning, 
  onRun, 
  onStop,
  htmlContent 
}: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const [activeTab, setActiveTab] = useState("terminal");
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  
  // Handle terminal fitting when switching back to terminal tab
  useEffect(() => {
    if (activeTab === "terminal" && fitAddon.current && isVisible) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        fitAddon.current?.fit();
      }, 100);
    }
  }, [activeTab, isVisible]);

  useEffect(() => {
    if (isVisible && terminalRef.current && !terminalInstance.current) {
      // Initialize terminal
      const terminal = new Terminal({
        fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
        fontSize: 13,
        theme: {
          background: '#0D1117',
          foreground: '#F0F6FC',
          cursor: '#79C0FF',
          selectionBackground: '#264F78'
        },
        cursorBlink: true,
        allowTransparency: true
      });
      
      // Initialize fit addon
      const fit = new FitAddon();
      terminal.loadAddon(fit);
      
      // Open terminal
      terminal.open(terminalRef.current);
      fit.fit();
      
      // Store references
      terminalInstance.current = terminal;
      fitAddon.current = fit;
      
      // Welcome message
      terminal.writeln('\x1b[36mWelcome to AI Code Editor Terminal\x1b[0m');
      terminal.writeln('\x1b[90mClick Run to execute your code\x1b[0m');
      terminal.writeln('');
    }
    
    // Only dispose when panel is completely hidden, not when switching tabs
    return () => {
      if (terminalInstance.current && !isVisible) {
        terminalInstance.current.dispose();
        terminalInstance.current = null;
        fitAddon.current = null;
      }
    };
  }, [isVisible]);

  useEffect(() => {
    const handleResize = () => {
      if (fitAddon.current && isVisible) {
        setTimeout(() => fitAddon.current?.fit(), 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVisible]);

  const clearTerminal = () => {
    if (terminalInstance.current) {
      terminalInstance.current.clear();
      setExitCode(null);
      setExecutionTime(null);
    }
  };

  const copyOutput = async () => {
    if (terminalInstance.current) {
      const selection = terminalInstance.current.getSelection();
      if (selection) {
        await navigator.clipboard.writeText(selection);
      }
    }
  };

  const writeToTerminal = (text: string, type: 'stdout' | 'stderr' | 'info' = 'stdout') => {
    if (!terminalInstance.current) return;
    
    const colors = {
      stdout: '\x1b[37m', // white
      stderr: '\x1b[31m', // red
      info: '\x1b[36m'    // cyan
    };
    
    terminalInstance.current.writeln(`${colors[type]}${text}\x1b[0m`);
  };

  const writePrompt = () => {
    if (terminalInstance.current) {
      terminalInstance.current.write('\x1b[32m$ \x1b[0m');
    }
  };

  // Expose terminal writing methods
  useEffect(() => {
    // Make writeToTerminal available globally for runners
    (window as any).writeToTerminal = writeToTerminal;
    (window as any).writePrompt = writePrompt;
    (window as any).setTerminalExitCode = (code: number, time: number) => {
      setExitCode(code);
      setExecutionTime(time);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="border-t bg-background" style={{ height: '300px' }}>
      <div className="flex items-center justify-between p-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onRun}
            disabled={isRunning}
            data-testid="terminal-run-button"
          >
            <Play className="w-3 h-3 mr-1" />
            Run
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onStop}
            disabled={!isRunning}
            data-testid="terminal-stop-button"
          >
            <Square className="w-3 h-3 mr-1" />
            Stop
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={clearTerminal}
            data-testid="terminal-clear-button"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={copyOutput}
            data-testid="terminal-copy-button"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {executionTime !== null && (
            <span>Runtime: {executionTime}ms</span>
          )}
          {exitCode !== null && (
            <span className={exitCode === 0 ? 'text-green-500' : 'text-red-500'}>
              Exit: {exitCode}
            </span>
          )}
          {isRunning && (
            <span className="text-yellow-500">Running...</span>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="terminal" data-testid="tab-terminal">Terminal</TabsTrigger>
          <TabsTrigger value="webview" data-testid="tab-webview">Output</TabsTrigger>
        </TabsList>
        
        <TabsContent value="terminal" className="flex-1 p-0" forceMount>
          <div 
            ref={terminalRef} 
            className={`h-full w-full ${activeTab !== "terminal" ? "hidden" : ""}`}
            data-testid="terminal-content"
          />
        </TabsContent>
        
        <TabsContent value="webview" className="flex-1 p-1" forceMount>
          <div className={activeTab !== "webview" ? "hidden" : "h-full"}>
            <Card className="h-full">
              {htmlContent ? (
                <iframe
                  srcDoc={htmlContent}
                  sandbox="allow-scripts allow-same-origin"
                  className="w-full h-full border-0 rounded"
                  title="Code Output"
                  data-testid="output-iframe"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No visual output
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}