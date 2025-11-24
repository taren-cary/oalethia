'use client';

import { useEffect, useState } from 'react';

interface CosmicLoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function CosmicLoadingSpinner({ 
  message = "Generating Your Cosmic Roadmap...", 
  size = 'medium' 
}: CosmicLoadingSpinnerProps) {
  const [currentMessage, setCurrentMessage] = useState(message);
  const [planetRotation, setPlanetRotation] = useState(0);
  const [starTwinkle, setStarTwinkle] = useState(0);

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-20 h-20'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  // Rotate planets
  useEffect(() => {
    const interval = setInterval(() => {
      setPlanetRotation(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Twinkle stars
  useEffect(() => {
    const interval = setInterval(() => {
      setStarTwinkle(prev => (prev + 1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Cycle through loading messages
  useEffect(() => {
    const messages = [
      "Generating Your Cosmic Roadmap...",
      "Calculating Planetary Alignments...",
      "Channeling Stellar Wisdom...",
      "Aligning Universal Forces...",
      "Finalizing Your Destiny..."
    ];

    let messageIndex = 0;
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setCurrentMessage(messages[messageIndex]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="cosmic-loading-container">
      <div className={`cosmic-spinner ${sizeClasses[size]}`}>
        {/* Outer Ring - Stars */}
        <div 
          className="spinner-ring outer-ring"
          style={{ transform: `rotate(${planetRotation * 0.5}deg)` }}
        >
          <div className="star star-1">⭐</div>
          <div className="star star-2">✨</div>
          <div className="star star-3">🌟</div>
          <div className="star star-4">💫</div>
        </div>

        {/* Middle Ring - Planets */}
        <div 
          className="spinner-ring middle-ring"
          style={{ transform: `rotate(${planetRotation}deg)` }}
        >
          <div className="planet planet-1">🌍</div>
          <div className="planet planet-2">🌙</div>
          <div className="planet planet-3">☀️</div>
        </div>

        {/* Inner Core - Galaxy */}
        <div 
          className="spinner-core"
          style={{ transform: `rotate(${planetRotation * 2}deg)` }}
        >
          <div className="galaxy-spiral">
            <div className="spiral-arm arm-1"></div>
            <div className="spiral-arm arm-2"></div>
            <div className="spiral-arm arm-3"></div>
          </div>
        </div>

        {/* Central Pulsing Core */}
        <div 
          className="spinner-center"
          style={{ 
            animationDelay: `${starTwinkle * 0.01}s`,
            transform: `scale(${1 + Math.sin(starTwinkle * 0.1) * 0.2})`
          }}
        >
          <div className="core-glow">🔮</div>
        </div>

        {/* Floating Particles */}
        <div className="floating-particles">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                animationDelay: `${i * 0.2}s`,
                transform: `rotate(${planetRotation + i * 45}deg) translateX(${20 + i * 5}px)`
              }}
            >
              <div className="particle-dot"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading Message */}
      <div className={`cosmic-loading-text ${textSizeClasses[size]}`}>
        {currentMessage}
      </div>

      {/* Progress Dots */}
      <div className="loading-dots">
        <div className="dot" style={{ animationDelay: '0s' }}></div>
        <div className="dot" style={{ animationDelay: '0.2s' }}></div>
        <div className="dot" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
}
