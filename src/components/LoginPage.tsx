'use client';

import { motion } from 'framer-motion';
import { EmailAuth } from './EmailAuth';

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-6xl mb-4"
          >
            📱
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Screen Time Tracker
          </h1>
          <p className="text-gray-600">
            Join the digital wellness community
          </p>
        </div>

        {/* Email Authentication */}
        <EmailAuth onAuthSuccess={onLogin} />

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-3 gap-4"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-lg">📊</span>
            </div>
            <p className="text-xs text-gray-600">Track Time</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-lg">👥</span>
            </div>
            <p className="text-xs text-gray-600">Connect Friends</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-lg">🏆</span>
            </div>
            <p className="text-xs text-gray-600">Compete & Win</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
} 