import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { replitAI } from "@/lib/replit-ai";
import { projectManager } from "@/lib/project-manager";
import * as THREE from "three";
import { 
  Save, 
  Download, 
  RotateCcw,
  Move3D,
  Plus,
  Trash2,
  Box as BoxIcon,
  Circle,
  Cylinder as CylinderIcon,
  Lightbulb,
  Bot,
  Sparkles,
  Play,
  Settings,
  RotateCw,
  ZoomIn,
  ZoomOut
} from "lucide-react";

interface SceneObject {
  id: string;
  type: 'box' | 'sphere' | 'cylinder' | 'torus' | 'plane';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  material: 'standard' | 'basic' | 'phong' | 'wireframe';
  name: string;
  mesh?: THREE.Mesh;
}

interface Scene3D {
  id: string;
  name: string;
  objects: SceneObject[];
  environment: string;
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
}

export default function ThreeDDesigner() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const raycasterRef = useRef<THREE.Raycaster>();
  const mouseRef = useRef<THREE.Vector2>();
  const animationIdRef = useRef<number>();

  const [scene3D, setScene3D] = useState<Scene3D>({
    id: 'default',
    name: 'Untitled Scene',
    objects: [],
    environment: 'studio',
    camera: {
      position: [10, 10, 10],
      target: [0, 0, 0]
    }
  });

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [cameraControls, setCameraControls] = useState({
    autoRotate: false,
    zoom: 1
  });
  
  const [webglError, setWebglError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const selectedObject = scene3D.objects.find(obj => obj.id === selectedObjectId);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    try {
      // Check WebGL support first
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        setWebglError('WebGL is not supported in this browser. Please use a modern browser with WebGL support.');
        return;
      }

      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Renderer setup with error handling
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ 
          antialias: true,
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: true
        });
      } catch (error) {
        console.warn('WebGL renderer failed, trying fallback...', error);
        try {
          renderer = new THREE.WebGLRenderer({ 
            antialias: false,
            failIfMajorPerformanceCaveat: false,
            preserveDrawingBuffer: false
          });
        } catch (fallbackError) {
          setWebglError('Failed to create 3D renderer. Your browser may not support WebGL or it may be disabled.');
          return;
        }
      }
      
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;
      mountRef.current.appendChild(renderer.domElement);

      setIsInitialized(true);

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(50, 50, 50);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      // Grid helper
      const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
      scene.add(gridHelper);

      // Raycaster for object selection
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      raycasterRef.current = raycaster;
      mouseRef.current = mouse;

      // Mouse events
      const handleMouseClick = (event: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
          const clickedObject = intersects[0].object;
          const sceneObject = scene3D.objects.find(obj => obj.mesh === clickedObject);
          if (sceneObject) {
            setSelectedObjectId(sceneObject.id);
          }
        } else {
          setSelectedObjectId(null);
        }
      };

      // Mouse controls for camera
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };

      const handleMouseDown = (event: MouseEvent) => {
        isDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
      };

      const handleMouseMove = (event: MouseEvent) => {
        if (!isDragging) return;

        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;

        // Rotate camera around the scene
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position);
        spherical.theta -= deltaX * 0.01;
        spherical.phi += deltaY * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);

        previousMousePosition = { x: event.clientX, y: event.clientY };
      };

      const handleMouseUp = () => {
        isDragging = false;
      };

      const handleWheel = (event: WheelEvent) => {
        const scale = event.deltaY > 0 ? 1.1 : 0.9;
        camera.position.multiplyScalar(scale);
        setCameraControls(prev => ({ ...prev, zoom: prev.zoom * scale }));
      };

      renderer.domElement.addEventListener('click', handleMouseClick);
      renderer.domElement.addEventListener('mousedown', handleMouseDown);
      renderer.domElement.addEventListener('mousemove', handleMouseMove);
      renderer.domElement.addEventListener('mouseup', handleMouseUp);
      renderer.domElement.addEventListener('wheel', handleWheel);

      // Animation loop
      const animate = () => {
        if (cameraControls.autoRotate) {
          const time = Date.now() * 0.001;
          camera.position.x = Math.cos(time) * 15;
          camera.position.z = Math.sin(time) * 15;
          camera.lookAt(0, 0, 0);
        }

        renderer.render(scene, camera);
        animationIdRef.current = requestAnimationFrame(animate);
      };
      animate();

      // Handle resize
      const handleResize = () => {
        if (!mountRef.current) return;
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
        }
        
        if (renderer?.domElement) {
          renderer.domElement.removeEventListener('click', handleMouseClick);
          renderer.domElement.removeEventListener('mousedown', handleMouseDown);
          renderer.domElement.removeEventListener('mousemove', handleMouseMove);
          renderer.domElement.removeEventListener('mouseup', handleMouseUp);
          renderer.domElement.removeEventListener('wheel', handleWheel);
          
          if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
            mountRef.current.removeChild(renderer.domElement);
          }
          renderer.dispose();
        }
        
        window.removeEventListener('resize', handleResize);
      };
    } catch (initError) {
      console.error('Failed to initialize 3D scene:', initError);
      setWebglError('Failed to initialize 3D graphics. This may be due to browser limitations or hardware compatibility.');
    }
  }, [cameraControls.autoRotate]);

  // Update objects in scene when state changes
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear existing meshes
    const objectsToRemove = sceneRef.current.children.filter(child => 
      child instanceof THREE.Mesh && child.userData.isSceneObject
    );
    objectsToRemove.forEach(obj => sceneRef.current!.remove(obj));

    // Add all objects from state
    scene3D.objects.forEach(obj => {
      const mesh = createMesh(obj);
      if (mesh) {
        mesh.userData.isSceneObject = true;
        mesh.userData.objectId = obj.id;
        sceneRef.current!.add(mesh);
        
        // Update object reference
        obj.mesh = mesh;
        
        // Highlight selected object
        if (obj.id === selectedObjectId) {
          const wireframe = new THREE.WireframeGeometry(mesh.geometry);
          const line = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({ color: 0xffff00 }));
          line.userData.isSelectionWireframe = true;
          sceneRef.current!.add(line);
        }
      }
    });

    // Remove old selection wireframes
    const wireframesToRemove = sceneRef.current.children.filter(child => 
      child.userData.isSelectionWireframe
    );
    wireframesToRemove.forEach(wireframe => sceneRef.current!.remove(wireframe));

    // Add new selection wireframe
    if (selectedObjectId) {
      const selectedObj = scene3D.objects.find(obj => obj.id === selectedObjectId);
      if (selectedObj && selectedObj.mesh) {
        const wireframe = new THREE.WireframeGeometry(selectedObj.mesh.geometry);
        const line = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({ color: 0xffff00 }));
        line.position.copy(selectedObj.mesh.position);
        line.rotation.copy(selectedObj.mesh.rotation);
        line.scale.copy(selectedObj.mesh.scale);
        line.userData.isSelectionWireframe = true;
        sceneRef.current.add(line);
      }
    }
  }, [scene3D.objects, selectedObjectId]);

  const createMesh = (obj: SceneObject): THREE.Mesh | null => {
    let geometry: THREE.BufferGeometry;

    switch (obj.type) {
      case 'box':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(1, 32, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
        break;
      case 'plane':
        geometry = new THREE.PlaneGeometry(2, 2);
        break;
      default:
        return null;
    }

    let material: THREE.Material;
    const color = new THREE.Color(obj.color);

    switch (obj.material) {
      case 'wireframe':
        material = new THREE.MeshBasicMaterial({ color, wireframe: true });
        break;
      case 'basic':
        material = new THREE.MeshBasicMaterial({ color });
        break;
      case 'phong':
        material = new THREE.MeshPhongMaterial({ color });
        break;
      default:
        material = new THREE.MeshStandardMaterial({ color });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...obj.position);
    mesh.rotation.set(...obj.rotation);
    mesh.scale.set(...obj.scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  };

  const addObject = (type: SceneObject['type']) => {
    const newObject: SceneObject = {
      id: `obj_${Date.now()}`,
      type,
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#4ecdc4',
      material: 'standard',
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${scene3D.objects.length + 1}`
    };

    setScene3D(prev => ({
      ...prev,
      objects: [...prev.objects, newObject]
    }));
    
    setSelectedObjectId(newObject.id);
  };

  const deleteObject = (objectId: string) => {
    setScene3D(prev => ({
      ...prev,
      objects: prev.objects.filter(obj => obj.id !== objectId)
    }));
    
    if (selectedObjectId === objectId) {
      setSelectedObjectId(null);
    }
  };

  const updateObject = (objectId: string, updates: Partial<SceneObject>) => {
    setScene3D(prev => ({
      ...prev,
      objects: prev.objects.map(obj => 
        obj.id === objectId ? { ...obj, ...updates } : obj
      )
    }));
  };

  const handleSaveScene = () => {
    const currentProjectId = projectManager.getCurrentProjectId();
    if (currentProjectId) {
      projectManager.updateProjectToolData(currentProjectId, '3d', {
        scenes: [scene3D]
      });
      console.log('3D scene saved to project');
    } else {
      const newProject = projectManager.createProject(
        `3D Scene ${new Date().toLocaleDateString()}`,
        "Created from 3D Designer",
        ['3d']
      );
      projectManager.updateProjectToolData(newProject.id, '3d', {
        scenes: [scene3D]
      });
      console.log('New 3D project created and saved');
    }
  };

  const handleGenerateAI3D = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsAIProcessing(true);
    try {
      const response = await replitAI.generateResponse(
        `Generate 3D scene suggestions for: ${aiPrompt}. Suggest object types, colors, compositions, and artistic elements for a 3D scene.`,
        {
          tool: "3D Designer",
          project: "AI Creative Platform",
          currentWork: `Designing 3D scene: ${aiPrompt}`
        }
      );
      
      setAiSuggestion(response.content);
      
      // Auto-generate some objects based on prompt
      if (aiPrompt.toLowerCase().includes('city') || aiPrompt.toLowerCase().includes('building')) {
        // Generate city-like structures
        setTimeout(() => {
          addObject('box');
          setTimeout(() => addObject('cylinder'), 100);
          setTimeout(() => addObject('box'), 200);
        }, 1000);
      } else if (aiPrompt.toLowerCase().includes('abstract') || aiPrompt.toLowerCase().includes('art')) {
        // Generate abstract shapes
        setTimeout(() => {
          addObject('torus');
          setTimeout(() => addObject('sphere'), 100);
        }, 1000);
      }
    } catch (error) {
      console.error('AI 3D generation error:', error);
      setAiSuggestion("Sorry, AI assistance is temporarily unavailable.");
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleClearScene = () => {
    setScene3D(prev => ({
      ...prev,
      objects: []
    }));
    setSelectedObjectId(null);
  };

  const exportScene = () => {
    const sceneData = JSON.stringify(scene3D, null, 2);
    const blob = new Blob([sceneData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scene3D.name.replace(/\s+/g, '_')}_3d_scene.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(10, 10, 10);
      cameraRef.current.lookAt(0, 0, 0);
      setCameraControls(prev => ({ ...prev, zoom: 1 }));
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 border-b px-4 py-2 flex items-center justify-between bg-card/80 backdrop-blur-sm">
        <div>
          <h1 className="font-semibold text-lg">3D Designer</h1>
          <p className="text-xs text-muted-foreground">
            {projectManager.getCurrentProject()?.name || "No active project"}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary" data-testid="badge-ai-3d">
            <Bot className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
          <Button size="sm" onClick={handleSaveScene} data-testid="button-save-3d">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={exportScene} data-testid="button-export-3d">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" variant="outline" onClick={resetCamera} data-testid="button-reset-camera">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Left Panel - Tools */}
      <div className="w-80 border-r bg-muted/30 mt-16 overflow-y-auto">
        <Tabs defaultValue="objects" className="h-full">
          <TabsList className="grid w-full grid-cols-3 m-2">
            <TabsTrigger value="objects">Objects</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="ai">AI</TabsTrigger>
          </TabsList>
          
          {/* Objects Tab */}
          <TabsContent value="objects" className="p-4 space-y-4">
            <div>
              <h3 className="font-medium mb-3">Add Objects</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addObject('box')}
                  data-testid="button-add-box"
                >
                  <BoxIcon className="w-4 h-4 mr-2" />
                  Box
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addObject('sphere')}
                  data-testid="button-add-sphere"
                >
                  <Circle className="w-4 h-4 mr-2" />
                  Sphere
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addObject('cylinder')}
                  data-testid="button-add-cylinder"
                >
                  <CylinderIcon className="w-4 h-4 mr-2" />
                  Cylinder
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addObject('torus')}
                  data-testid="button-add-torus"
                >
                  <Circle className="w-4 h-4 mr-2" />
                  Torus
                </Button>
              </div>
            </div>

            {/* Camera Controls */}
            <div>
              <h3 className="font-medium mb-3">Camera</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setCameraControls(prev => ({ ...prev, autoRotate: !prev.autoRotate }))}
                  data-testid="button-auto-rotate"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  {cameraControls.autoRotate ? 'Stop' : 'Start'} Auto Rotate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={resetCamera}
                  data-testid="button-reset-view"
                >
                  <Move3D className="w-4 h-4 mr-2" />
                  Reset View
                </Button>
              </div>
            </div>

            {/* Scene Objects List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Scene Objects</h3>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={handleClearScene}
                  disabled={scene3D.objects.length === 0}
                  data-testid="button-clear-scene"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
              
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {scene3D.objects.map((obj) => (
                  <div
                    key={obj.id}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer hover-elevate ${
                      selectedObjectId === obj.id ? 'bg-primary/10 border border-primary/20' : 'bg-card'
                    }`}
                    onClick={() => setSelectedObjectId(obj.id)}
                    data-testid={`object-item-${obj.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded" 
                        style={{ backgroundColor: obj.color }}
                      />
                      <span className="text-sm truncate">{obj.name}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteObject(obj.id);
                      }}
                      data-testid={`button-delete-${obj.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                
                {scene3D.objects.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No objects in scene</p>
                    <p className="text-xs">Add objects to start designing</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="p-4 space-y-4">
            {selectedObject ? (
              <div className="space-y-4">
                <h3 className="font-medium">Object Properties</h3>
                
                {/* Object Name */}
                <div>
                  <Label htmlFor="object-name">Name</Label>
                  <Input
                    id="object-name"
                    value={selectedObject.name}
                    onChange={(e) => updateObject(selectedObject.id, { name: e.target.value })}
                    data-testid="input-object-name"
                  />
                </div>

                {/* Color */}
                <div>
                  <Label htmlFor="object-color">Color</Label>
                  <Input
                    id="object-color"
                    type="color"
                    value={selectedObject.color}
                    onChange={(e) => updateObject(selectedObject.id, { color: e.target.value })}
                    data-testid="input-object-color"
                  />
                </div>

                {/* Material */}
                <div>
                  <Label htmlFor="object-material">Material</Label>
                  <Select 
                    value={selectedObject.material} 
                    onValueChange={(value) => updateObject(selectedObject.id, { material: value as SceneObject['material'] })}
                  >
                    <SelectTrigger data-testid="select-material">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="phong">Phong</SelectItem>
                      <SelectItem value="wireframe">Wireframe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Position */}
                <div>
                  <Label>Position</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                      <div key={axis}>
                        <Label className="text-xs">{axis}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={selectedObject.position[idx]}
                          onChange={(e) => {
                            const newPosition = [...selectedObject.position] as [number, number, number];
                            newPosition[idx] = parseFloat(e.target.value) || 0;
                            updateObject(selectedObject.id, { position: newPosition });
                          }}
                          data-testid={`input-position-${axis.toLowerCase()}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scale */}
                <div>
                  <Label>Scale</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['X', 'Y', 'Z'] as const).map((axis, idx) => (
                      <div key={axis}>
                        <Label className="text-xs">{axis}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={selectedObject.scale[idx]}
                          onChange={(e) => {
                            const newScale = [...selectedObject.scale] as [number, number, number];
                            newScale[idx] = Math.max(0.1, parseFloat(e.target.value) || 1);
                            updateObject(selectedObject.id, { scale: newScale });
                          }}
                          data-testid={`input-scale-${axis.toLowerCase()}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Move3D className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No object selected</p>
                <p className="text-xs">Click an object to edit properties</p>
              </div>
            )}
          </TabsContent>

          {/* AI Tab */}
          <TabsContent value="ai" className="p-4 space-y-4">
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AI 3D Assistant
              </h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="ai-prompt">Describe your 3D scene</Label>
                  <Input
                    id="ai-prompt"
                    placeholder="A futuristic city, organic shapes, colorful abstract..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleGenerateAI3D()}
                    data-testid="input-ai-prompt"
                  />
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleGenerateAI3D}
                  disabled={isAIProcessing || !aiPrompt.trim()}
                  data-testid="button-generate-ai-3d"
                >
                  {isAIProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Generate AI Scene
                    </>
                  )}
                </Button>
              </div>

              {/* AI Response */}
              {(aiSuggestion || isAIProcessing) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      {isAIProcessing ? "AI is thinking..." : "AI Suggestions"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {isAIProcessing ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Creating 3D suggestions...
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed">{aiSuggestion}</div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Main 3D Canvas */}
      <div className="flex-1 mt-16 relative">
        {webglError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Card className="max-w-md mx-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Settings className="w-5 h-5" />
                  3D Graphics Unavailable
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {webglError}
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">To enable 3D features:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Use a modern browser (Chrome, Firefox, Safari, Edge)</li>
                    <li>Enable hardware acceleration in browser settings</li>
                    <li>Update your graphics drivers</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div 
            ref={mountRef} 
            className="w-full h-full bg-gray-100"
            data-testid="three-canvas"
          />
        )}

        {/* Canvas Instructions */}
        <div className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm rounded-lg p-3 border text-sm">
          <p className="font-medium mb-1">3D Controls:</p>
          <p className="text-xs text-muted-foreground">• Click & drag to rotate</p>
          <p className="text-xs text-muted-foreground">• Scroll to zoom</p>
          <p className="text-xs text-muted-foreground">• Click objects to select</p>
        </div>

        {/* Scene Info */}
        <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur-sm rounded-lg p-3 border">
          <p className="text-sm font-medium">{scene3D.name}</p>
          <p className="text-xs text-muted-foreground">
            {scene3D.objects.length} object{scene3D.objects.length !== 1 ? 's' : ''}
            {selectedObjectId && ` • ${selectedObject?.name} selected`}
          </p>
        </div>
      </div>
    </div>
  );
}