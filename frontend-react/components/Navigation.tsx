'use client';

import { useState, useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';
import SubscriptionModal from './SubscriptionModal';
import Link from 'next/link';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [userPoints, setUserPoints] = useState<number>(0);
  const [showPointsDropdown, setShowPointsDropdown] = useState(false);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionModalType, setSubscriptionModalType] = useState<'subscription' | 'credits'>('subscription');
  const { user, signOut, loading, session } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to open subscription portal';
        
        if (errorMessage.includes('No active subscription')) {
          alert('You need an active Premium subscription to manage billing. Please upgrade first.');
        } else {
          alert(`Error: ${errorMessage}`);
        }
        return;
      }

      const { url } = await response.json();
      // Redirect to Stripe Customer Portal
      if (typeof window !== 'undefined') {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Error opening subscription portal:', error);
      Sentry.captureException(error, {
        tags: {
          error_type: 'subscription_portal',
        },
      });
      if (error.message?.includes('fetch') || error.name === 'TypeError') {
        alert('Network error. Please check your internet connection and try again.');
      } else {
        alert('An error occurred while opening the subscription portal. Please try again.');
      }
    }
  };

  // Fetch user points and subscription when user is authenticated
  useEffect(() => {
    if (user && session) {
      fetchUserPoints();
      fetchUserSubscription();
    }
  }, [user, session]);

  // Listen for refresh events from payment success
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleRefreshSubscription = () => {
      if (user && session) {
        fetchUserSubscription();
        fetchUserPoints(); // Also refresh points as subscription might affect them
      }
    };

    window.addEventListener('refresh-subscription', handleRefreshSubscription);
    return () => {
      window.removeEventListener('refresh-subscription', handleRefreshSubscription);
    };
  }, [user, session]);

  const fetchUserPoints = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user-points`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserPoints(data.total_points || 0);
      } else if (response.status === 401 || response.status === 403) {
        console.warn('Unauthorized: Session may have expired');
        // Session expired - will be handled by auth context
      } else {
        console.error('Failed to fetch user points:', response.status);
      }
    } catch (error: any) {
      // Only log network errors, don't show to user for background fetches
      if (error.message?.includes('fetch') || error.name === 'TypeError') {
        console.error('Network error fetching user points:', error);
      } else {
        console.error('Error fetching user points:', error);
      }
    }
  };

  const fetchUserSubscription = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user-subscription`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserSubscription(data);
      } else if (response.status === 401 || response.status === 403) {
        console.warn('Unauthorized: Session may have expired');
        // Session expired - will be handled by auth context
      } else if (response.status === 500) {
        console.error('Server error fetching subscription. Subscription status may be unavailable.');
        // Set a default free tier to prevent UI issues
        setUserSubscription({ tier: { name: 'free' }, isFree: true, status: 'active' });
      } else {
        console.error('Failed to fetch subscription:', response.status);
      }
    } catch (error: any) {
      // Handle network errors gracefully
      if (error.message?.includes('fetch') || error.name === 'TypeError') {
        console.error('Network error fetching subscription:', error);
        // Set default to prevent UI breaking
        setUserSubscription({ tier: { name: 'free' }, isFree: true, status: 'active' });
      } else {
        console.error('Error fetching user subscription:', error);
      }
    }
  };

  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-40 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="glass-card px-6 py-3">
            <div className="text-white font-bold text-xl cosmic-text">
              Oalethia
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 p-3 sm:p-4 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="glass-card px-4 py-2 sm:px-6 sm:py-3 hover:bg-white/20 transition-all">
            <div className="text-white font-bold text-lg sm:text-xl cosmic-text">
              Oalethia
            </div>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/timeline" 
              className="glass-button text-sm"
            >
              StarManifest™ Generator
            </Link>
            {user ? (
              <>
                <Link 
                  href="/timelines" 
                  className="glass-button text-sm"
                >
                  My Timelines
                </Link>
                <div 
                  className="relative"
                  onMouseEnter={() => setShowPointsDropdown(true)}
                  onMouseLeave={() => setShowPointsDropdown(false)}
                >
                  <div className="glass-card px-4 py-2 cursor-pointer hover:bg-white/20 transition-all">
                    <span className="text-white text-sm">
                      {user.email}
                    </span>
                  </div>
                  
                  {/* Points Dropdown */}
                  {showPointsDropdown && (
                    <>
                      {/* Invisible bridge to prevent dropdown from closing when moving cursor */}
                      <div className="absolute top-full right-0 w-[200px] h-3" />
                      <div 
                        className="absolute top-full right-0 mt-2 glass-card p-4 min-w-[200px] z-50"
                      >
                      <div className="text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></div>
                          <span className="font-bold text-lg">{userPoints}</span>
                          <span className="text-white/70 text-sm">points</span>
                        </div>
                        <div className="text-white/60 text-xs">
                          Earn points by affirming your daily affirmations
                        </div>
                        <div className="mt-2 pt-2 border-t border-white/20">
                          <div className="text-white/80 text-xs">
                            💫 5 points per timeline affirmation
                          </div>
                        </div>
                        {(userSubscription?.isFree === true || userSubscription?.tier?.name === 'free') && (
                          <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                            <button
                              onClick={() => {
                                setSubscriptionModalType('subscription');
                                setShowSubscriptionModal(true);
                                setShowPointsDropdown(false);
                              }}
                              className="w-full glass-button bg-purple-500/30 border-purple-400/50 hover:bg-purple-500/40 text-sm py-2"
                            >
                              Upgrade
                            </button>
                            <button
                              onClick={() => {
                                setSubscriptionModalType('credits');
                                setShowSubscriptionModal(true);
                                setShowPointsDropdown(false);
                              }}
                              className="w-full glass-button bg-blue-500/30 border-blue-400/50 hover:bg-blue-500/40 text-sm py-2"
                            >
                              Buy Credits
                            </button>
                          </div>
                        )}
                        {userSubscription && userSubscription.tier?.name === 'premium' && !userSubscription.isFree && (
                          <div className="mt-3 pt-3 border-t border-white/20">
                            <button
                              onClick={handleManageSubscription}
                              className="w-full glass-button bg-green-500/30 border-green-400/50 hover:bg-green-500/40 text-sm py-2"
                            >
                              Manage Subscription
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    </>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="glass-button text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                  className="glass-button text-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setShowAuthModal(true);
                  }}
                  className="glass-button text-sm bg-white/30 hover:bg-white/40"
                >
                  Sign Up
                </button>
                <div className="glass-card px-3 py-1">
                  <span className="text-white/80 text-xs">
                    Try free • No credit card
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Mobile burger button */}
          <button
            className="md:hidden glass-card px-3 py-2 flex flex-col justify-center items-center gap-[3px]"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            <span className="block w-5 h-[2px] bg-white rounded" />
            <span className="block w-5 h-[2px] bg-white rounded" />
            <span className="block w-5 h-[2px] bg-white rounded" />
          </button>
        </div>

        {/* Mobile dropdown panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/90 border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3">
              <Link
                href="/timeline"
                className="glass-button w-full text-sm text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                StarManifest™ Generator
              </Link>

              {user ? (
                <>
                  <Link
                    href="/timelines"
                    className="glass-button w-full text-sm text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Timelines
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="glass-button w-full text-sm"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setAuthMode('signin');
                      setShowAuthModal(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="glass-button w-full text-sm"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setShowAuthModal(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="glass-button w-full text-sm bg-white/30 hover:bg-white/40"
                  >
                    Sign Up
                  </button>
                  <div className="glass-card px-3 py-2 text-center">
                    <span className="text-white/80 text-xs">
                      Try free • No credit card
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
      
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        type={subscriptionModalType}
      />
    </>
  );
}
