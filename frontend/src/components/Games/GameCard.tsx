import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Badge from '../UI/Badge';
import LoadingSpinner from '../UI/LoadingSpinner';

interface GameCardProps {
  game: {
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
  };
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const supportedPlatforms = Object.entries(game.platforms)
    .filter(([_, supported]) => supported)
    .map(([platform]) => platform);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
    >
      {/* Game Cover */}
      <div className="relative overflow-hidden aspect-video bg-gray-100">
        {game.cover ? (
          <img
            src={game.cover}
            alt={game.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/400x300/8b5cf6/ffffff?text=No+Cover';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-lg font-bold">No Cover</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 left-3">
          <Badge variant="destructive" className="text-xs font-semibold">
            Game
          </Badge>
        </div>
      </div>

      {/* Game Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
              {game.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {game.description || 'No description available.'}
            </p>
          </div>
          <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-4 text-sm text-gray-600">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {formatNumber(game.stats.views)} views
          </span>
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {formatNumber(game.stats.downloads)} downloads
          </span>
        </div>

        {/* Platforms */}
        <div className="flex flex-wrap gap-2 mb-4">
          {supportedPlatforms.map((platform) => (
            <Badge key={platform} variant="outline" className="text-xs">
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </Badge>
          ))}
          {supportedPlatforms.length === 0 && (
            <Badge variant="secondary" className="text-xs">
              No platforms
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            to={`/games/${game.slug}`}
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-center font-medium"
          >
            View Details
          </Link>
          <a
            href={game.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z"/>
              <path d="M12 6c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 10c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z"/>
            </svg>
            Itch.io
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default GameCard;