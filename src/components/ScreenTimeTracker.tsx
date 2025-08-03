'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Clock, BarChart3, Calendar } from 'lucide-react';
import { useScreenTimeTracker } from '../lib/hooks/useScreenTimeTracker';

export const ScreenTimeTracker: React.FC = () => {
  const {
    isTracking,
    isVisible,
    currentDuration,
    formatDuration,
    formatDurationShort,
    startTracking,
    stopTracking,
    pauseTracking,
  } = useScreenTimeTracker();

  const handleToggleTracking = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  const handlePause = () => {
    if (isTracking) {
      pauseTracking();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Screen Time Tracker
          </h1>
          <p className="text-gray-600">
            Monitor your digital wellness
          </p>
        </motion.div>

        {/* Main Timer Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-6"
        >
          {/* Status Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className={`w-4 h-4 rounded-full mr-3 ${
              isTracking && isVisible 
                ? 'bg-green-500 animate-pulse' 
                : isTracking 
                ? 'bg-yellow-500' 
                : 'bg-gray-400'
            }`} />
            <span className="text-sm font-medium text-gray-600">
              {isTracking && isVisible 
                ? 'Active Tracking' 
                : isTracking 
                ? 'Paused' 
                : 'Not Tracking'
              }
            </span>
          </div>

          {/* Timer Display */}
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-gray-800 mb-2 font-mono">
              {formatDuration(currentDuration)}
            </div>
            <div className="text-sm text-gray-500">
              Current Session
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center space-x-4">
            {!isTracking ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleTracking}
                className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold flex items-center shadow-lg hover:bg-blue-700 transition-colors"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Tracking
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePause}
                  className="bg-yellow-500 text-white px-6 py-3 rounded-full font-semibold flex items-center shadow-lg hover:bg-yellow-600 transition-colors"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToggleTracking}
                  className="bg-red-500 text-white px-6 py-3 rounded-full font-semibold flex items-center shadow-lg hover:bg-red-600 transition-colors"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </motion.button>
              </>
            )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center mb-2">
              <Clock className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">Today</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {formatDurationShort(currentDuration)}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center mb-2">
              <BarChart3 className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-gray-600">Sessions</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {isTracking ? '1' : '0'}
            </div>
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">History</span>
            </button>
            <button className="flex items-center justify-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
              <BarChart3 className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-gray-700">Analytics</span>
            </button>
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-blue-50 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            How it works
          </h3>
          <p className="text-sm text-blue-700 leading-relaxed">
            This app tracks your active screen time when the app is in focus. 
            It automatically pauses when you switch tabs or apps, ensuring 
            accurate tracking of your actual usage time.
          </p>
        </motion.div>
      </div>
    </div>
  );
}; 