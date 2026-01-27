# Portfolio Website Backend API

A Node.js/Express backend API that serves portfolio project data from GitHub and Itch.io platforms. This API provides structured data about your projects, games, and repositories to power a frontend portfolio website.

## Project Overview

This backend service acts as a centralized API for portfolio data, aggregating information from:
- **GitHub repositories** - Technical projects and code repositories
- **Itch.io games** - Game development projects and releases

The API is designed to be consumed by any frontend framework (React, Vue, Angular, etc.) to create a dynamic portfolio website.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: JavaScript (ES6+ modules)
- **API**: RESTful endpoints
- **Authentication**: GitHub API tokens, Itch.io API tokens
- **Middleware**: CORS, Morgan (logging), Cookie Parser, Custom Error Handler
- **Environment**: Dotenv for configuration management
- **Development**: Nodemon for auto-restart during development

## Environment Setup

### Required Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
PORT=3000
GITHUB_TOKEN=your_github_personal_access_token
ITCH_TOKEN=your_itch_io_api_key
```

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The API will be available at: `http://localhost:3000`

### Project Structure

```
backend/
├── app.js                    # Main application entry point
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables
├── config/
│   ├── env.js               # Environment configuration
│   ├── github.js            # GitHub API configuration
│   └── itch.js              # Itch.io API configuration
├── controllers/
│   ├── github.controller.js # GitHub API logic
│   └── itch.controller.js   # Itch.io API logic
├── routes/
│   ├── github.routes.js     # GitHub API routes
│   └── itch.routes.js       # Itch.io API routes
├── middleware/
│   └── errorHandler.js      # Global error handling
└── public/                  # Static files
```

## API Endpoints

### GitHub Projects API

#### Get All Portfolio Projects
```
GET /api/v1/gitprojects
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "name": "project-name",
      "description": "Project description",
      "tags": ["portfolio", "web", "react"],
      "githubUrl": "https://github.com/swappycode/project-name",
      "imageUrl": "https://raw.githubusercontent.com/swappycode/project-name/main/assets/preview.png"
    }
  ]
}
```

**Filtering Logic:**
- Only includes repositories that are NOT forks
- Only includes repositories with "portfolio" topic
- Automatically generates preview image URLs from `/assets/preview.png`

#### Get Project Details
```
GET /api/v1/gitprojects/Detail/:name
```

**Parameters:**
- `:name` - Repository name

**Response:**
```json
{
  "name": "project-name",
  "description": "Project description",
  "language": "JavaScript",
  "tags": ["portfolio", "web", "react"],
  "stars": 15,
  "forks": 3,
  "githubUrl": "https://github.com/swappycode/project-name",
  "homepage": "https://project-demo.com",
  "previewImage": "https://raw.githubusercontent.com/swappycode/project-name/main/assets/preview.png",
  "readme": "# Project README Content..."
}
```

**Features:**
- Fetches repository metadata from GitHub API
- Retrieves and decodes README content
- Includes star count, fork count, and language information
- Returns homepage URL if available

### Itch.io Games API

#### Get All Games
```
GET /api/v1/itchprojects
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 123456,
      "slug": "game-slug",
      "title": "Game Title",
      "description": "Short game description",
      "cover": "https://img.itch.zone/cover.jpg",
      "url": "https://developer.itch.io/game-slug",
      "stats": {
        "views": 1500,
        "downloads": 250,
        "purchases": 15
      },
      "platforms": {
        "windows": true,
        "linux": false,
        "mac": true,
        "android": false
      }
    }
  ]
}
```

**Features:**
- Fetches all games from your Itch.io developer account
- Includes download statistics and platform support
- Returns cover images and game URLs

#### Get Game Details
```
GET /api/v1/itchprojects/:slug
```

**Parameters:**
- `:slug` - Game slug (from URL)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123456,
    "slug": "game-slug",
    "title": "Game Title",
    "description": "Short game description",
    "cover": "https://img.itch.zone/cover.jpg",
    "url": "https://developer.itch.io/game-slug",
    "stats": {
      "views": 1500,
      "downloads": 250,
      "purchases": 15
    },
    "platforms": {
      "windows": true,
      "linux": false,
      "mac": true,
      "android": false
    },
    "pricing": {
      "min_price": 0,
      "earnings": []
    },
    "published": {
      "published": true,
      "published_at": "2023-01-15T10:30:00Z",
      "created_at": "2023-01-10T08:15:00Z"
    },
    "github": {
      "stars": 8,
      "forks": 2,
      "language": "JavaScript",
      "html_url": "https://github.com/swappycode/game-slug"
    },
    "readme": "# Game README Content...",
    "download_page": "https://developer.itch.io/game-slug"
  }
}
```

**Features:**
- Combines Itch.io game data with GitHub repository information
- Fetches GitHub repository metadata (stars, forks, language)
- Retrieves README content from GitHub
- Includes pricing information and publication dates
- Shows platform compatibility

### Root Endpoint
```
GET /
```

**Response:**
```
Who Am I
```

## Data Flow

### GitHub Integration
1. **Authentication**: Uses GitHub Personal Access Token
2. **Repository Fetching**: Retrieves all repositories for the specified user
3. **Filtering**: Only includes non-fork repositories with "portfolio" topic
4. **Enrichment**: Adds preview images from `/assets/preview.png`
5. **Detail Pages**: Fetches additional metadata and README content

### Itch.io Integration
1. **Authentication**: Uses Itch.io API key
2. **Game Fetching**: Retrieves all games from developer account
3. **GitHub Linking**: Attempts to find corresponding GitHub repository
4. **Data Merging**: Combines game stats with code repository information
5. **Content**: Fetches README from GitHub for detailed project information

## Error Handling

The API includes comprehensive error handling through a custom middleware:

- **Global Error Handler**: Centralized error processing in `middleware/errorHandler.js`
- **Status Code Mapping**: Automatically maps errors to appropriate HTTP status codes
- **Development Mode**: Detailed error stacks in development environment
- **Production Safety**: Clean error messages without stack traces in production
- **Error Types**: Handles 404, 500, 401, and custom application errors

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "stack": "Error stack trace (development only)"
}
```

## Frontend Integration

This API is designed to be consumed by any frontend framework. Here's how to integrate:

### Example with Fetch API
```javascript
// Get GitHub projects
const githubProjects = await fetch('/api/v1/gitprojects')
  .then(res => res.json())
  .then(data => data.data);

// Get Itch.io games
const itchGames = await fetch('/api/v1/itchprojects')
  .then(res => res.json())
  .then(data => data.data);

// Get project details
const projectDetails = await fetch('/api/v1/gitprojects/Detail/project-name')
  .then(res => res.json());
```

### Example with Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1'
});

// Get all projects
const { data } = await api.get('/gitprojects');
const projects = data.data;
```

## Frontend Development Guidelines

### For AI Platforms Building Frontend

When using this API to build a frontend portfolio website:

1. **Project Display**: Use the GitHub projects endpoint for technical projects
2. **Game Display**: Use the Itch.io games endpoint for game projects
3. **Detail Pages**: Implement individual project/game pages using the detail endpoints
4. **Responsive Design**: Ensure the frontend works on mobile and desktop
5. **Loading States**: Handle API loading and error states gracefully
6. **Caching**: Consider implementing caching for better performance

### Suggested Frontend Structure
```
src/
├── components/
│   ├── ProjectCard.js      // Display GitHub projects
│   ├── GameCard.js         // Display Itch.io games
│   ├── ProjectDetail.js    // Detailed project view
│   ├── GameDetail.js       // Detailed game view
│   └── Layout.js           // Main layout component
├── pages/
│   ├── Home.js             // Main portfolio page
│   ├── Projects.js         // All projects page
│   ├── Games.js            // All games page
│   └── About.js            // About page
└── services/
    └── api.js              // API service functions
```

## Authentication Setup

### GitHub Token Setup
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` scope
3. Add it to your `.env` file as `GITHUB_TOKEN`

### Itch.io API Key Setup
1. Go to Itch.io → Settings → API keys
2. Generate a new API key
3. Add it to your `.env` file as `ITCH_TOKEN`

## Development

### Running in Development
```bash
npm run dev  # Uses nodemon for auto-restart on file changes
```

### Running in Production
```bash
npm start    # Direct node execution
```

### Linting
```bash
npm run lint # ESLint with React plugin and modern JavaScript rules
```

### Available Scripts

- `npm start` - Production server
- `npm run dev` - Development server with auto-restart
- `npm run lint` - Code linting with ESLint

### Environment Variables

The application uses the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 3000) | No |
| `GITHUB_TOKEN` | GitHub Personal Access Token | Yes |
| `ITCH_TOKEN` | Itch.io API Key | Yes |

### Middleware Stack

The application uses the following middleware in order:

1. **express.json()** - Parse JSON request bodies
2. **cookieParser()** - Parse cookies
3. **cors()** - Enable CORS for cross-origin requests
4. **morgan('combined')** - HTTP request logging
5. **Custom Routes** - GitHub and Itch.io API routes
6. **errorHandler** - Global error handling (must be last)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues or questions:
- Check the error logs in the console
- Verify your API tokens are valid
- Ensure repositories have the "portfolio" topic for GitHub filtering
- Make sure game slugs match GitHub repository names for linking