'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import CountdownTimer from '@/components/CountdownTimer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface LevelData {
  level: number;
  levelName: string;
  lifetimePoints: number;
  pointsNeeded: number;
  progressPercent: number;
  isMaxLevel: boolean;
}

interface TimelineAction {
  date: string;
  action: string;
  transit: string;
  strategy?: string;
}

interface SavedTimeline {
  id: string;
  outcome: string;
  actions: TimelineAction[];
  timeline_affirmations: string[];
  created_at: string;
}

interface AffirmationItem {
  timelineId: string;
  outcome: string;
  affirmationText: string;
  affirmationIndex: number;
  imageUrl: string | null;
  affirmed: boolean;
}

interface NextActionItem {
  timelineId: string;
  outcome: string;
  action: TimelineAction;
  actionIndex: number;
  completed: boolean;
}

function parseActionDate(dateString: string): Date {
  let date = new Date(dateString);
  if (isNaN(date.getTime())) {
    if (dateString.toLowerCase().includes('next')) {
      date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    } else if (dateString.toLowerCase().includes('tomorrow')) {
      date = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else {
      const cleaned = dateString.replace(/(\d+)(st|nd|rd|th)/, '$1');
      date = new Date(cleaned);
      if (isNaN(date.getTime())) {
        date = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
    }
  }
  date.setHours(23, 59, 59, 999);
  return date;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/10 rounded-lg ${className ?? ''}`} />;
}

export default function HomePage() {
  const { user, session, loading: authLoading } = useAuth();

  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const [timelines, setTimelines] = useState<SavedTimeline[]>([]);
  const [affirmations, setAffirmations] = useState<AffirmationItem[]>([]);
  const [nextActions, setNextActions] = useState<NextActionItem[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  const [affirmingId, setAffirmingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const timeZone = typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

  const fetchStats = useCallback(async () => {
    if (!session) return;
    setStatsLoading(true);
    try {
      const [levelRes, profileRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user-level`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);
      if (levelRes.ok) setLevelData(await levelRes.json());
      if (profileRes.ok) {
        const p = await profileRes.json();
        setStreak(p.stats?.currentStreak ?? 0);
      }
    } catch {
      // ignore
    } finally {
      setStatsLoading(false);
    }
  }, [session]);

  const fetchContent = useCallback(async () => {
    if (!user || !session) return;
    setContentLoading(true);
    try {
      const { data: rows } = await supabase
        .from('action_timeline_generations')
        .select('id, outcome, actions, timeline_affirmations, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!rows || rows.length === 0) {
        setTimelines([]);
        setAffirmations([]);
        setNextActions([]);
        return;
      }

      setTimelines(rows as SavedTimeline[]);

      // Fetch affirmations and progress in parallel
      const [affirmResults, progressResults] = await Promise.all([
        Promise.all(
          rows.map((t) =>
            fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/today-affirmation/${t.id}?tz=${encodeURIComponent(timeZone)}`,
              { headers: { Authorization: `Bearer ${session.access_token}` } }
            )
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        ),
        Promise.all(
          rows.map((t) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/action-progress/${t.id}`, {
              headers: { Authorization: `Bearer ${session.access_token}` },
            })
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        ),
      ]);

      // Build affirmation items
      const affirmItems: AffirmationItem[] = rows.map((t, i) => {
        const data = affirmResults[i];
        return {
          timelineId: t.id,
          outcome: t.outcome,
          affirmationText: data?.affirmation_text ?? (t.timeline_affirmations?.[0] ?? ''),
          affirmationIndex: data?.affirmation_index ?? 0,
          imageUrl: data?.image_url ?? null,
          affirmed: data?.affirmed === true,
        };
      });
      setAffirmations(affirmItems);

      // Build next action items
      const actionItems: NextActionItem[] = [];
      rows.forEach((t, i) => {
        const progress = progressResults[i];
        const completed: number[] = (progress?.progress ?? [])
          .filter((p: any) => p.completed)
          .map((p: any) => p.action_index);
        const skipped: number[] = (progress?.progress ?? [])
          .filter((p: any) => p.skipped)
          .map((p: any) => p.action_index);

        const actions: TimelineAction[] = t.actions ?? [];
        const nextIdx = actions.findIndex((_, idx) => !completed.includes(idx) && !skipped.includes(idx));
        if (nextIdx >= 0) {
          actionItems.push({
            timelineId: t.id,
            outcome: t.outcome,
            action: actions[nextIdx],
            actionIndex: nextIdx,
            completed: completed.includes(nextIdx),
          });
        }
      });

      // Sort by action date ascending
      actionItems.sort((a, b) => {
        const da = parseActionDate(a.action.date).getTime();
        const db = parseActionDate(b.action.date).getTime();
        return da - db;
      });

      setNextActions(actionItems);
    } catch {
      // ignore
    } finally {
      setContentLoading(false);
    }
  }, [user, session, timeZone]);

  useEffect(() => {
    if (!authLoading && user && session) {
      fetchStats();
      fetchContent();
    } else if (!authLoading && !user) {
      setStatsLoading(false);
      setContentLoading(false);
    }
  }, [authLoading, user, session, fetchStats, fetchContent]);

  // Refresh stats when points change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => fetchStats();
    window.addEventListener('refresh-points', handler);
    return () => window.removeEventListener('refresh-points', handler);
  }, [fetchStats]);

  const handleAffirm = async (item: AffirmationItem) => {
    if (!session || affirmingId || item.affirmed) return;
    setAffirmingId(item.timelineId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/affirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          generation_id: item.timelineId,
          affirmation_index: item.affirmationIndex,
          affirmation_text: item.affirmationText,
          tz: timeZone,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAffirmations((prev) =>
          prev.map((a) => (a.timelineId === item.timelineId ? { ...a, affirmed: true } : a))
        );
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('refresh-points'));
          if (data.levelUp) {
            window.dispatchEvent(new CustomEvent('level-up', { detail: data.levelUp }));
          }
        }
        fetchStats();
      }
    } catch {
      // ignore
    } finally {
      setAffirmingId(null);
    }
  };

  const handleToggleComplete = async (item: NextActionItem) => {
    if (!session || completingId) return;
    setCompletingId(item.timelineId);
    const isCompleting = !item.completed;
    setNextActions((prev) =>
      prev.map((a) =>
        a.timelineId === item.timelineId ? { ...a, completed: isCompleting } : a
      )
    );
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/action-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          generationId: item.timelineId,
          actionIndex: item.actionIndex,
          completed: isCompleting,
          skipped: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('refresh-points'));
          if (data.levelUp) {
            window.dispatchEvent(new CustomEvent('level-up', { detail: data.levelUp }));
          }
        }
        fetchStats();
        // Refresh content to advance to next action
        if (isCompleting) await fetchContent();
      }
    } catch {
      // revert
      setNextActions((prev) =>
        prev.map((a) =>
          a.timelineId === item.timelineId ? { ...a, completed: !isCompleting } : a
        )
      );
    } finally {
      setCompletingId(null);
    }
  };

  const handleShareAffirmation = async (item: AffirmationItem) => {
    const shareText = `"${item.affirmationText}" — via Oalethia`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: "Today's cosmic affirmation", text: shareText });
        return;
      } catch {
        // User dismissed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedId(item.timelineId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleSkip = async (item: NextActionItem) => {
    if (!session || completingId) return;
    setCompletingId(item.timelineId);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/action-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          generationId: item.timelineId,
          actionIndex: item.actionIndex,
          completed: false,
          skipped: true,
        }),
      });
      await fetchContent();
    } catch {
      // ignore
    } finally {
      setCompletingId(null);
    }
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (authLoading) {
    return (
      <main className="min-h-screen relative">
        <Navigation />
        <div className="relative z-10 pt-24 pb-16 px-4 max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
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
              <div className="text-5xl mb-4">✨</div>
              <h2 className="text-2xl font-bold text-white mb-3">Your cosmic dashboard</h2>
              <p className="text-white/70 mb-6">
                Sign in to see your level, streak, daily affirmations, and next actions — all in one place.
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
        <div className="max-w-4xl mx-auto space-y-8">

          <div className="text-center">
            <h1 className="text-4xl font-bold text-white cosmic-text">Dashboard</h1>
            <p className="text-white/60 text-sm mt-1">{todayFormatted}</p>
          </div>

          {/* Stats Card */}
          {statsLoading ? (
            <Skeleton className="h-32" />
          ) : levelData ? (
            <div className="glass-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={`/assets/badges/level${Math.min(Math.max(levelData.level, 1), 12)}.svg`}
                  alt={`${levelData.levelName} badge`}
                  width={56}
                  height={56}
                  className="w-14 h-14 flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-lg cosmic-text truncate">
                    Level {levelData.level}: {levelData.levelName}
                  </div>
                  {!levelData.isMaxLevel ? (
                    <>
                      <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                        <div
                          className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${levelData.progressPercent}%` }}
                        />
                      </div>
                      <div className="text-white/50 text-xs mt-1">
                        {levelData.pointsNeeded.toLocaleString()} points to next level
                      </div>
                    </>
                  ) : (
                    <div className="text-white/50 text-xs mt-1">Max level achieved 🎉</div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
                  <div className="text-white/60 text-xs mb-1">Lifetime</div>
                  <div className="text-white font-bold">{levelData.lifetimePoints.toLocaleString()} pts</div>
                </div>
                <div className="flex-1 bg-white/10 rounded-xl p-3 text-center">
                  <div className="text-white/60 text-xs mb-1">Streak</div>
                  <div className="text-white font-bold">{streak} day{streak !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Today's Affirmations */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Today's Affirmations</h2>
            {contentLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-36" />
                <Skeleton className="h-36" />
              </div>
            ) : affirmations.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <div className="text-4xl mb-3">🌟</div>
                <p className="text-white font-semibold mb-2">No timelines yet</p>
                <p className="text-white/70 text-sm mb-4">
                  Generate a timeline to start earning daily affirmations.
                </p>
                <Link href="/timeline" className="glass-button inline-block">
                  Generate a Timeline
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {affirmations.map((item) => (
                  <div key={item.timelineId} className="glass-card p-6">
                    <div className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">
                      {item.outcome}
                    </div>
                    <div className="flex gap-4 items-start">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt="Affirmation"
                          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-base italic leading-relaxed mb-3">
                          "{item.affirmationText}"
                        </p>
                        <p className="text-white/50 text-xs mb-4">{todayFormatted}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleAffirm(item)}
                            disabled={item.affirmed || affirmingId === item.timelineId}
                            className={`glass-button text-sm px-5 py-2 ${
                              item.affirmed
                                ? 'bg-green-500/30 border-green-400/50 opacity-70 cursor-default'
                                : 'bg-purple-500/30 border-purple-400/50 hover:bg-purple-500/40'
                            }`}
                          >
                            {item.affirmed
                              ? 'Affirmed ✓'
                              : affirmingId === item.timelineId
                              ? 'Affirming…'
                              : 'Affirm'}
                          </button>
                          <button
                            onClick={() => handleShareAffirmation(item)}
                            className="glass-button text-sm px-4 py-2 bg-white/5 border-white/20 hover:bg-white/15"
                            title="Share affirmation"
                          >
                            {copiedId === item.timelineId ? 'Copied ✓' : 'Share'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Next Actions */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Your Next Actions</h2>
            {contentLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            ) : nextActions.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <div className="text-4xl mb-3">🎯</div>
                <p className="text-white font-semibold mb-2">
                  {timelines.length === 0 ? 'No timelines yet' : 'All actions complete'}
                </p>
                <p className="text-white/70 text-sm mb-4">
                  {timelines.length === 0
                    ? 'Generate a timeline to get your first cosmic actions.'
                    : 'Generate a new timeline to keep your momentum going.'}
                </p>
                <Link href="/timeline" className="glass-button inline-block">
                  Generate a Timeline
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {nextActions.map((item) => {
                  const targetDate = parseActionDate(item.action.date);
                  return (
                    <div
                      key={item.timelineId}
                      className="glass-card p-6 border border-yellow-400/20"
                    >
                      <div className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-2">
                        {item.outcome}
                      </div>
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="bg-purple-500/30 text-white text-xs px-3 py-1 rounded-full font-semibold">
                          {item.action.date}
                        </span>
                        <CountdownTimer targetDate={targetDate} compact />
                      </div>
                      <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 mb-4">
                        <p className="text-blue-200 text-xs font-semibold mb-1">Cosmic Support</p>
                        <p className="text-white/80 text-sm">{item.action.transit}</p>
                      </div>
                      <p className="text-white font-semibold text-lg mb-4">{item.action.action}</p>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleToggleComplete(item)}
                            disabled={!!completingId}
                            className="w-5 h-5 rounded cursor-pointer"
                          />
                          <span className="text-white/80 text-sm">Mark complete</span>
                        </label>
                        <button
                          onClick={() => handleSkip(item)}
                          disabled={!!completingId}
                          className="text-white/40 hover:text-white/70 text-sm transition-colors ml-auto"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
