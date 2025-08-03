'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, BarChart3, TrendingUp, Clock, Smartphone } from 'lucide-react';
import { useScreenTimeStore } from '../lib/store/screenTimeStore';
import { useScreenTimeTracker } from '../lib/hooks/useScreenTimeTracker';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const ScreenTimeAnalytics: React.FC = () => {
  const { getTodayStats, getWeeklyStats, getMonthlyStats } = useScreenTimeStore();
  const { formatDurationShort } = useScreenTimeTracker();
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  const todayStats = getTodayStats();
  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();

  const currentStats = timeRange === 'week' ? weeklyStats : monthlyStats;

  const chartData = currentStats.map(stat => ({
    date: new Date(stat.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    totalTime: Math.round(stat.totalTime / (1000 * 60)), // Convert to minutes
    sessions: stat.sessions,
    averageSession: Math.round(stat.averageSessionLength / (1000 * 60)),
  }));

  const totalTimeThisPeriod = currentStats.reduce((sum, stat) => sum + stat.totalTime, 0);
  const totalSessionsThisPeriod = currentStats.reduce((sum, stat) => sum + stat.sessions, 0);
  const averageDailyTime = currentStats.length > 0 ? totalTimeThisPeriod / currentStats.length : 0;

  const pieData = [
    { name: 'Active Time', value: totalTimeThisPeriod },
    { name: 'Free Time', value: (24 * 60 * 60 * 1000 * currentStats.length) - totalTimeThisPeriod },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Screen Time Analytics
          </h1>
          <p className="text-gray-600">
            Understand your digital habits
          </p>
        </motion.div>

        {/* Time Range Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                timeRange === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                timeRange === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Month
            </button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <Clock className="w-6 h-6 text-blue-600 mr-3" />
              <span className="text-lg font-semibold text-gray-800">Total Time</span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {formatDurationShort(totalTimeThisPeriod)}
            </div>
            <div className="text-sm text-gray-500">
              This {timeRange}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <Smartphone className="w-6 h-6 text-green-600 mr-3" />
              <span className="text-lg font-semibold text-gray-800">Sessions</span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {totalSessionsThisPeriod}
            </div>
            <div className="text-sm text-gray-500">
              Total sessions
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600 mr-3" />
              <span className="text-lg font-semibold text-gray-800">Daily Average</span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {formatDurationShort(averageDailyTime)}
            </div>
            <div className="text-sm text-gray-500">
              Per day
            </div>
          </div>
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Time Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Daily Screen Time
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value} minutes`, 'Screen Time']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Bar dataKey="totalTime" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Sessions Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Daily Sessions
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value} sessions`, 'Sessions']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Time Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Time Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatDurationShort(value), 'Time']}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="flex flex-col justify-center space-y-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Active Screen Time</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-300 rounded-full mr-3"></div>
                <span className="text-gray-700">Free Time</span>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  This shows the proportion of time you&apos;ve spent actively using your device 
                  versus free time during this {timeRange}.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white"
        >
          <h3 className="text-lg font-semibold mb-4">Digital Wellness Insights</h3>
          <div className="space-y-2 text-sm">
            <p>• You&apos;ve been active for {formatDurationShort(totalTimeThisPeriod)} this {timeRange}</p>
            <p>• Average daily usage: {formatDurationShort(averageDailyTime)}</p>
            <p>• Total sessions: {totalSessionsThisPeriod}</p>
            {averageDailyTime > 4 * 60 * 60 * 1000 && (
              <p className="text-yellow-200">⚠️ Consider taking more breaks to reduce eye strain</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}; 