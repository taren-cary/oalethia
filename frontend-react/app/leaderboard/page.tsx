'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  lifetimePoints: number;
  level: number;
  levelName: string;
}

export default function LeaderboardPage() {
  const { session } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard?limit=25`, { headers });
      if (!res.ok) throw new Error('Failed to load leaderboard');
      const data = await res.json();
      const formatted: LeaderboardEntry[] = (Array.isArray(data) ? data : [])
        .slice(0, 25)
        .map((e: any, i: number) => ({
          rank: i + 1,
          userId: e.userId ?? e.user_id ?? `user-${i}`,
          username: e.username ?? 'Unknown',
          lifetimePoints: e.lifetimePoints ?? e.lifetime_points ?? 0,
          level: e.level ?? 1,
          levelName: e.levelName ?? e.level_name ?? '',
        }));
      setLeaderboard(formatted);
    } catch (err: any) {
      setError('Could not load the leaderboard right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative">
      <Navigation />
      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 cosmic-text">
              Leaderboard
            </h1>
            <p className="text-white/70 text-lg">
              Those Who Navigated The Odds & Reached Their Destination
            </p>
          </div>

          {loading ? (
            <div className="glass-card p-8 text-center">
              <div className="animate-pulse text-white">Loading leaderboard...</div>
            </div>
          ) : error ? (
            <div className="glass-card p-8 text-center">
              <p className="text-white/70">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="glass-button mt-4 text-sm"
              >
                Try Again
              </button>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <div className="text-5xl mb-4">🌟</div>
              <p className="text-white font-semibold mb-2">No one on the leaderboard yet</p>
              <p className="text-white/60 text-sm">
                Be the first — generate a timeline and start affirming daily to earn points.
              </p>
            </div>
          ) : (
            <div className="glass-card p-6">
              <div className="space-y-2">
                {leaderboard.map((entry, index) => {
                  const badgePath = `/assets/badges/level${Math.min(Math.max(entry.level, 1), 12)}.svg`;
                  const isTopThree = index < 3;

                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg transition-all ${
                        isTopThree
                          ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-400/50 shadow-lg shadow-yellow-500/20 hover:from-yellow-500/40 hover:to-orange-500/40'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      {/* Rank */}
                      <div className={`text-xl sm:text-2xl font-bold w-8 sm:w-12 text-center flex-shrink-0 ${
                        isTopThree ? 'text-yellow-300' : 'text-white'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${entry.rank}`}
                      </div>

                      {/* Badge */}
                      <div className={`flex-shrink-0 ${isTopThree ? 'scale-110' : ''} transition-transform`}>
                        <Image
                          src={badgePath}
                          alt={`Level ${entry.level} Badge`}
                          width={40}
                          height={40}
                          className="w-8 h-8 sm:w-10 sm:h-10"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0 text-left ml-1 sm:ml-0">
                        <div className={`font-semibold truncate text-left ${
                          isTopThree ? 'text-yellow-100 text-base sm:text-lg' : 'text-white'
                        }`}>
                          {entry.username}
                        </div>
                        {entry.levelName && (
                          <div className={`text-xs sm:text-sm text-left ${
                            isTopThree ? 'text-yellow-200/80' : 'text-white/60'
                          }`}>
                            Level {entry.level}: {entry.levelName}
                          </div>
                        )}
                      </div>

                      {/* Points */}
                      <div className="text-right flex-shrink-0 ml-auto">
                        <div className="font-bold text-sm sm:text-base text-yellow-300">
                          {entry.lifetimePoints.toLocaleString()}
                        </div>
                        <div className={`text-xs ${isTopThree ? 'text-yellow-200/70' : 'text-white/60'}`}>
                          points
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
