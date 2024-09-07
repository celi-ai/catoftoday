import React, { useState, useEffect } from 'react';
import { Share2, Award, TrendingUp } from 'lucide-react';

const UserTab = ({ user }) => {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const renderStreak = (streak) => {
    return Array(streak).fill().map((_, i) => (
      <span key={i} className="text-yellow-400 text-2xl">🔥</span>
    ));
  };

  return (
    <div className="bg-gradient-to-b from-blue-900 to-purple-900 min-h-screen p-6 text-white">
      <div className="max-w-md mx-auto bg-white bg-opacity-10 rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-400 font-semibold mb-1">{greeting}</div>
          <h2 className="text-3xl font-bold mb-2">Welcome, {user.name}!</h2>
          <p className="text-gray-300 mb-4">Here's your paw-some stats:</p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Pats:</span>
              <span className="text-2xl font-bold">{user.totalPats}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Available Pats:</span>
              <span className="text-2xl font-bold text-green-400">{user.availablePats}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Streak:</span>
              <div className="flex items-center">
                <span className="text-2xl font-bold mr-2">{user.streak} days</span>
                {renderStreak(user.streak)}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-xl font-semibold mb-2">Achievements</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center">
                <Award className="text-yellow-400 mb-1" size={24} />
                <span className="text-xs text-center">Top Patter</span>
              </div>
              <div className="flex flex-col items-center">
                <TrendingUp className="text-green-400 mb-1" size={24} />
                <span className="text-xs text-center">Streak Master</span>
              </div>
              <div className="flex flex-col items-center opacity-50">
                <Award className="mb-1" size={24} />
                <span className="text-xs text-center">Cat Whisperer</span>
              </div>
            </div>
          </div>

          <button className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full transition duration-300 flex items-center justify-center">
            <Share2 className="mr-2" size={18} />
            Share Your Stats
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-400 text-sm">
        <p>Keep patting to unlock more achievements!</p>
      </div>
    </div>
  );
};

export default UserTab;