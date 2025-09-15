// Python Code Runner using Pyodide WebAssembly
export class PythonRunner {
  private worker: Worker | null = null;
  private isRunning = false;
  private startTime = 0;

  async runCode(code: string): Promise<void> {
    if (this.isRunning) {
      this.stop();
    }

    this.isRunning = true;
    this.startTime = Date.now();
    
    // Write execution start to terminal
    this.writeToTerminal('$ python main.py', 'info');
    this.writeToTerminal('Loading Python environment...', 'info');
    
    try {
      // Create a worker with Pyodide
      const workerCode = `
        let pyodide = null;
        let loading = false;
        
        async function initPyodide() {
          if (pyodide || loading) return pyodide;
          
          loading = true;
          self.postMessage({ type: 'info', data: 'Downloading Python runtime...' });
          
          try {
            // Load Pyodide from CDN
            self.importScripts('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js');
            pyodide = await self.loadPyodide({ 
              indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' 
            });
            
            // Redirect stdout and stderr using Pyodide's API
            pyodide.setStdout({ 
              batched: (s) => self.postMessage({ type: 'stdout', data: s }) 
            });
            pyodide.setStderr({ 
              batched: (s) => self.postMessage({ type: 'stderr', data: s }) 
            });
            
            self.postMessage({ type: 'info', data: 'Python environment ready!' });
            return pyodide;
          } catch (error) {
            self.postMessage({ 
              type: 'stderr', 
              data: \`Failed to load Python: \${error.message}\` 
            });
            throw error;
          } finally {
            loading = false;
          }
        }
        
        self.addEventListener('message', async (event) => {
          const { code } = event.data;
          
          try {
            if (!pyodide) {
              await initPyodide();
            }
            
            // Execute the user code
            await pyodide.runPythonAsync(code);
            self.postMessage({ type: 'completed', exitCode: 0 });
            
          } catch (error) {
            self.postMessage({ 
              type: 'stderr', 
              data: \`Python Error: \${error.message}\` 
            });
            self.postMessage({ type: 'completed', exitCode: 1 });
          }
        });
        
        // Global error handler
        self.addEventListener('error', (event) => {
          self.postMessage({ 
            type: 'stderr', 
            data: \`Worker Error: \${event.message}\`
          });
          self.postMessage({ type: 'completed', exitCode: 1 });
        });
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
      
      // Handle worker messages
      this.worker.onmessage = (event) => {
        const { type, data, exitCode } = event.data;
        
        switch (type) {
          case 'stdout':
            this.writeToTerminal(data, 'stdout');
            break;
          case 'stderr':
            this.writeToTerminal(data, 'stderr');
            break;
          case 'info':
            this.writeToTerminal(data, 'info');
            break;
          case 'completed':
            this.handleCompletion(exitCode || 0);
            break;
        }
      };
      
      // Handle worker errors
      this.worker.onerror = (error) => {
        this.writeToTerminal(`Worker Error: ${error.message}`, 'stderr');
        this.handleCompletion(1);
      };
      
      // Send code to worker
      this.worker.postMessage({ code });
      
      // Set timeout for execution (60 seconds for Python due to initial load)
      setTimeout(() => {
        if (this.isRunning) {
          this.writeToTerminal('Execution timeout (60s)', 'stderr');
          this.stop();
        }
      }, 60000);
      
    } catch (error) {
      this.writeToTerminal(`Failed to start Python execution: ${error}`, 'stderr');
      this.handleCompletion(1);
    }
  }
  
  stop(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    if (this.isRunning) {
      this.writeToTerminal('Python execution stopped by user', 'info');
      this.handleCompletion(130); // SIGINT exit code
    }
  }
  
  private handleCompletion(exitCode: number): void {
    this.isRunning = false;
    const executionTime = Date.now() - this.startTime;
    
    // Clean up worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    // Update terminal with completion info
    this.writeToTerminal('', 'stdout'); // Empty line
    this.setTerminalExitCode(exitCode, executionTime);
    this.writePrompt();
  }
  
  private writeToTerminal(text: string, type: 'stdout' | 'stderr' | 'info'): void {
    if ((window as any).writeToTerminal) {
      (window as any).writeToTerminal(text, type);
    }
  }
  
  private writePrompt(): void {
    if ((window as any).writePrompt) {
      (window as any).writePrompt();
    }
  }
  
  private setTerminalExitCode(code: number, time: number): void {
    if ((window as any).setTerminalExitCode) {
      (window as any).setTerminalExitCode(code, time);
    }
  }
  
  isCodeRunning(): boolean {
    return this.isRunning;
  }
}