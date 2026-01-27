import { useState, useEffect } from 'react';
import { githubApi, itchApi } from '../services/api';
import type { 
  GitHubProject, 
  GitHubProjectDetail, 
  ItchGame, 
  ItchGameDetail 
} from '../types';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Hook for fetching GitHub projects
export const useGitHubProjects = (): UseApiResult<GitHubProject[]> => {
  const [data, setData] = useState<GitHubProject[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await githubApi.getProjects();
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};

// Hook for fetching GitHub project details
export const useGitHubProjectDetail = (name: string): UseApiResult<GitHubProjectDetail> => {
  const [data, setData] = useState<GitHubProjectDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!name) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await githubApi.getProjectDetail(name);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [name]);

  return { data, loading, error, refetch: fetchData };
};

// Hook for fetching Itch.io games
export const useItchGames = (): UseApiResult<ItchGame[]> => {
  const [data, setData] = useState<ItchGame[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await itchApi.getGames();
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};

// Hook for fetching Itch.io game details
export const useItchGameDetail = (slug: string): UseApiResult<ItchGameDetail> => {
  const [data, setData] = useState<ItchGameDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await itchApi.getGameDetail(slug);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [slug]);

  return { data, loading, error, refetch: fetchData };
};