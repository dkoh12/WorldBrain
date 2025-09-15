import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter, Heart, Share2, Download, Eye, ThumbsUp, MessageCircle } from "lucide-react";

interface GalleryItem {
  id: number;
  title: string;
  creator: string;
  avatar: string;
  type: '3D' | 'Music' | 'Video' | 'Code';
  thumbnail: string;
  likes: number;
  views: number;
  comments: number;
  tags: string[];
  featured: boolean;
}

export default function Gallery() {
  // TODO: Remove mock functionality - replace with real gallery data
  const galleryItems: GalleryItem[] = [
    {
      id: 1,
      title: "Cyberpunk City Skyline",
      creator: "Alex Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face",
      type: "3D",
      thumbnail: "/attached_assets/generated_images/Cyberpunk_city_skyline_db1f6d9d.png",
      likes: 342,
      views: 1250,
      comments: 28,
      tags: ["cyberpunk", "architecture", "neon"],
      featured: true
    },
    {
      id: 2,
      title: "Ambient Forest Sounds",
      creator: "Maria Rodriguez", 
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b05c?w=32&h=32&fit=crop&crop=face",
      type: "Music",
      thumbnail: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop",
      likes: 186,
      views: 890,
      comments: 15,
      tags: ["ambient", "nature", "relaxing"],
      featured: false
    },
    {
      id: 3,
      title: "Product Launch Video",
      creator: "David Kim",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face", 
      type: "Video",
      thumbnail: "/attached_assets/generated_images/Video_production_setup_c38b87a3.png",
      likes: 523,
      views: 2100,
      comments: 45,
      tags: ["commercial", "product", "motion graphics"],
      featured: true
    },
    {
      id: 4,
      title: "Interactive Data Visualization",
      creator: "Sarah Johnson",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face",
      type: "Code",
      thumbnail: "/attached_assets/generated_images/Data_visualization_dashboard_75a3380d.png", 
      likes: 234,
      views: 756,
      comments: 19,
      tags: ["data viz", "d3.js", "interactive"],
      featured: false
    },
    {
      id: 5,
      title: "Fantasy Character Model",
      creator: "Tom Wilson",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face",
      type: "3D",
      thumbnail: "/attached_assets/generated_images/Fantasy_character_model_9e82582e.png",
      likes: 445,
      views: 1680,
      comments: 67,
      tags: ["character", "fantasy", "game ready"],
      featured: false
    },
    {
      id: 6,
      title: "Electronic Dance Track",
      creator: "Lisa Park",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=32&h=32&fit=crop&crop=face",
      type: "Music", 
      thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop",
      likes: 298,
      views: 1123,
      comments: 32,
      tags: ["edm", "electronic", "dance"],
      featured: true
    }
  ];

  const handleLike = (itemId: number) => {
    console.log('Liking item:', itemId);
  };

  const handleShare = (itemId: number) => {
    console.log('Sharing item:', itemId);
  };

  const handleDownload = (itemId: number) => {
    console.log('Downloading item:', itemId);
  };

  const handleViewItem = (itemId: number) => {
    console.log('Viewing item:', itemId);
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case '3D': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'Music': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'Video': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'Code': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case '3D': return '🎨';
      case 'Music': return '🎵';
      case 'Video': return '🎬';
      case 'Code': return '💻';
      default: return '📁';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Gallery Header */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold mb-2">Creative Gallery</h1>
          <p className="text-muted-foreground">Discover amazing creations from our community</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search gallery..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background"
              data-testid="input-search-gallery"
            />
          </div>
          <Button variant="outline" data-testid="button-filter-gallery">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Gallery Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">{galleryItems.length}</div>
              <div className="text-sm text-muted-foreground">Total Items</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{galleryItems.filter(item => item.type === '3D').length}</div>
              <div className="text-sm text-muted-foreground">3D Models</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{galleryItems.filter(item => item.type === 'Music').length}</div>
              <div className="text-sm text-muted-foreground">Music Tracks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">{galleryItems.filter(item => item.type === 'Video').length}</div>
              <div className="text-sm text-muted-foreground">Videos</div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Section */}
        <div className="mb-8">
          <h2 className="font-display text-2xl font-semibold mb-4">Featured Creations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryItems.filter(item => item.featured).map((item) => (
              <Card key={item.id} className="hover-elevate cursor-pointer overflow-hidden" onClick={() => handleViewItem(item.id)} data-testid={`featured-item-${item.id}`}>
                <div className="relative">
                  <div 
                    className="h-48 bg-muted bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.thumbnail})` }}
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className={getTypeColor(item.type)} data-testid={`badge-type-${item.id}`}>
                      {getTypeIcon(item.type)} {item.type}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      ⭐ Featured
                    </Badge>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
                    <h3 className="font-semibold mb-1" data-testid={`item-title-${item.id}`}>{item.title}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={item.avatar} alt={item.creator} />
                        <AvatarFallback className="text-xs">{item.creator[0]}</AvatarFallback>
                      </Avatar>
                      <span>{item.creator}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* All Items Grid */}
        <div className="mb-8">
          <h2 className="font-display text-2xl font-semibold mb-4">All Creations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {galleryItems.map((item) => (
              <Card key={item.id} className="hover-elevate overflow-hidden group" data-testid={`gallery-item-${item.id}`}>
                <div className="relative cursor-pointer" onClick={() => handleViewItem(item.id)}>
                  <div 
                    className="h-32 bg-muted bg-cover bg-center"
                    style={{ backgroundImage: `url(${item.thumbnail})` }}
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className={getTypeColor(item.type)} data-testid={`type-${item.id}`}>
                      {getTypeIcon(item.type)}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-3">
                  <h3 className="font-medium mb-2 truncate" data-testid={`title-${item.id}`}>{item.title}</h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={item.avatar} alt={item.creator} />
                      <AvatarFallback className="text-xs">{item.creator[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground truncate">{item.creator}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{item.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{item.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{item.comments}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs" data-testid={`tag-${item.id}-${index}`}>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleLike(item.id); }} data-testid={`button-like-${item.id}`}>
                        <Heart className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleShare(item.id); }} data-testid={`button-share-${item.id}`}>
                        <Share2 className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleDownload(item.id); }} data-testid={`button-download-${item.id}`}>
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
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