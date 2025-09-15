// JavaScript Code Runner using Web Worker
export class JavaScriptRunner {
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
    this.writeToTerminal('$ node main.js', 'info');
    
    try {
      // Create a worker with the code to execute
      const workerCode = `
        // Intercept console methods
        const originalConsole = {
          log: console.log,
          error: console.error,
          warn: console.warn,
          info: console.info
        };
        
        console.log = (...args) => {
          self.postMessage({ type: 'stdout', data: args.map(arg => String(arg)).join(' ') });
        };
        
        console.error = (...args) => {
          self.postMessage({ type: 'stderr', data: args.map(arg => String(arg)).join(' ') });
        };
        
        console.warn = (...args) => {
          self.postMessage({ type: 'stdout', data: 'WARNING: ' + args.map(arg => String(arg)).join(' ') });
        };
        
        console.info = (...args) => {
          self.postMessage({ type: 'stdout', data: 'INFO: ' + args.map(arg => String(arg)).join(' ') });
        };
        
        // Global error handler
        self.addEventListener('error', (event) => {
          self.postMessage({ 
            type: 'stderr', 
            data: \`Error: \${event.message} at line \${event.lineno}\`
          });
        });
        
        // Execute the user code
        try {
          ${code}
          self.postMessage({ type: 'completed', exitCode: 0 });
        } catch (error) {
          self.postMessage({ 
            type: 'stderr', 
            data: \`Runtime Error: \${error.message}\` 
          });
          self.postMessage({ type: 'completed', exitCode: 1 });
        }
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
      
      // Set timeout for execution (30 seconds)
      setTimeout(() => {
        if (this.isRunning) {
          this.writeToTerminal('Execution timeout (30s)', 'stderr');
          this.stop();
        }
      }, 30000);
      
    } catch (error) {
      this.writeToTerminal(`Failed to start execution: ${error}`, 'stderr');
      this.handleCompletion(1);
    }
  }
  
  stop(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    if (this.isRunning) {
      this.writeToTerminal('Execution stopped by user', 'info');
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