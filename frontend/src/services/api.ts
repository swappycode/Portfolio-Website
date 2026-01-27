import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { 
  GitHubApiResponse, 
  GitHubDetailApiResponse, 
  ItchApiResponse, 
  ItchDetailApiResponse 
} from '../types';

// Base API configuration
const API_BASE_URL = 'http://localhost:5500';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`Making request to: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// GitHub API Endpoints
export const githubApi = {
  // Get all portfolio projects
  async getProjects(): Promise<GitHubApiResponse> {
    try {
      const response = await api.get<GitHubApiResponse>('/api/v1/gitprojects');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch GitHub projects:', error);
      throw new Error('Unable to fetch projects. Please try again later.');
    }
  },

  // Get project details by name
  async getProjectDetail(name: string): Promise<GitHubDetailApiResponse> {
    try {
      const response = await api.get<GitHubDetailApiResponse>(`/api/v1/gitprojects/${name}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch project ${name}:`, error);
      throw new Error(`Unable to fetch project details for ${name}.`);
    }
  }
};

// Itch.io API Endpoints
export const itchApi = {
  // Get all games
  async getGames(): Promise<ItchApiResponse> {
    try {
      const response = await api.get<ItchApiResponse>('/api/v1/itchprojects');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch Itch.io games:', error);
      throw new Error('Unable to fetch games. Please try again later.');
    }
  },

  // Get game details by slug
  async getGameDetail(slug: string): Promise<ItchDetailApiResponse> {
    try {
      const response = await api.get<ItchDetailApiResponse>(`/api/v1/itchprojects/${slug}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch game ${slug}:`, error);
      throw new Error(`Unable to fetch game details for ${slug}.`);
    }
  }
};

// Health check endpoint
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await api.get('/');
    return response.data === 'Who Am I';
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

export default api;