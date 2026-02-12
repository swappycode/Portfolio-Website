import { ProjectItem } from '../types';

// Get API base URL from environment variables
const getApiBaseUrl = () => {
  // Check for environment variable first (set in Vercel dashboard)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Fallback: Check if we're in development mode using hostname
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    return 'http://localhost:3001';
  }
  
  // In production without env var, use empty string for same-origin
  return '';
};

const API_BASE_URL = getApiBaseUrl();

// Enhanced error handling
class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Transform itch.io game data to frontend format
const transformItchGameData = (games: any[]): ProjectItem[] => {
  return games.map(game => {
    const platforms = game.platforms ? Object.keys(game.platforms).filter(p => game.platforms[p]) : [];
    const platformTags = platforms.length > 0 ? platforms.map(p => p.toUpperCase()) : ['CROSS_PLATFORM'];
    
    return {
      id: game.id ? game.id.toString() : Math.random().toString(36).substr(2, 9),
      slug: game.slug, // Include slug for itch.io games
      title: game.title || 'Untitled Game',
      description: game.description || game.short_text || 'A game developed by the creator.',
      tags: ['Game Development', 'itch.io', ...platformTags],
      link: game.url || '#',
      imageUrl: game.cover || game.imageUrl || undefined
    };
  });
};

// Transform itch.io game detail data to include README
const transformItchGameDetail = (game: any): ProjectItem & { readme?: string } => {
  const platforms = game.platforms ? Object.keys(game.platforms).filter(p => game.platforms[p]) : [];
  const platformTags = platforms.length > 0 ? platforms.map(p => p.toUpperCase()) : ['CROSS_PLATFORM'];
  
  return {
    id: game.id ? game.id.toString() : Math.random().toString(36).substr(2, 9),
    slug: game.slug,
    title: game.title || 'Untitled Game',
    description: game.description || game.short_text || 'A game developed by the creator.',
    tags: ['Game Development', 'itch.io', ...platformTags],
    link: game.url || '#',
    imageUrl: game.cover || game.imageUrl || undefined,
    readme: game.readme // Include README content
  };
};

// Transform GitHub repository data to frontend format
const transformGitHubData = (repositories: any[]): ProjectItem[] => {
  return repositories.map(repo => {
    const topics = repo.tags || repo.topics || repo.tags || ['Software Development'];
    const languageTag = repo.language ? [repo.language] : [];
    
    return {
      id: repo.name || Math.random().toString(36).substr(2, 9),
      title: repo.name || 'Untitled Project',
      description: repo.description || 'A project developed by the creator.',
      tags: ['Software Development', ...languageTag, ...topics],
      link: repo.githubUrl || repo.html_url || '#',
      imageUrl: repo.imageUrl || `https://raw.githubusercontent.com/${repo.name}/main/assets/preview.png`
    };
  });
};

export const ApiService = {
  getProjects: async (category: 'GAME_DEV' | 'SDE'): Promise<ProjectItem[]> => {
    try {
      let response: Response;
      let data: any;

      if (category === 'GAME_DEV') {
        // Fetch from itch.io API
        response = await fetch(`${API_BASE_URL}/api/v1/itchprojects`);
        if (!response.ok) {
          throw new ApiError(`Failed to fetch itch.io projects: ${response.statusText}`, response.status);
        }
        data = await response.json();
        
        if (!data.success || !data.data) {
          throw new ApiError('Invalid response format from itch.io API', 500);
        }

        return transformItchGameData(data.data);
      } else {
        // Fetch from GitHub API
        response = await fetch(`${API_BASE_URL}/api/v1/gitprojects`);
        if (!response.ok) {
          throw new ApiError(`Failed to fetch GitHub projects: ${response.statusText}`, response.status);
        }
        data = await response.json();
        
        if (!data.success || !data.data) {
          throw new ApiError('Invalid response format from GitHub API', 500);
        }

        return transformGitHubData(data.data);
      }
    } catch (error) {
      console.error('API Error:', error);
      
      // Return fallback mock data if API is unavailable
      if (category === 'GAME_DEV') {
        return [
          {
            id: 'fallback-1',
            title: 'Game Project (Offline)',
            description: 'Unable to connect to itch.io API. Please check your backend server.',
            tags: ['Offline Mode', 'Fallback'],
            link: '#'
          }
        ];
      } else {
        return [
          {
            id: 'fallback-2',
            title: 'Software Project (Offline)',
            description: 'Unable to connect to GitHub API. Please check your backend server.',
            tags: ['Offline Mode', 'Fallback'],
            link: '#'
          }
        ];
      }
    }
  },

  getProfile: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/profile`);
      if (!response.ok) {
        throw new ApiError(`Failed to fetch profile: ${response.statusText}`, response.status);
      }
      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new ApiError('Invalid response format from profile API', 500);
      }

      return data.data;
    } catch (error) {
      console.error('Profile API Error:', error);
      
      // Return fallback profile data
      return {
        name: "Developer",
        role: "Creative Developer",
        bio: "Unable to connect to backend. Using offline mode."
      };
    }
  },

  // Health check for backend connectivity
  checkBackendHealth: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  },

  // Fetch itch.io game details including README
  getItchGameDetail: async (slug: string): Promise<ProjectItem & { readme?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/itchprojects/${slug}`);
      if (!response.ok) {
        throw new ApiError(`Failed to fetch itch.io game details: ${response.statusText}`, response.status);
      }
      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new ApiError('Invalid response format from itch.io detail API', 500);
      }

      return transformItchGameDetail(data.data);
    } catch (error) {
      console.error('Itch.io Game Detail API Error:', error);
      
      // Return fallback data
      return {
        id: slug,
        slug,
        title: 'Game (Offline)',
        description: 'Unable to connect to itch.io API. Please check your backend server.',
        tags: ['Offline Mode', 'Fallback'],
        link: '#',
        readme: 'README content not available in offline mode.'
      };
    }
  }
};
