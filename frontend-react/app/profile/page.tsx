'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import LevelDisplay from '@/components/LevelDisplay';
import SubscriptionModal from '@/components/SubscriptionModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl: string | null;
  lifetimePoints: number;
  level: number;
  levelName: string;
}

interface SubscriptionData {
  isFree: boolean;
  status: string;
  tier?: { name: string };
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded-lg ${className ?? ''}`} />;
}

export default function ProfilePage() {
  const { user, session, loading: authLoading, signOut } = useAuth();

  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);

  const [profileLoading, setProfileLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionModalType, setSubscriptionModalType] = useState<'subscription' | 'credits'>('subscription');
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!session || !user) return;
    setProfileLoading(true);
    try {
      const [profileRes, subRes, profileRow] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user-subscription`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        supabase
          .from('user_profiles')
          .select('username, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      if (profileRes.ok) {
        const p = await profileRes.json();
        setStreak(p.stats?.currentStreak ?? 0);
      }
      if (subRes.ok) {
        setSubscription(await subRes.json());
      } else {
        setSubscription({ isFree: true, status: 'active' });
      }
      if (profileRow.data) {
        setUsername(profileRow.data.username ?? null);
        setAvatarUrl(profileRow.data.avatar_url ?? null);
      }
    } catch {
      // ignore
    } finally {
      setProfileLoading(false);
    }
  }, [session, user]);

  const fetchLeaderboard = useCallback(async () => {
    if (!session) return;
    setLeaderboardLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard?limit=3`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLeaderboard(
            data.slice(0, 3).map((e: any) => ({
              userId: e.userId ?? e.user_id ?? '',
              username: e.username ?? 'Unknown',
              avatarUrl: e.avatarUrl ?? e.avatar_url ?? null,
              lifetimePoints: e.lifetimePoints ?? e.lifetime_points ?? 0,
              level: e.level ?? 1,
              levelName: e.levelName ?? '',
            }))
          );
        }
      }
    } catch {
      // ignore
    } finally {
      setLeaderboardLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!authLoading && user && session) {
      fetchProfile();
      fetchLeaderboard();
    } else if (!authLoading && !user) {
      setProfileLoading(false);
      setLeaderboardLoading(false);
    }
  }, [authLoading, user, session, fetchProfile, fetchLeaderboard]);

  const handleManageSubscription = async () => {
    if (!session || portalLoading) return;
    setPortalLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (res.ok) {
        const { url } = await res.json();
        if (typeof window !== 'undefined') window.location.href = url;
      } else {
        alert('Could not open the billing portal. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || avatarUploading) return;
    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({ user_id: user.id, avatar_url: publicUrl }, { onConflict: 'user_id' });
      if (updateError) throw updateError;
      setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
    } catch {
      alert('Could not upload avatar. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleEditUsername = () => {
    setUsernameInput(username ?? '');
    setUsernameError('');
    setEditingUsername(true);
  };

  const handleSaveUsername = async () => {
    const trimmed = usernameInput.trim().toLowerCase();
    if (trimmed.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }
    if (trimmed.length > 30) {
      setUsernameError('Username must be 30 characters or fewer');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setUsernameError('Only letters, numbers, and underscores allowed');
      return;
    }
    if (!user) return;
    setUsernameSaving(true);
    setUsernameError('');
    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ user_id: user.id, username: trimmed }, { onConflict: 'user_id' });
      if (error) {
        if (error.message?.toLowerCase().includes('unique') || error.code === '23505') {
          setUsernameError('That username is already taken');
        } else {
          setUsernameError('Could not save username. Please try again.');
        }
        return;
      }
      setUsername(trimmed);
      setEditingUsername(false);
    } catch {
      setUsernameError('Could not save username. Please try again.');
    } finally {
      setUsernameSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteLoading) return;
    const confirmed = window.confirm(
      'This will permanently delete your account, timelines, points, and all data. This cannot be undone. Are you sure?'
    );
    if (!confirmed) return;
    setDeleteLoading(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
        body: {},
      });
      if (error) {
        alert('Could not delete your account right now. Please try again.');
        setDeleteLoading(false);
        return;
      }
      await signOut();
    } catch {
      alert('Something went wrong. Please try again.');
      setDeleteLoading(false);
    }
  };

  const displayName = username || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();
  const isPremium = subscription && !subscription.isFree && subscription.tier?.name === 'premium';

  if (authLoading) {
    return (
      <main className="min-h-screen relative">
        <Navigation />
        <div className="relative z-10 pt-24 pb-16 px-4 max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen relative">
        <Navigation />
        <div className="relative z-10 pt-24 pb-16 px-4">
          <div className="max-w-xl mx-auto">
            <div className="glass-card p-8 text-center">
              <div className="text-5xl mb-4">👤</div>
              <h2 className="text-2xl font-bold text-white mb-3">Your Profile</h2>
              <p className="text-white/70 mb-6">
                Sign in to view your level, streak, subscription, and account settings.
              </p>
              <Link href="/timeline" className="glass-button inline-block">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative">
      <Navigation />
      <div className="relative z-10 pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          <h1 className="text-4xl font-bold text-white text-center cosmic-text">Profile</h1>

          {/* Avatar + name */}
          <div className="glass-card p-8 flex flex-col items-center gap-3">
            <label className="relative cursor-pointer group">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={avatarUploading}
              />
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-white/30 group-hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30 group-hover:bg-white/30 transition-colors">
                  {avatarUploading ? '…' : initials}
                </div>
              )}
              <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-semibold">{avatarUploading ? 'Uploading…' : 'Change'}</span>
              </div>
            </label>
            <div className="text-center w-full">
              {editingUsername ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="glass-input w-full text-center text-white font-bold text-lg"
                    placeholder="your_username"
                    maxLength={30}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveUsername();
                      if (e.key === 'Escape') setEditingUsername(false);
                    }}
                  />
                  {usernameError && (
                    <p className="text-red-400 text-xs">{usernameError}</p>
                  )}
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleSaveUsername}
                      disabled={usernameSaving}
                      className="glass-button text-sm px-4 py-1.5 bg-green-500/30 border-green-400/50 hover:bg-green-500/40"
                    >
                      {usernameSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingUsername(false)}
                      disabled={usernameSaving}
                      className="glass-button text-sm px-4 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <div className="text-white font-bold text-xl">{displayName}</div>
                  <button
                    onClick={handleEditUsername}
                    className="text-white/40 hover:text-white/80 text-sm transition-colors"
                    title="Edit username"
                  >
                    ✎
                  </button>
                </div>
              )}
              {user.email && (
                <div className="text-white/60 text-sm mt-1">{user.email}</div>
              )}
            </div>
          </div>

          {/* Level */}
          <LevelDisplay />

          {/* Streak */}
          {profileLoading ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="glass-card p-6">
              <div className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">
                Affirmation Streak
              </div>
              <div className="text-white text-3xl font-bold">
                {streak} <span className="text-lg font-normal text-white/70">day{streak !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {/* Leaderboard Preview */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <h2 className="text-white font-bold text-lg">Leaderboard</h2>
              <Link href="/leaderboard" className="text-purple-300 hover:text-purple-200 text-sm font-medium">
                See all →
              </Link>
            </div>
            <div className="border-t border-white/10" />
            {leaderboardLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-white/60 text-sm text-center py-6">
                No one on the leaderboard yet — start affirming daily!
              </p>
            ) : (
              <div className="px-6 pb-5 pt-3 space-y-3">
                {leaderboard.map((entry, i) => (
                  <div key={entry.userId} className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center flex-shrink-0">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                    </span>
                    <Image
                      src={`/assets/badges/level${Math.min(Math.max(entry.level, 1), 12)}.svg`}
                      alt={`Level ${entry.level}`}
                      width={28}
                      height={28}
                      className="w-7 h-7 flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    {entry.avatarUrl ? (
                      <img
                        src={entry.avatarUrl}
                        alt={entry.username}
                        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {entry.username.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm truncate">{entry.username}</div>
                      <div className="text-white/50 text-xs">{entry.levelName}</div>
                    </div>
                    <div className="text-yellow-300 font-bold text-sm flex-shrink-0">
                      {entry.lifetimePoints.toLocaleString()} pts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subscription & Billing */}
          {profileLoading ? (
            <Skeleton className="h-32" />
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="px-6 pt-5 pb-3">
                <div className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">
                  Subscription & Billing
                </div>
                <div className="text-white font-bold text-lg">
                  {isPremium ? 'Premium' : 'Free plan'}
                </div>
              </div>
              <div className="border-t border-white/10" />
              <div className="px-6 py-4 space-y-3">
                {isPremium ? (
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="w-full glass-button bg-green-500/30 border-green-400/50 hover:bg-green-500/40 text-sm py-3"
                  >
                    {portalLoading ? 'Loading…' : 'Manage Subscription'}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => { setSubscriptionModalType('subscription'); setShowSubscriptionModal(true); }}
                      className="w-full glass-button bg-purple-500/30 border-purple-400/50 hover:bg-purple-500/40 text-sm py-3"
                    >
                      Upgrade to Premium
                    </button>
                    <button
                      onClick={() => { setSubscriptionModalType('credits'); setShowSubscriptionModal(true); }}
                      className="w-full glass-button bg-blue-500/30 border-blue-400/50 hover:bg-blue-500/40 text-sm py-3"
                    >
                      Buy Credits
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Account Settings */}
          <div className="glass-card overflow-hidden">
            <div className="px-6 pt-5 pb-3">
              <h2 className="text-white font-bold text-lg">Settings</h2>
            </div>
            <div className="border-t border-white/10" />
            {[
              {
                label: 'Privacy Policy',
                href: 'https://oalethia.com/privacy',
                external: true,
              },
              {
                label: 'Terms of Service',
                href: 'https://oalethia.com/terms',
                external: true,
              },
              {
                label: 'Contact Support',
                href: 'mailto:support@oalethia.com',
                external: true,
              },
            ].map((row) => (
              <a
                key={row.label}
                href={row.href}
                target={row.external ? '_blank' : undefined}
                rel={row.external ? 'noopener noreferrer' : undefined}
                className="flex items-center justify-between px-6 py-4 border-t border-white/10 hover:bg-white/10 transition-colors"
              >
                <span className="text-white text-sm font-medium">{row.label}</span>
                <span className="text-white/40 text-lg">›</span>
              </a>
            ))}
            <button
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className="flex items-center justify-between w-full px-6 py-4 border-t border-white/10 hover:bg-red-500/10 transition-colors"
            >
              <span className="text-red-400 text-sm font-medium">
                {deleteLoading ? 'Deleting…' : 'Delete Account'}
              </span>
              <span className="text-red-400/50 text-lg">›</span>
            </button>
          </div>

          {/* Sign Out */}
          <button
            onClick={() => signOut()}
            className="w-full glass-button text-sm py-3"
          >
            Sign Out
          </button>

        </div>
      </div>

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        type={subscriptionModalType}
      />
    </main>
  );
}
