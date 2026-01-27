// GitHub API Types
export interface GitHubProject {
  name: string;
  description: string;
  tags: string[];
  githubUrl: string;
  imageUrl: string;
}

export interface GitHubProjectDetail extends GitHubProject {
  language: string;
  stars: number;
  forks: number;
  homepage: string;
  readme: string;
}

export interface GitHubApiResponse {
  success: boolean;
  count: number;
  data: GitHubProject[];
}

export interface GitHubDetailApiResponse {
  success: boolean;
  data: GitHubProjectDetail;
}

// Itch.io API Types
export interface ItchGame {
  id: number;
  slug: string;
  title: string;
  description: string;
  cover: string | null;
  url: string;
  stats: {
    views: number;
    downloads: number;
    purchases: number;
  };
  platforms: {
    windows: boolean;
    linux: boolean;
    mac: boolean;
    android: boolean;
  };
}

export interface ItchGameDetail extends ItchGame {
  pricing: {
    min_price: number;
    earnings: any[];
  };
  published: {
    published: boolean;
    published_at: string;
    created_at: string;
  };
  github: {
    stars: number;
    forks: number;
    language: string;
    html_url: string;
  };
  readme: string;
  download_page: string;
}

export interface ItchApiResponse {
  success: boolean;
  count: number;
  data: ItchGame[];
}

export interface ItchDetailApiResponse {
  success: boolean;
  data: ItchGameDetail;
}

// Common Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface Platform {
  name: string;
  supported: boolean;
  icon: string;
}