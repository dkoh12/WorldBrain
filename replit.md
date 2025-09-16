# CreativeAI Studio - AI-Powered Creative Platform

## Overview

CreativeAI Studio is a comprehensive creative platform that combines multiple AI-powered creative tools into a unified workspace. The platform integrates 3D modeling, music production, video editing, and code development with real-time collaboration features and AI assistance. Built with React and Express, it provides a modern web-based creative environment designed for professional creators and teams.

### Recent Updates (September 16, 2025)
- **Added Ctrl+Drag object movement**: Hold Ctrl and drag any object in the 3D scene to move it around freely
- **Fixed spatial positioning bug**: AI-generated objects now properly position according to spatial keywords instead of overlapping
- **Added AI prompt editing**: Objects remember their original AI prompts and can be edited in the Properties panel
- **Enhanced 3D object management**: Improved Properties panel with AI prompt editing field for AI-generated objects
- **Improved position calculation**: Fixed fallback object positioning to ensure proper spatial distribution
- **Added debugging capabilities**: Console logging for AI 3D generation troubleshooting

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built using React with TypeScript and follows a component-based architecture:
- **React Router**: Uses Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state management and caching
- **UI Framework**: shadcn/ui components with Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design system including light/dark mode support
- **Component Structure**: Modular components organized by feature (Creative modules, AI assistant, collaboration tools)

### Backend Architecture
The server follows a Node.js/Express architecture with TypeScript:
- **Express.js**: RESTful API server with middleware for request logging and error handling
- **Database Layer**: Drizzle ORM with PostgreSQL support for type-safe database operations
- **Storage Interface**: Abstracted storage layer with both memory and database implementations
- **Development Setup**: Vite integration for hot module replacement and development tooling

### Design System
Implements a sophisticated design approach inspired by Figma and Notion:
- **Color Scheme**: Neutral-based palette with purple accent (260 85% 65%)
- **Typography**: Inter for UI text and Space Grotesk for display headings
- **Component Variants**: Consistent button, card, and form styling with hover states
- **Responsive Layout**: 12-column grid system with mobile-first approach

### Creative Tools Integration
The platform provides four main creative modules:
- **3D Designer**: AI-powered 3D modeling and rendering capabilities
- **Music Studio**: Intelligent music composition and production tools
- **Video Editor**: Professional video editing with AI assistance
- **Code Editor**: Monaco-based code editor with AI copilot features

### AI Integration
Built around Replit's AI infrastructure:
- **AI Assistant**: Context-aware suggestions and creative guidance
- **Code Generation**: AI-powered code completion and generation
- **Creative Suggestions**: Tool-specific AI recommendations
- **Real-time Processing**: Asynchronous AI response handling with loading states

### Collaboration Features
Real-time collaboration system supporting:
- **Multi-user Sessions**: Shared creative workspaces
- **Activity Tracking**: Real-time user activity and tool usage monitoring
- **Communication**: Integrated chat and video calling capabilities
- **Project Sharing**: Collaborative project management and version control

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18+ with React DOM for UI rendering
- **TypeScript**: Full TypeScript support for type safety
- **Vite**: Build tool and development server with HMR
- **Express.js**: Node.js web framework for API server

### Database and ORM
- **Drizzle ORM**: Type-safe database toolkit for PostgreSQL
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **connect-pg-simple**: PostgreSQL session store for Express

### UI and Design Libraries
- **Radix UI**: Headless UI components for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library
- **class-variance-authority**: Variant-based component styling
- **Lucide React**: Icon library

### Development Tools
- **Monaco Editor**: VS Code editor integration for code editing
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **Wouter**: Lightweight routing library

### AI and External Services
- **Anthropic SDK**: AI integration for creative assistance
- **Replit AI**: Built-in AI capabilities for the platform
- **Date-fns**: Date manipulation and formatting

### Development and Build Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer
- **TSX**: TypeScript execution environment for development