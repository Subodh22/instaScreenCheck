'use client';

import { useState, useEffect } from 'react';
import { TodayTab } from '../components/TodayTab';
import { FriendsTab } from '../components/FriendsTab';
import { CompetitionsTab } from '../components/CompetitionsTab';
import { LoginPage } from '../components/LoginPage';
import { Clock, Users, Trophy, LogOut } from 'lucide-react';
import { auth } from '../lib/firebase/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState('today');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUser(user);
        // Store user info in localStorage
        localStorage.setItem('screenTimeAuth', 'true');
        localStorage.setItem('userInfo', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        }));
      } else {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('screenTimeAuth');
        localStorage.removeItem('userInfo');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    // This will be handled by the LoginPage component
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const tabs = [
    { id: 'today', label: 'Today', icon: Clock, component: TodayTab },
    { id: 'friends', label: 'Friends', icon: Users, component: FriendsTab },
    { id: 'competitions', label: 'Compete', icon: Trophy, component: CompetitionsTab }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || TodayTab;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📱</div>
          <h2 className="text-xl font-semibold text-gray-800">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background relative max-w-md mx-auto">
      {/* Header with User Info and Logout */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user?.photoURL && (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              className="w-8 h-8 rounded-full"
            />
          )}
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Screen Time Tracker</h1>
            {user?.displayName && (
              <p className="text-sm text-gray-600">Welcome, {user.displayName}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Main Content */}
      <main className="pb-20">
        <ActiveComponent />
      </main>

      {/* iOS-style Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 bg-blue-600 rounded-full mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
