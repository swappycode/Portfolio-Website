import { ProjectItem } from '../types';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ApiService = {
  getProjects: async (category: 'GAME_DEV' | 'SDE'): Promise<ProjectItem[]> => {
    await delay(600); // Network latency simulation
    
    if (category === 'GAME_DEV') {
      return [
        {
          id: '1',
          title: 'Spherical Odyssey',
          description: 'A WebGL shader experiment featuring non-euclidean geometry.',
          tags: ['Three.js', 'GLSL', 'React'],
          link: '#'
        },
        {
          id: '2',
          title: 'Rogue Pixel',
          description: '2D platformer with procedural generation.',
          tags: ['Unity', 'C#'],
          link: '#'
        }
      ];
    } else {
      return [
        {
          id: '3',
          title: 'E-Commerce Dashboard',
          description: 'High-performance analytics dashboard for retail.',
          tags: ['Next.js', 'TypeScript', 'Tailwind'],
          link: '#'
        },
        {
          id: '4',
          title: 'Microservices Auth',
          description: 'Centralized authentication service.',
          tags: ['Node.js', 'Docker', 'Redis'],
          link: '#'
        }
      ];
    }
  },

  getProfile: async () => {
    await delay(400);
    return {
      name: "Alex Dev",
      role: "Creative Developer",
      bio: "Building worlds on the web."
    };
  }
};
