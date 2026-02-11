# Aetheria Portfolio - Backend Integration Guide

This guide explains how to run and test the integrated backend and frontend system.

## Overview

Your Aetheria portfolio now connects to your Express.js backend API, which fetches real project data from GitHub and itch.io platforms. The frontend displays this data in an interactive 3D environment.

## System Architecture

```
Frontend (Aetheria Portfolio)
├── React 18 + TypeScript
├── Three.js + React Three Fiber
├── Zustand for state management
└── Tailwind CSS for styling

Backend (Express.js API)
├── GitHub API integration
├── itch.io API integration
├── CORS enabled for frontend
└── Error handling middleware
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- GitHub token (for GitHub API access)
- itch.io token (for itch.io API access)

## Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with your API tokens
echo "PORT=3001
GITHUB_TOKEN=your_github_token_here
ITCH_TOKEN=your_itch_token_here" > .env

# Start backend server
npm run dev
```

The backend will run on `http://localhost:3001`

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd aetheria-portfolio

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. Environment Configuration (Optional)

For production deployment, you can create a `.env` file in the `aetheria-portfolio` directory:

```bash
# Create .env file for frontend
echo "VITE_API_URL=http://your-production-api.com" > .env
```

This allows you to configure the API URL for different environments.

## API Endpoints

### Backend Endpoints

- `GET /` - Health check
- `GET /api/v1/profile` - Developer profile information
- `GET /api/v1/gitprojects` - GitHub projects with "portfolio" topic
- `GET /api/v1/gitprojects/:name` - Specific GitHub project details
- `GET /api/v1/itchprojects` - itch.io games
- `GET /api/v1/itchprojects/:slug` - Specific game details

### Frontend Integration

The frontend automatically connects to the backend when:
- Running in development mode (`npm run dev`)
- Backend is running on `localhost:3001`

## Testing the Integration

### Method 1: Using the Test Script

```bash
# Run the test script to verify all endpoints
node test-backend.js
```

This will test all backend endpoints and verify they're working correctly.

### Method 2: Manual Testing

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd aetheria-portfolio
   npm run dev
   ```

3. **Open Browser:**
   Navigate to `http://localhost:5173`

4. **Test Navigation:**
   - Use WASD or arrow keys to move around the 3D world
   - Click on NPC buttons in the navbar to auto-walk to characters
   - Approach the PROJECTS NPC to see the floating card with real data

5. **Test Data Loading:**
   - Click "Game Dev" to see itch.io games
   - Click "Software Eng" to see GitHub projects
   - Click on individual projects to see details

## Features

### 3D World Navigation
- **Spherical World**: The entire world is a sphere that rotates beneath the player
- **Auto-walking**: Click NPC buttons to automatically navigate to characters
- **Smooth Camera**: Camera transitions smoothly between locations

### Interactive NPCs
- **ABOUT**: Developer introduction
- **PROJECTS**: Real project data from GitHub and itch.io
- **SERVICES**: Skills and offerings
- **CONTACT**: Contact information

### Project Categories
- **Game Development**: Shows games from itch.io API
- **Software Engineering**: Shows projects from GitHub API

### Error Handling
- **Offline Mode**: Shows fallback data if backend is unavailable
- **Loading States**: Visual indicators while fetching data
- **Error Messages**: User-friendly error display in 3D interface

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend is running on port 3001
   - Check that CORS is enabled in backend (it should be by default)

2. **API Token Issues**
   - Verify GitHub and itch.io tokens are valid
   - Check that GitHub repositories have "portfolio" topic
   - Ensure itch.io games are accessible with your token

3. **Frontend Not Loading Data**
   - Check browser console for errors
   - Verify backend is running and accessible
   - Check network tab for failed API requests

4. **3D Rendering Issues**
   - Ensure browser supports WebGL
   - Check that Three.js dependencies are installed
   - Verify model files are in correct location

### Debug Commands

```bash
# Test backend endpoints
curl http://localhost:3001/api/v1/profile
curl http://localhost:3001/api/v1/gitprojects
curl http://localhost:3001/api/v1/itchprojects

# Check frontend console for API errors
# Open browser dev tools and navigate to Console tab
```

## Environment Variables

### Backend (.env)
```env
PORT=3001
GITHUB_TOKEN=your_github_token
ITCH_TOKEN=your_itch_token
```

### Frontend (Optional)
```env
VITE_API_URL=http://localhost:3001
```

## Production Deployment

### Backend
- Set appropriate environment variables
- Use a process manager like PM2
- Configure reverse proxy (nginx)
- Set up SSL certificates

### Frontend
- Build for production: `npm run build`
- Serve static files with a web server
- Configure environment variables for production API URL

## File Changes Made

### Backend Files Modified
- `backend/app.js` - Added profile endpoint

### Frontend Files Modified
- `aetheria-portfolio/services/api.ts` - Connected to real backend API
- `aetheria-portfolio/types.ts` - Added backend response types
- `aetheria-portfolio/components/ui/FloatingCard.tsx` - Enhanced with real data handling

### New Files Created
- `test-backend.js` - Backend testing script
- `INTEGRATION_GUIDE.md` - This documentation

## Next Steps

1. **Customize Data Display**: Modify how project data is presented in the 3D interface
2. **Add More NPCs**: Create additional characters for different portfolio sections
3. **Enhance Visuals**: Add more 3D effects and animations
4. **Performance Optimization**: Implement caching and lazy loading
5. **Mobile Support**: Add touch controls for mobile devices

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify all environment variables are set correctly
4. Ensure both backend and frontend are running on correct ports