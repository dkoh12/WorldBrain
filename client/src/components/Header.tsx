import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search, Settings, User, Menu, Sparkles } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export default function Header() {
  const handleSearch = () => {
    console.log('Search clicked');
  };

  const handleNotifications = () => {
    console.log('Notifications clicked');
  };

  const handleProfile = () => {
    console.log('Profile clicked');
  };

  const handleMenu = () => {
    console.log('Menu clicked');
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={handleMenu}
              data-testid="button-menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="font-display text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                CreativeAI
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Button variant="ghost" className="text-sm font-medium" data-testid="button-nav-studio">
              Studio
            </Button>
            <Button variant="ghost" className="text-sm font-medium" data-testid="button-nav-projects">
              Projects
            </Button>
            <Button variant="ghost" className="text-sm font-medium" data-testid="button-nav-gallery">
              Gallery
            </Button>
            <Button variant="ghost" className="text-sm font-medium" data-testid="button-nav-learn">
              Learn
            </Button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSearch}
              data-testid="button-search"
            >
              <Search className="w-4 h-4" />
            </Button>
            
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleNotifications}
                data-testid="button-notifications"
              >
                <Bell className="w-4 h-4" />
              </Button>
              <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 text-xs bg-destructive text-destructive-foreground flex items-center justify-center" data-testid="badge-notification-count">
                3
              </Badge>
            </div>

            <ThemeToggle />

            <Avatar className="w-8 h-8 hover-elevate cursor-pointer" onClick={handleProfile} data-testid="avatar-user">
              <AvatarImage src="/api/placeholder/32/32" alt="User" />
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}