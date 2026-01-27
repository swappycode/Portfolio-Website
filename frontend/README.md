# Portfolio Website Frontend

A magnificent, modern portfolio website built with Vite, React, TypeScript, and Tailwind CSS. This frontend showcases your software development projects and game creations with stunning animations and responsive design.

## Features

### 🎨 **Stunning Design**
- **Modern UI**: Clean, professional design with beautiful gradients and animations
- **Responsive**: Fully responsive design that works on all devices
- **Accessibility**: Built with accessibility best practices in mind
- **Dark/Light Themes**: Smooth theme transitions and consistent styling

### 🚀 **Rich Functionality**
- **Project Showcase**: Display GitHub projects with detailed information
- **Game Portfolio**: Showcase Itch.io games with stats and platform support
- **Detailed Views**: Individual pages for each project/game with full README content
- **Real-time Data**: Live fetching from GitHub and Itch.io APIs

### 🎯 **Technical Excellence**
- **TypeScript**: Full TypeScript support for type safety
- **React Router**: Clean routing with dynamic parameters
- **Framer Motion**: Smooth animations and transitions
- **Error Handling**: Comprehensive error boundaries and loading states
- **Performance**: Optimized with lazy loading and efficient rendering

## Tech Stack

- **Runtime**: Vite (Fast build tool and dev server)
- **Framework**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom components
- **Routing**: React Router DOM
- **Animations**: Framer Motion
- **State Management**: React hooks and context
- **API Integration**: Custom hooks for data fetching
- **Toast Notifications**: React Hot Toast

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Layout/          # Layout components (Navbar, Footer, Container)
│   ├── UI/              # Basic UI components (LoadingSpinner, ErrorBoundary, Badge)
│   └── Projects/        # Project-specific components
│   └── Games/           # Game-specific components
├── pages/               # Main page components
│   ├── Home.tsx         # Landing page
│   ├── Projects.tsx     # Projects listing page
│   └── Games.tsx        # Games listing page
├── services/            # API service layer
│   └── api.ts           # API endpoints and configuration
├── hooks/               # Custom React hooks
│   └── useApi.ts        # API data fetching hooks
├── types/               # TypeScript type definitions
│   └── index.ts         # All interface definitions
└── App.tsx              # Main application component
```

## API Integration

### Backend Requirements
This frontend requires the backend API to be running on `http://localhost:5500`. Make sure to:

1. Start the backend server
2. Configure your `.env` file with GitHub and Itch.io tokens
3. Ensure the backend is accessible

### Available Endpoints
- **GitHub Projects**: `GET /api/v1/gitprojects` and `GET /api/v1/gitprojects/Detail/:name`
- **Itch.io Games**: `GET /api/v1/itchprojects` and `GET /api/v1/itchprojects/:slug`

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- Backend API running on `http://localhost:5500`

### Installation

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Visit `http://localhost:5173` (or the port shown in terminal)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Pages and Routes

### Main Pages
- **Home** (`/`) - Landing page with overview and navigation
- **Projects** (`/projects`) - List of all GitHub projects
- **Games** (`/games`) - List of all Itch.io games

### Detail Pages
- **Project Details** (`/projects/:name`) - Detailed view of a specific project
- **Game Details** (`/games/:slug`) - Detailed view of a specific game

## Components Overview

### Layout Components
- **Navbar**: Navigation with smooth animations and mobile responsiveness
- **Footer**: Contact information and social links
- **Container**: Responsive container with consistent padding

### UI Components
- **LoadingSpinner**: Beautiful loading animations
- **ErrorBoundary**: Error handling with user-friendly messages
- **Badge**: Tag-like components for categories and platforms

### Project Components
- **ProjectCard**: Individual project display with hover effects
- **ProjectGrid**: Grid layout for multiple projects
- **ProjectDetail**: Full project information with README rendering

### Game Components
- **GameCard**: Individual game display with stats and platforms
- **GameGrid**: Grid layout for multiple games
- **GameDetail**: Full game information with GitHub integration

## Styling and Design

### Color Scheme
- **Primary**: Blue to Purple gradient (`#6366f1` to `#8b5cf6`)
- **Secondary**: Pink accents (`#ec4899`)
- **Background**: Soft gradients from blue to purple
- **Text**: Clean dark text on light backgrounds

### Typography
- **System Fonts**: Uses system fonts for optimal performance
- **Hierarchy**: Clear heading hierarchy with proper spacing
- **Readability**: Optimized line heights and spacing

### Animations
- **Page Transitions**: Smooth page transitions with Framer Motion
- **Hover Effects**: Subtle hover animations on cards and buttons
- **Loading States**: Skeleton loaders and spinners
- **Scroll Effects**: Parallax and fade-in animations

## Development Guidelines

### Code Style
- Use TypeScript for all components
- Follow React best practices
- Use functional components with hooks
- Maintain consistent naming conventions

### Performance
- Implement lazy loading for images
- Use memoization for expensive calculations
- Optimize API calls with proper caching
- Minimize re-renders with proper state management

### Accessibility
- Use semantic HTML elements
- Provide alt text for images
- Ensure keyboard navigation
- Use proper ARIA labels

## Customization

### Colors and Themes
Edit the color scheme in `src/index.css`:
```css
:root {
  --primary-gradient: linear-gradient(45deg, #6366f1, #8b5cf6);
  --secondary-gradient: linear-gradient(45deg, #ec4899, #f59e0b);
}
```

### Typography
Update font preferences in `src/index.css`:
```css
html {
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif;
}
```

### Layout
Modify layout components in `src/components/Layout/`:
- `Navbar.tsx` - Navigation customization
- `Footer.tsx` - Footer content and links
- `Container.tsx` - Global container styles

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Ensure backend is running on `http://localhost:5500`
   - Check network tab in browser dev tools
   - Verify CORS settings in backend

2. **TypeScript Errors**
   - Run `npm run typecheck` to check types
   - Ensure all dependencies are installed
   - Check TypeScript configuration

3. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Vite configuration
   - Verify all imports are correct

### Development Tips

1. **Hot Reload**: Vite provides fast hot reload for development
2. **Type Checking**: Use `npm run typecheck` regularly
3. **Linting**: Run `npm run lint` to check code quality
4. **Build Preview**: Use `npm run preview` to test production build

## Deployment

### Production Build
```bash
npm run build
```

### Static Hosting
The built files in `dist/` can be hosted on any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3
- Any static file server

### Environment Variables
For production, ensure your backend URL is correctly configured in the API service.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the backend README for API issues
3. Create an issue in the repository
4. Contact via the information in the footer

---

**Built with ❤️ using modern web technologies**