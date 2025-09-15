import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import Home from "@/pages/Home";
import Studio from "@/pages/Studio";
import Projects from "@/pages/Projects";
import Gallery from "@/pages/Gallery";
import Learn from "@/pages/Learn";
import CodeStudio from "@/pages/CodeStudio";
import ThreeDStudio from "@/pages/ThreeDStudio";
import MusicStudio from "@/pages/MusicStudio";
import VideoEditor from "@/pages/VideoEditor";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/studio" component={Studio} />
      <Route path="/projects" component={Projects} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/learn" component={Learn} />
      <Route path="/code" component={CodeStudio} />
      <Route path="/3d" component={ThreeDStudio} />
      <Route path="/music" component={MusicStudio} />
      <Route path="/video" component={VideoEditor} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Header />
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;