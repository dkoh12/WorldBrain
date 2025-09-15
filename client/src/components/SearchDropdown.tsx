import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { projectManager } from "@/lib/project-manager";
import { 
  Search, 
  FileText, 
  Box, 
  Music, 
  Video,
  ArrowRight,
  Clock
} from "lucide-react";

interface SearchResult {
  id: string;
  name: string;
  description: string;
  type: 'code' | '3d' | 'music' | 'video';
  createdAt: Date;
  matchReason: string;
}

interface SearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchDropdown({ isOpen, onClose }: SearchDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('creativestudio-recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('creativestudio-recent-searches', JSON.stringify(updated));
  };

  // Perform search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const projects = projectManager.searchProjects(searchQuery);
    const results: SearchResult[] = projects.map(project => {
      // Determine project type based on tools
      let type: 'code' | '3d' | 'music' | 'video' = 'code';
      if (project.tools.includes('3D Designer')) type = '3d';
      else if (project.tools.includes('Music Studio')) type = 'music';
      else if (project.tools.includes('Video Editor')) type = 'video';

      // Determine match reason
      let matchReason = '';
      if (project.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        matchReason = 'Title match';
      } else if (project.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        matchReason = 'Description match';
      } else {
        matchReason = 'Tool match';
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        type,
        createdAt: project.createdAt,
        matchReason
      };
    });

    setSearchResults(results);
  }, [searchQuery]);

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(searchQuery);
    onClose();
    
    // Navigate to the appropriate tool with the project
    const toolRoutes = {
      code: '/code',
      '3d': '/3d',
      music: '/music',
      video: '/video'
    };
    
    // Set current project and navigate
    projectManager.setCurrentProject(result.id);
    navigate(toolRoutes[result.type]);
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'code':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case '3d':
        return <Box className="w-4 h-4 text-purple-600" />;
      case 'music':
        return <Music className="w-4 h-4 text-green-600" />;
      case 'video':
        return <Video className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      code: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      '3d': "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      music: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      video: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    };
    
    return (
      <Badge variant="secondary" className={`text-xs ${colors[type as keyof typeof colors] || ''}`}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-96 z-[60]">
      <Card className="shadow-lg border">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, tools, and content..."
                className="pl-10 pr-4"
                data-testid="input-global-search"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    onClose();
                  }
                }}
              />
            </div>
          </div>

          <ScrollArea className="max-h-[400px]">
            {searchQuery.trim().length < 2 ? (
              <div className="p-4">
                {recentSearches.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Recent Searches</h4>
                    <div className="space-y-1">
                      {recentSearches.map((query, index) => (
                        <button
                          key={index}
                          onClick={() => handleRecentSearchClick(query)}
                          className="flex items-center gap-2 w-full p-2 text-left rounded-lg hover-elevate text-sm"
                          data-testid={`recent-search-${index}`}
                        >
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span>{query}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Start typing to search your projects</p>
                  </div>
                )}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No results found for "{searchQuery}"</p>
                <p className="text-xs mt-1">Try searching for project names, descriptions, or tools</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full p-3 text-left rounded-lg hover-elevate border border-transparent hover:border-border transition-colors"
                    data-testid={`search-result-${result.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getTypeIcon(result.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">{result.name}</h4>
                          <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {result.description}
                        </p>
                        <div className="flex items-center gap-2">
                          {getTypeBadge(result.type)}
                          <span className="text-xs text-muted-foreground">
                            {result.matchReason}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}