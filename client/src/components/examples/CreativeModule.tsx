import CreativeModule from '../CreativeModule';
import threeDImage from "@assets/generated_images/3D_Design_Interface_68eed078.png";
import musicImage from "@assets/generated_images/Music_Production_Studio_346551fb.png";
import videoImage from "@assets/generated_images/Video_Editing_Suite_0f983225.png";
import codeImage from "@assets/generated_images/AI_Code_Editor_7a973b59.png";

export default function CreativeModuleExample() {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl">
      <CreativeModule
        title="3D Designer"
        description="AI-powered 3D modeling and animation"
        image={threeDImage}
        features={["Parametric Modeling", "Real-time Rendering", "AI Materials"]}
        progress={75}
        status="active"
        aiSuggestions={5}
      />
      
      <CreativeModule
        title="Music Studio"
        description="Intelligent music composition and production"
        image={musicImage}
        features={["AI Composition", "Multi-track", "Virtual Instruments"]}
        progress={60}
        status="processing"
        aiSuggestions={3}
      />
      
      <CreativeModule
        title="Video Editor"
        description="Professional video editing with AI assistance"
        image={videoImage}
        features={["Auto-cut", "Color Grading", "Motion Graphics"]}
        progress={100}
        status="complete"
        aiSuggestions={2}
      />
      
      <CreativeModule
        title="Code Editor"
        description="AI-powered development environment"
        image={codeImage}
        features={["AI Copilot", "Multi-language", "Real-time Collab"]}
        progress={30}
        status="active"
        aiSuggestions={8}
      />
    </div>
  );
}