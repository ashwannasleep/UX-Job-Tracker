# Overview

JobTracker is a full-stack web application for managing job applications, built with React on the frontend and Express.js on the backend. The application allows users to track their job applications throughout the hiring process, from initial application to final outcome. It features LinkedIn integration for importing job data, comprehensive application management with status tracking, and analytics to monitor application success rates.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built using React with TypeScript and follows a component-based architecture:

- **Framework**: React 18 with TypeScript for type safety and better developer experience
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: shadcn/ui component library built on Radix UI primitives for consistent, accessible components
- **Styling**: Tailwind CSS with CSS custom properties for theming and responsive design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod for form validation and type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

The application uses a clean separation between pages, components, and utilities, with shared types and schemas to ensure consistency between frontend and backend.

## Backend Architecture

The backend follows a RESTful API design using Express.js:

- **Framework**: Express.js with TypeScript for type-safe server-side development
- **API Design**: RESTful endpoints for CRUD operations on job applications
- **Storage Layer**: Abstracted storage interface with in-memory implementation for development
- **LinkedIn Integration**: Service layer for parsing LinkedIn URLs and job data
- **Error Handling**: Centralized error handling middleware for consistent API responses
- **Development**: Hot reload with tsx for fast development iterations

The server architecture separates concerns into routes, services, and storage layers, making it easy to swap implementations as needed.

## Data Storage

The application uses Drizzle ORM for database operations:

- **ORM**: Drizzle ORM for type-safe database queries and schema management
- **Database**: PostgreSQL configured for production with Neon Database
- **Schema**: Well-defined database schema with proper relationships and constraints
- **Migrations**: Drizzle Kit for database migrations and schema evolution
- **Development Storage**: In-memory storage implementation for development and testing

The database schema includes comprehensive job application tracking with fields for company information, application status, contact details, and timeline management.

## Authentication and Authorization

Currently, the application operates without authentication, making it suitable for single-user scenarios or local development. The architecture is designed to easily accommodate authentication systems when needed.

## Development and Build Process

The project uses modern development tools for an optimal developer experience:

- **TypeScript**: Full TypeScript support across frontend and backend
- **Hot Reload**: Development server with hot module replacement
- **Build Process**: Vite for frontend builds and esbuild for backend compilation
- **Code Quality**: ESLint and TypeScript for code quality and type checking
- **Development Plugins**: Replit-specific plugins for enhanced development experience

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL hosting service for production database
- **Drizzle ORM**: Type-safe database toolkit and query builder

## UI and Styling
- **Radix UI**: Primitive components for building accessible UI components
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library based on Radix UI

## Development Tools
- **Vite**: Frontend build tool and development server
- **TanStack Query**: Data fetching and caching library
- **React Hook Form**: Form state management and validation
- **Zod**: Schema validation library for runtime type checking

## LinkedIn Integration
- **LinkedIn API**: Planned integration for job data import (currently uses URL parsing)
- **React Icons**: Social media icons including LinkedIn branding

## Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional className utility
- **class-variance-authority**: Utility for creating variant-based component APIs

The application is designed to be easily deployable on various platforms, with configuration for both development and production environments.