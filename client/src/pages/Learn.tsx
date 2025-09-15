import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, BookOpen, Video, Code, Palette, Music, Film, Users, Clock, Star, ChevronRight } from "lucide-react";

interface Course {
  id: number;
  title: string;
  description: string;
  category: 'beginner' | 'intermediate' | 'advanced';
  type: '3D' | 'Music' | 'Video' | 'Code' | 'General';
  duration: string;
  lessons: number;
  rating: number;
  enrolled: number;
  progress: number;
  thumbnail: string;
  instructor: string;
  free: boolean;
}

interface Tutorial {
  id: number;
  title: string;
  type: 'video' | 'article' | 'interactive';
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
}

export default function Learn() {
  // TODO: Remove mock functionality - replace with real learning data
  const courses: Course[] = [
    {
      id: 1,
      title: "3D Modeling Fundamentals with AI",
      description: "Learn the basics of 3D modeling enhanced by AI assistance",
      category: 'beginner',
      type: '3D',
      duration: "4 hours",
      lessons: 12,
      rating: 4.8,
      enrolled: 1250,
      progress: 65,
      thumbnail: "/attached_assets/generated_images/3D_geometric_shapes_render_a3432705.png",
      instructor: "Sarah Chen",
      free: true
    },
    {
      id: 2,
      title: "AI-Powered Music Production",
      description: "Create professional music with AI composition tools",
      category: 'intermediate',
      type: 'Music',
      duration: "6 hours",
      lessons: 18,
      rating: 4.9,
      enrolled: 890,
      progress: 30,
      thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=200&fit=crop",
      instructor: "Mike Rodriguez",
      free: false
    },
    {
      id: 3,
      title: "Video Editing with Smart AI",
      description: "Master video editing using AI-powered automation",
      category: 'beginner',
      type: 'Video',
      duration: "5 hours",
      lessons: 15,
      rating: 4.7,
      enrolled: 2100,
      progress: 0,
      thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=300&h=200&fit=crop",
      instructor: "Emma Watson",
      free: true
    },
    {
      id: 4,
      title: "Creative Coding with AI Copilot",
      description: "Build interactive experiences with AI coding assistance",
      category: 'advanced',
      type: 'Code',
      duration: "8 hours",
      lessons: 24,
      rating: 4.6,
      enrolled: 567,
      progress: 0,
      thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=300&h=200&fit=crop",
      instructor: "David Kim",
      free: false
    }
  ];

  const tutorials: Tutorial[] = [
    { id: 1, title: "Getting Started with the 3D Designer", type: 'video', duration: '15 min', difficulty: 'beginner', topic: '3D Modeling' },
    { id: 2, title: "AI Music Composition Tips", type: 'article', duration: '8 min', difficulty: 'intermediate', topic: 'Music Production' },
    { id: 3, title: "Color Grading with AI", type: 'interactive', duration: '20 min', difficulty: 'intermediate', topic: 'Video Editing' },
    { id: 4, title: "Debugging with AI Assistant", type: 'video', duration: '12 min', difficulty: 'beginner', topic: 'Code Development' },
    { id: 5, title: "Advanced Lighting Techniques", type: 'article', duration: '25 min', difficulty: 'advanced', topic: '3D Modeling' },
    { id: 6, title: "Team Collaboration Best Practices", type: 'video', duration: '18 min', difficulty: 'beginner', topic: 'General' }
  ];

  const handleStartCourse = (courseId: number) => {
    console.log('Starting course:', courseId);
  };

  const handleWatchTutorial = (tutorialId: number) => {
    console.log('Watching tutorial:', tutorialId);
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'beginner': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case '3D': return <Palette className="w-4 h-4" />;
      case 'Music': return <Music className="w-4 h-4" />;
      case 'Video': return <Film className="w-4 h-4" />;
      case 'Code': return <Code className="w-4 h-4" />;
      case 'General': return <BookOpen className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTutorialTypeIcon = (type: string) => {
    switch(type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'article': return <BookOpen className="w-4 h-4" />;
      case 'interactive': return <Code className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Learn Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Learning Hub</h1>
          <p className="text-muted-foreground">Master creative AI tools with expert-led courses and tutorials</p>
        </div>

        {/* Learning Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">{courses.length}</div>
              <div className="text-sm text-muted-foreground">Courses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{tutorials.length}</div>
              <div className="text-sm text-muted-foreground">Quick Tutorials</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{courses.reduce((acc, course) => acc + course.enrolled, 0).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Students</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">{courses.filter(c => c.progress > 0).length}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
        </div>

        {/* My Learning Progress */}
        {courses.some(course => course.progress > 0) && (
          <div className="mb-8">
            <h2 className="font-display text-2xl font-semibold mb-4">Continue Learning</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.filter(course => course.progress > 0).map((course) => (
                <Card key={course.id} className="hover-elevate" data-testid={`progress-course-${course.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-20 h-16 bg-muted rounded-lg bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${course.thumbnail})` }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1 truncate">{course.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">by {course.instructor}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>
                        <Button size="sm" className="mt-2" onClick={() => handleStartCourse(course.id)}>
                          Continue Learning
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Featured Courses */}
        <div className="mb-8">
          <h2 className="font-display text-2xl font-semibold mb-4">Featured Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover-elevate overflow-hidden" data-testid={`course-${course.id}`}>
                <div className="relative">
                  <div 
                    className="h-40 bg-muted bg-cover bg-center"
                    style={{ backgroundImage: `url(${course.thumbnail})` }}
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className={getCategoryColor(course.category)} data-testid={`badge-category-${course.id}`}>
                      {course.category}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1">
                    <div className="flex items-center gap-1">
                      {getTypeIcon(course.type)}
                    </div>
                    {course.free && (
                      <Badge className="bg-primary text-primary-foreground">FREE</Badge>
                    )}
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2" data-testid={`course-title-${course.id}`}>
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      <span>{course.lessons} lessons</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{course.enrolled}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{course.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">by {course.instructor}</span>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => handleStartCourse(course.id)}
                    data-testid={`button-start-course-${course.id}`}
                  >
                    {course.progress > 0 ? 'Continue' : 'Start Course'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Tutorials */}
        <div className="mb-8">
          <h2 className="font-display text-2xl font-semibold mb-4">Quick Tutorials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tutorials.map((tutorial) => (
              <Card key={tutorial.id} className="hover-elevate cursor-pointer" onClick={() => handleWatchTutorial(tutorial.id)} data-testid={`tutorial-${tutorial.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getTutorialTypeIcon(tutorial.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium mb-1 line-clamp-2" data-testid={`tutorial-title-${tutorial.id}`}>
                        {tutorial.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>{tutorial.topic}</span>
                        <span>•</span>
                        <span>{tutorial.duration}</span>
                      </div>
                      <Badge className={getCategoryColor(tutorial.difficulty)} data-testid={`badge-difficulty-${tutorial.id}`}>
                        {tutorial.difficulty}
                      </Badge>
                    </div>
                    <Button size="sm" variant="ghost" data-testid={`button-play-${tutorial.id}`}>
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}