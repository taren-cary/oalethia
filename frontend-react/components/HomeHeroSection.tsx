'use client';

import { useState } from 'react';
import Image from 'next/image';

interface HomeHeroSectionProps {
  user?: any;
}

export default function HomeHeroSection({ user }: HomeHeroSectionProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const errorData = await response.json();
        console.error('Error submitting email:', errorData.error);
        // You could add error state handling here
      }
    } catch (error) {
      console.error('Error submitting email:', error);
      // You could add error state handling here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen flex items-start md:items-center justify-center px-4 pt-28 md:pt-24 pb-16 relative">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/home-hero-background.svg"
          alt="Cosmic background"
          fill
          className="object-cover"
          priority
          loading="eager"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left side - iPhone mockup */}
        <div className="flex justify-center lg:justify-start">
          <div className="relative">
            <Image
              src="/assets/iphone-mockup.svg"
              alt="Oalethia App Preview"
              width={1300}
              height={1300}
              className="drop-shadow-2xl"
              priority
              loading="eager"
              sizes="(max-width: 768px) 0px, 650px"
            />
          </div>
        </div>

        {/* Right side - Content */}
        <div className="text-center lg:text-left space-y-8">
          <div className="space-y-6">
            <h1 className="text-6xl lg:text-7xl font-bold cosmic-text drop-shadow-2xl leading-tight">
              The only astro-manifestation app you will ever need
            </h1>
            <p className="text-2xl lg:text-3xl text-white/90 drop-shadow-lg">
              Coming Soon
            </p>
            <p className="text-lg text-white/80 max-w-2xl">
            Become a master at navigating your reality with precision-guided action plans powered by Quantum Astrology. 
            Get AI-powered timeline generation that aligns your manifestation with optimal cosmic timing.
            </p>
          </div>

          {/* Email signup form */}
          {!user && (
            <div className="max-w-md mx-auto lg:mx-0">
              {!submitted ? (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email for early access"
                      className="flex-1 glass-input text-lg px-6 py-4"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="glass-button px-8 py-4 text-lg font-semibold whitespace-nowrap hover:bg-white/30 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Joining...' : 'Get Early Access'}
                    </button>
                  </div>
                  <p className="text-white/70 text-sm">
                    Be the first to experience cosmic manifestation guidance
                  </p>
                </form>
              ) : (
                <div className="glass-card p-6 text-center">
                  <div className="text-green-400 text-2xl mb-2">✨</div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    You're on the list!
                  </h3>
                  <p className="text-white/80 text-sm">
                    We'll notify you when Oalethia StarManifest is ready to launch.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* For logged in users */}
          {user && (
            <div className="max-w-md mx-auto lg:mx-0">
              <div className="glass-card p-6 text-center">
                <div className="text-purple-400 text-2xl mb-2">🌟</div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  Welcome back, {user.email?.split('@')[0]}!
                </h3>
                <p className="text-white/80 text-sm mb-4">
                  Ready to create your next cosmic action plan?
                </p>
                <a
                  href="/timeline"
                  className="glass-button px-6 py-3 text-lg font-semibold hover:bg-white/30 transition-all inline-block"
                >
                  Generate Timeline
                </a>
              </div>
            </div>
          )}
        </div>
        
        {/* Trust Signals */}
        <div className="text-center mt-12">
          <p className="text-white/60 text-sm mb-2">
            ✨ Powered by Swiss Ephemeris & OpenAI ✨
          </p>
          <p className="text-white/50 text-xs">
            Professional-grade astrological calculations • AI-powered personalization
          </p>
        </div>
      </div>
    </section>
  );
}
