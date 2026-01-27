import React from 'react';
import { motion } from 'framer-motion';
import Container from '../components/Layout/Container';
import GameGrid from '../components/Games/GameGrid';

const Games: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50"
    >
      {/* Hero Section */}
      <div className="bg-white shadow-sm border-b">
        <Container>
          <div className="py-16 text-center">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="max-w-3xl mx-auto"
            >
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                My{' '}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Games
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                A collection of my game development projects, showcasing my creativity 
                and passion for interactive entertainment and game design.
              </p>
            </motion.div>
          </div>
        </Container>
      </div>

      {/* Games Grid */}
      <Container className="py-16">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <GameGrid />
        </motion.div>
      </Container>
    </motion.div>
  );
};

export default Games;