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
import { isPreviewMode } from "@/lib/utils/export-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  type: 'box' | 'sphere' | 'cylinder' | 'torus' | 'plane' | 'helix' | 'spiral' | 'pyramid' | 'tower' | 'ring' | 'coil';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  material: 'standard' | 'basic' | 'phong' | 'wireframe';
  name: string;
  mesh?: THREE.Mesh;
  parameters?: { [key: string]: any };
  aiPrompt?: string; // Store the original AI prompt that created this object
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
  const meshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());

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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [cameraControls, setCameraControls] = useState({
    autoRotate: false,
    zoom: 1
  });
  
  const [webglError, setWebglError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDraggingObject, setIsDraggingObject] = useState<string | null>(null);
  const [dragStartPosition, setDragStartPosition] = useState<[number, number, number] | null>(null);

  const selectedObject = scene3D.objects.find(obj => obj.id === selectedObjectId);

  // Auto-open preview if in preview mode
  useEffect(() => {
    if (isPreviewMode()) {
      setShowPreviewModal(true);
    }
  }, []);

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

        // Filter out wireframes and non-scene objects
        const validIntersects = intersects.filter(intersect => 
          !intersect.object.userData.isSelectionWireframe && 
          intersect.object.userData.isSceneObject
        );

        if (validIntersects.length > 0) {
          const clickedObjectId = validIntersects[0].object.userData.objectId;
          if (clickedObjectId) {
            setSelectedObjectId(clickedObjectId);
          }
        } else {
          setSelectedObjectId(null);
        }
      };

      // Mouse controls for camera
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };
      let dragStartMouse = { x: 0, y: 0 };
      let isObjectDragging = false; // Local variable for immediate dragging state
      let draggingObjectId: string | null = null;
      let objectDragStartPosition: [number, number, number] | null = null;

      const handleMouseDown = (event: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        console.log('Mouse down - Ctrl key:', event.ctrlKey, 'Meta key:', event.metaKey);

        // Check if Ctrl key is held and if we're clicking on an object
        if (event.ctrlKey || event.metaKey) {
          console.log('Ctrl key detected, checking for object intersection...');
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(scene.children, true);
          
          console.log('All intersects:', intersects.length);
          
          const validIntersects = intersects.filter(intersect => 
            !intersect.object.userData.isSelectionWireframe && 
            intersect.object.userData.isSceneObject
          );

          console.log('Valid intersects:', validIntersects.length);

          if (validIntersects.length > 0) {
            const clickedObjectId = validIntersects[0].object.userData.objectId;
            console.log('Clicked object ID:', clickedObjectId);
            if (clickedObjectId) {
              // Start object dragging
              console.log('Starting object drag for:', clickedObjectId);
              
              // Set both React state and local variables
              setIsDraggingObject(clickedObjectId);
              setSelectedObjectId(clickedObjectId);
              isObjectDragging = true;
              draggingObjectId = clickedObjectId;
              
              // Store the object's current position as drag start position
              const objToMove = scene3D.objects.find(obj => obj.id === clickedObjectId);
              if (objToMove) {
                console.log('Object initial position:', objToMove.position);
                setDragStartPosition([...objToMove.position]);
                objectDragStartPosition = [...objToMove.position];
              }
              
              dragStartMouse = { x: event.clientX, y: event.clientY };
              event.preventDefault();
              event.stopPropagation();
              return; // Don't start camera dragging
            }
          } else {
            console.log('No valid objects intersected');
          }
        }

        // Normal camera dragging (when Ctrl is not held or no object clicked)
        isDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
      };

      const handleMouseMove = (event: MouseEvent) => {
        if (isObjectDragging && draggingObjectId && objectDragStartPosition) {
          console.log('Dragging object:', draggingObjectId);
          // Handle object dragging - calculate total movement from drag start
          const movementScale = 0.02; // Adjust sensitivity
          const totalDeltaX = event.clientX - dragStartMouse.x;
          const totalDeltaY = event.clientY - dragStartMouse.y;
          
          console.log('Mouse movement - deltaX:', totalDeltaX, 'deltaY:', totalDeltaY);
          
          const newPosition: [number, number, number] = [
            objectDragStartPosition[0] + totalDeltaX * movementScale,
            objectDragStartPosition[1] - totalDeltaY * movementScale, // Negative Y for intuitive up/down movement
            objectDragStartPosition[2]
          ];

          console.log('New position:', newPosition);
          updateObject(draggingObjectId, { position: newPosition });

          return;
        }

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
        isObjectDragging = false;
        draggingObjectId = null;
        objectDragStartPosition = null;
        setIsDraggingObject(null);
        setDragStartPosition(null);
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

    // Clear existing meshes and wireframes
    const objectsToRemove = sceneRef.current.children.filter(child => 
      (child instanceof THREE.Mesh && child.userData.isSceneObject) ||
      child.userData.isSelectionWireframe
    );
    objectsToRemove.forEach(obj => sceneRef.current!.remove(obj));

    // Clear mesh map
    meshMapRef.current.clear();

    // Add all objects from state
    scene3D.objects.forEach(obj => {
      const mesh = createMesh(obj);
      if (mesh) {
        mesh.userData.isSceneObject = true;
        mesh.userData.objectId = obj.id;
        sceneRef.current!.add(mesh);
        
        // Store mesh in external map (no state mutation)
        meshMapRef.current.set(obj.id, mesh);
      }
    });

    // Add selection wireframe for selected object
    if (selectedObjectId) {
      const selectedMesh = meshMapRef.current.get(selectedObjectId);
      if (selectedMesh) {
        const wireframe = new THREE.WireframeGeometry(selectedMesh.geometry);
        const line = new THREE.LineSegments(wireframe, new THREE.LineBasicMaterial({ color: 0xffff00 }));
        line.position.copy(selectedMesh.position);
        line.rotation.copy(selectedMesh.rotation);
        line.scale.copy(selectedMesh.scale);
        line.userData.isSelectionWireframe = true;
        sceneRef.current.add(line);
      }
    }
  }, [scene3D.objects, selectedObjectId]);

  // Procedural geometry generators
  const createHelixGeometry = (radius = 1, height = 4, turns = 3, segments = 64) => {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * turns * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (t - 0.5) * height;
      points.push(new THREE.Vector3(x, y, z));
    }
    
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, segments, 0.1, 8, false);
    return tubeGeometry;
  };

  const createSpiralGeometry = (innerRadius = 0.5, outerRadius = 2, height = 3, turns = 4) => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    const segments = 128;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * turns * Math.PI * 2;
      const radius = innerRadius + (outerRadius - innerRadius) * t;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (t - 0.5) * height;
      
      vertices.push(x, y, z);
      vertices.push(x, y - 0.1, z); // Bottom vertex
      
      if (i < segments) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }
    
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    return geometry;
  };

  const createPyramidGeometry = (baseSize = 2, height = 3, sides = 4) => {
    const geometry = new THREE.ConeGeometry(baseSize, height, sides);
    return geometry;
  };

  const createTowerGeometry = (baseRadius = 1, topRadius = 0.5, height = 4, levels = 3) => {
    // Guard against invalid levels
    if (levels < 1) levels = 1;
    
    const levelHeight = height / levels;
    const geometries: THREE.BufferGeometry[] = [];
    
    for (let i = 0; i < levels; i++) {
      const t = levels === 1 ? 0 : i / (levels - 1);
      const currentRadius = baseRadius + (topRadius - baseRadius) * t;
      const nextRadius = levels === 1 ? topRadius : baseRadius + (topRadius - baseRadius) * (i + 1) / (levels - 1);
      
      const cylinderGeometry = new THREE.CylinderGeometry(nextRadius, currentRadius, levelHeight, 8);
      
      // Position the level
      const matrix = new THREE.Matrix4();
      matrix.makeTranslation(0, i * levelHeight - height / 2 + levelHeight / 2, 0);
      cylinderGeometry.applyMatrix4(matrix);
      
      geometries.push(cylinderGeometry);
    }
    
    // Merge all level geometries into one
    const mergedGeometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    let vertexOffset = 0;
    
    geometries.forEach(geometry => {
      const positionAttribute = geometry.getAttribute('position');
      const normalAttribute = geometry.getAttribute('normal');
      const geometryIndices = geometry.getIndex();
      
      if (positionAttribute && normalAttribute && geometryIndices) {
        // Add vertices and normals
        for (let i = 0; i < positionAttribute.count; i++) {
          vertices.push(
            positionAttribute.getX(i),
            positionAttribute.getY(i),
            positionAttribute.getZ(i)
          );
          normals.push(
            normalAttribute.getX(i),
            normalAttribute.getY(i),
            normalAttribute.getZ(i)
          );
        }
        
        // Add indices with offset
        for (let i = 0; i < geometryIndices.count; i++) {
          indices.push(geometryIndices.getX(i) + vertexOffset);
        }
        
        vertexOffset += positionAttribute.count;
      }
      
      geometry.dispose();
    });
    
    mergedGeometry.setIndex(indices);
    mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    mergedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    
    return mergedGeometry;
  };

  const createRingGeometry = (innerRadius = 0.5, outerRadius = 1.5, thickness = 0.2) => {
    // Validate inputs
    if (innerRadius >= outerRadius) {
      innerRadius = Math.max(0.1, outerRadius - 0.5);
    }
    
    // Calculate proper torus parameters
    const majorRadius = (innerRadius + outerRadius) / 2;
    const tubeRadius = (outerRadius - innerRadius) / 2;
    
    // Ensure minimum tube radius for visibility
    const finalTubeRadius = Math.max(tubeRadius, thickness);
    
    return new THREE.TorusGeometry(majorRadius, finalTubeRadius, 16, 100);
  };

  const createCoilGeometry = (radius = 1, height = 3, turns = 5, coilRadius = 0.15) => {
    const points = [];
    const segments = turns * 16;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * turns * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (t - 0.5) * height;
      points.push(new THREE.Vector3(x, y, z));
    }
    
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, segments, coilRadius, 8, false);
  };

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
      case 'helix':
        geometry = createHelixGeometry(
          obj.parameters?.radius || 1,
          obj.parameters?.height || 4,
          obj.parameters?.turns || 3,
          obj.parameters?.segments || 64
        );
        break;
      case 'spiral':
        geometry = createSpiralGeometry(
          obj.parameters?.innerRadius || 0.5,
          obj.parameters?.outerRadius || 2,
          obj.parameters?.height || 3,
          obj.parameters?.turns || 4
        );
        break;
      case 'pyramid':
        geometry = createPyramidGeometry(
          obj.parameters?.baseSize || 2,
          obj.parameters?.height || 3,
          obj.parameters?.sides || 4
        );
        break;
      case 'tower':
        geometry = createTowerGeometry(
          obj.parameters?.baseRadius || 1,
          obj.parameters?.topRadius || 0.5,
          obj.parameters?.height || 4,
          obj.parameters?.levels || 3
        );
        break;
      case 'ring':
        geometry = createRingGeometry(
          obj.parameters?.innerRadius || 0.5,
          obj.parameters?.outerRadius || 1.5,
          obj.parameters?.thickness || 0.2
        );
        break;
      case 'coil':
        geometry = createCoilGeometry(
          obj.parameters?.radius || 1,
          obj.parameters?.height || 3,
          obj.parameters?.turns || 5,
          obj.parameters?.coilRadius || 0.15
        );
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

  const addObject = (type: SceneObject['type'], parameters?: { [key: string]: any }, customName?: string, position?: [number, number, number], aiPrompt?: string) => {
    const newObject: SceneObject = {
      id: `obj_${Date.now()}`,
      type,
      position: position || [0, 1, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#4ecdc4',
      material: 'standard',
      name: customName || `${type.charAt(0).toUpperCase() + type.slice(1)} ${scene3D.objects.length + 1}`,
      parameters,
      aiPrompt
    };

    setScene3D(prev => ({
      ...prev,
      objects: [...prev.objects, newObject]
    }));
    
    setSelectedObjectId(newObject.id);
    return newObject;
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

  // Spatial arrangement calculator
  const calculateSpatialPositions = (prompt: string, count: number) => {
    const lowercasePrompt = prompt.toLowerCase();
    const positions: [number, number, number][] = [];
    const spacing = 3; // Distance between objects

    // Detect spatial keywords and calculate positions accordingly
    if (lowercasePrompt.includes('next to each other') || lowercasePrompt.includes('in a line') || 
        lowercasePrompt.includes('row') || lowercasePrompt.includes('series')) {
      // Arrange in a line along X-axis
      for (let i = 0; i < count; i++) {
        const x = (i - (count - 1) / 2) * spacing;
        positions.push([x, 1, 0]);
      }
    } else if (lowercasePrompt.includes('circle') || lowercasePrompt.includes('around') || 
               lowercasePrompt.includes('ring formation')) {
      // Arrange in a circle
      const radius = Math.max(3, count * 0.8);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        positions.push([x, 1, z]);
      }
    } else if (lowercasePrompt.includes('scattered') || lowercasePrompt.includes('random') || 
               lowercasePrompt.includes('spread out')) {
      // Random scattered positions
      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 10;
        const z = (Math.random() - 0.5) * 10;
        const y = 1 + Math.random() * 2; // Slight height variation
        positions.push([x, y, z]);
      }
    } else if (lowercasePrompt.includes('grid') || lowercasePrompt.includes('square formation')) {
      // Arrange in a grid
      const gridSize = Math.ceil(Math.sqrt(count));
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        const x = (col - (gridSize - 1) / 2) * spacing;
        const z = (row - (gridSize - 1) / 2) * spacing;
        positions.push([x, 1, z]);
      }
    } else if (lowercasePrompt.includes('triangle') || lowercasePrompt.includes('triangular')) {
      // Arrange in a triangle formation
      let currentRow = 0;
      let positionInRow = 0;
      for (let i = 0; i < count; i++) {
        if (positionInRow > currentRow) {
          currentRow++;
          positionInRow = 0;
        }
        const x = (positionInRow - currentRow / 2) * spacing;
        const z = currentRow * spacing * 0.866; // √3/2 for equilateral triangle
        positions.push([x, 1, z]);
        positionInRow++;
      }
    } else {
      // Default: slight offset for multiple objects
      for (let i = 0; i < count; i++) {
        const x = i * 2; // Space them out along X-axis by default
        positions.push([x, 1, 0]);
      }
    }

    return positions;
  };

  // AI prompt parser for 3D model generation
  const parseAI3DPrompt = (prompt: string) => {
    const lowercasePrompt = prompt.toLowerCase();
    const results = [];

    // Pattern matching for different shapes and instructions (disambiguated keywords)
    const patterns = [
      {
        keywords: ['helix', 'dna', 'spring', 'double helix'],
        type: 'helix',
        name: 'AI Generated Helix',
        parameters: { radius: 1, height: 4, turns: 3, segments: 64 },
        colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']
      },
      {
        keywords: ['spiral', 'swirl', 'twirl', 'vortex', 'flat spiral'],
        type: 'spiral',
        name: 'AI Generated Spiral',
        parameters: { innerRadius: 0.5, outerRadius: 2, height: 3, turns: 4 },
        colors: ['#feca57', '#ff9ff3', '#54a0ff', '#5f27cd']
      },
      {
        keywords: ['pyramid', 'triangle', 'pointy', 'egyptian'],
        type: 'pyramid',
        name: 'AI Generated Pyramid',
        parameters: { baseSize: 2, height: 3, sides: 4 },
        colors: ['#ffb142', '#ff6348', '#ff4757', '#ffa502']
      },
      {
        keywords: ['tower', 'tall', 'skyscraper', 'spire'],
        type: 'tower',
        name: 'AI Generated Tower',
        parameters: { baseRadius: 1, topRadius: 0.5, height: 4, levels: 3 },
        colors: ['#747d8c', '#a4b0be', '#57606f', '#2f3542']
      },
      {
        keywords: ['ring', 'circle', 'donut', 'torus'],
        type: 'ring',
        name: 'AI Generated Ring',
        parameters: { innerRadius: 0.5, outerRadius: 1.5, thickness: 0.2 },
        colors: ['#3742fa', '#2f3542', '#ff4757', '#7bed9f']
      },
      {
        keywords: ['coil', 'wire', 'cable', 'tube', 'spring coil'],
        type: 'coil',
        name: 'AI Generated Coil',
        parameters: { radius: 1, height: 3, turns: 5, coilRadius: 0.15 },
        colors: ['#70a1ff', '#5352ed', '#ff6b81', '#ffa8a8']
      }
    ];

    // Check for matches (first match wins to avoid overlaps)
    let matched = false;
    for (const pattern of patterns) {
      if (!matched && pattern.keywords.some(keyword => lowercasePrompt.includes(keyword))) {
        const color = pattern.colors[Math.floor(Math.random() * pattern.colors.length)];
        results.push({
          type: pattern.type,
          name: pattern.name,
          parameters: pattern.parameters,
          color: color
        });
        matched = true; // Prevent multiple matches for overlapping keywords
        break;
      }
    }

    // Handle multiple objects and spatial arrangements
    let count = 1;
    if (lowercasePrompt.includes('multiple') || lowercasePrompt.includes('several') || 
        lowercasePrompt.includes('many') || lowercasePrompt.includes('series') ||
        lowercasePrompt.includes('group') || lowercasePrompt.includes('collection')) {
      count = 3;
    }
    
    // Extract specific numbers from prompt
    const numberMatches = lowercasePrompt.match(/\b(\d+)\b/g);
    if (numberMatches) {
      const num = parseInt(numberMatches[0]);
      if (num >= 2 && num <= 10) {
        count = num;
      }
    }

    // Special keywords that imply multiple objects
    if (lowercasePrompt.includes('next to each other') || lowercasePrompt.includes('in a line') ||
        lowercasePrompt.includes('circle') || lowercasePrompt.includes('grid') ||
        lowercasePrompt.includes('scattered')) {
      count = Math.max(count, 3);
    }

    // Calculate positions for all objects
    const positions = calculateSpatialPositions(prompt, count);

    // Create multiple objects with different positions
    if (count > 1 && results.length > 0) {
      const baseResult = results[0];
      results.length = 0; // Clear and rebuild with positions
      
      for (let i = 0; i < count; i++) {
        const variation: any = { 
          ...baseResult,
          position: positions[i],
          name: `${baseResult.name} ${i + 1}`,
          parameters: { ...baseResult.parameters }
        };
        
        // Add some variation to make each object unique
        if (variation.type === 'helix') {
          variation.parameters.turns = 2 + Math.random() * 3;
          variation.parameters.radius = 0.8 + Math.random() * 0.8;
        } else if (variation.type === 'tower') {
          variation.parameters.height = 3 + Math.random() * 2;
          variation.parameters.levels = 2 + Math.floor(Math.random() * 3);
        } else if (variation.type === 'spiral') {
          variation.parameters.turns = 3 + Math.random() * 2;
          variation.parameters.outerRadius = 1.5 + Math.random() * 1;
        }
        
        results.push(variation);
      }
    } else if (results.length > 0) {
      // Single object gets the first calculated position
      (results[0] as any).position = positions[0];
    }

    // Default fallback
    if (results.length === 0) {
      // Try to guess from general terms
      if (lowercasePrompt.includes('organic') || lowercasePrompt.includes('natural')) {
        results.push({
          type: 'helix',
          name: 'AI Generated Organic Shape',
          parameters: { radius: 0.8, height: 3, turns: 2.5, segments: 48 },
          color: '#2ed573',
          position: [0, 1, 0]
        });
      } else if (lowercasePrompt.includes('geometric') || lowercasePrompt.includes('sharp')) {
        results.push({
          type: 'pyramid',
          name: 'AI Generated Geometric Shape',
          parameters: { baseSize: 1.5, height: 2.5, sides: 6 },
          color: '#1e90ff',
          position: [0, 1, 0]
        });
      }
    }

    // Calculate positions for all objects if not already set
    if (results.length > 0 && !results[0].position) {
      const positions = calculateSpatialPositions(prompt, results.length);
      results.forEach((result, index) => {
        (result as any).position = positions[index];
      });
    }

    return results;
  };

  const handleGenerateAI3D = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsAIProcessing(true);
    try {
      // Parse the prompt to identify 3D models to create
      const modelSpecs = parseAI3DPrompt(aiPrompt);
      console.log('AI Prompt:', aiPrompt);
      console.log('Model Specs generated:', modelSpecs);
      
      const response = await replitAI.generateResponse(
        `Create a 3D scene description for: "${aiPrompt}". I am about to generate actual 3D models based on your prompt. ${
          modelSpecs.length > 0 
            ? `I will create: ${modelSpecs.map(spec => spec.name).join(', ')}.` 
            : 'Suggest what 3D objects would best represent this concept.'
        } Provide artistic guidance about colors, composition, and visual storytelling.`,
        {
          tool: "3D Designer",
          project: "AI Creative Platform",
          currentWork: `Creating 3D models for: ${aiPrompt}`
        }
      );
      
      setAiSuggestion(response.content);
      
      // Generate the actual 3D models
      if (modelSpecs.length > 0) {
        let delay = 800; // Start after AI response
        modelSpecs.forEach((spec, index) => {
          setTimeout(() => {
            const newObject = addObject(spec.type as SceneObject['type'], spec.parameters, spec.name, spec.position, aiPrompt);
            // Update color and log position for debugging
            if (newObject) {
              updateObject(newObject.id, { color: spec.color });
              console.log(`Created ${spec.name} at position:`, spec.position);
            }
          }, delay + index * 300); // Stagger creation
        });
        
        // Update AI suggestion to include generation status
        setTimeout(() => {
          setAiSuggestion(prev => 
            prev + `\n\nGenerated ${modelSpecs.length} 3D model${modelSpecs.length > 1 ? 's' : ''} based on your prompt!`
          );
        }, delay + modelSpecs.length * 300 + 200);
      } else {
        // Fallback: Create a simple shape
        setTimeout(() => {
          addObject('sphere', { radius: 1 }, 'AI Interpretation', [0, 1, 0], aiPrompt);
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

  const zoomIn = () => {
    if (cameraRef.current) {
      const scale = 0.8; // Zoom in by moving camera closer
      cameraRef.current.position.multiplyScalar(scale);
      setCameraControls(prev => ({ ...prev, zoom: prev.zoom * scale }));
    }
  };

  const zoomOut = () => {
    if (cameraRef.current) {
      const scale = 1.25; // Zoom out by moving camera farther
      cameraRef.current.position.multiplyScalar(scale);
      setCameraControls(prev => ({ ...prev, zoom: prev.zoom * scale }));
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
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomIn}
                    data-testid="button-zoom-in"
                  >
                    <ZoomIn className="w-4 h-4 mr-1" />
                    Zoom In
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={zoomOut}
                    data-testid="button-zoom-out"
                  >
                    <ZoomOut className="w-4 h-4 mr-1" />
                    Zoom Out
                  </Button>
                </div>
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

                {/* AI Prompt (if object was AI-generated) */}
                {selectedObject.aiPrompt && (
                  <div>
                    <Label htmlFor="ai-prompt">Original AI Prompt</Label>
                    <Input
                      id="ai-prompt"
                      value={selectedObject.aiPrompt}
                      onChange={(e) => updateObject(selectedObject.id, { aiPrompt: e.target.value })}
                      placeholder="Enter AI prompt to regenerate..."
                      data-testid="input-ai-prompt-edit"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Edit this prompt and regenerate to modify the object
                    </p>
                  </div>
                )}

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
                  <Label htmlFor="ai-prompt">Describe 3D models to create</Label>
                  <Input
                    id="ai-prompt"
                    placeholder="E.g., 'draw a helix', 'create a spiral tower'..."
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
                      Creating 3D Models...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate & Render
                    </>
                  )}
                </Button>
              </div>

              {/* Quick AI Actions */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Quick Generate</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setAiPrompt('draw a helix');
                      setTimeout(() => handleGenerateAI3D(), 100);
                    }}
                    disabled={isAIProcessing}
                    data-testid="button-quick-helix"
                  >
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Helix
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setAiPrompt('create a spiral');
                      setTimeout(() => handleGenerateAI3D(), 100);
                    }}
                    disabled={isAIProcessing}
                    data-testid="button-quick-spiral"
                  >
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Spiral
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setAiPrompt('build a tower');
                      setTimeout(() => handleGenerateAI3D(), 100);
                    }}
                    disabled={isAIProcessing}
                    data-testid="button-quick-tower"
                  >
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Tower
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setAiPrompt('organic coil structure');
                      setTimeout(() => handleGenerateAI3D(), 100);
                    }}
                    disabled={isAIProcessing}
                    data-testid="button-quick-organic"
                  >
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Organic
                  </Button>
                </div>
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
                        Analyzing your request and generating 3D models...
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">{aiSuggestion}</div>
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
            className={`w-full h-full bg-gray-100 ${isDraggingObject ? 'cursor-move' : 'cursor-default'}`}
            data-testid="three-canvas"
          />
        )}

        {/* Canvas Instructions */}
        <div className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm rounded-lg p-3 border text-sm">
          <p className="font-medium mb-1">3D Controls:</p>
          <p className="text-xs text-muted-foreground">• Click & drag to rotate</p>
          <p className="text-xs text-muted-foreground">• Scroll to zoom</p>
          <p className="text-xs text-muted-foreground">• Click objects to select</p>
          <p className="text-xs text-muted-foreground">• Ctrl+drag objects to move</p>
        </div>

        {/* Drag mode indicator */}
        {isDraggingObject && (
          <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg z-10">
            <div className="flex items-center gap-2">
              <Move3D className="w-4 h-4" />
              <span className="text-sm font-medium">Moving Object</span>
            </div>
          </div>
        )}

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