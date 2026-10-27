'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function InstallAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as unknown as { standalone?: boolean }).standalone);
    setIsStandalone(standalone);
    if (standalone) return;

    // 2. Check if recently dismissed (within 3 days)
    const dismissedTime = localStorage.getItem('supersave_install_dismissed');
    if (dismissedTime) {
      const diff = Date.now() - Number(dismissedTime);
      if (diff < 3 * 24 * 60 * 60 * 1000) {
        return; // Don't bother user if dismissed recently
      }
    }

    // 3. Register service worker for PWA installability
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration error ignored
      });
    }

    // 4. Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleMobile);

    // 5. Listen for Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // On iOS Safari, beforeinstallprompt does not fire, so show install banner after 2s
    let iosTimer: NodeJS.Timeout | null = null;
    if (isAppleMobile && !standalone) {
      iosTimer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instruction
      alert('To install SuperSave: Tap your browser menu (⋮) and tap "Install app" or "Add to Home screen".');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    try {
      localStorage.setItem('supersave_install_dismissed', String(Date.now()));
    } catch {}
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="install-banner-wrap" role="dialog" aria-label="Install SuperSave">
      <div className="install-banner-card">
        {/* App Icon */}
        <div className="install-banner-icon">
          <span>⚡</span>
        </div>

        {/* Content */}
        <div className="install-banner-info">
          <strong>Install SuperSave App</strong>
          <p>
            {isIOS
              ? 'Add to home screen for 1-tap save from Instagram & YouTube.'
              : 'Install for instant 1-tap sharing & offline access.'}
          </p>

          {showIOSInstructions && (
            <div className="ios-install-steps">
              <span>
                1. Tap the <strong>Share</strong> button <span style={{ fontSize: '13px' }}>⎋</span> below
              </span>
              <span>
                2. Select <strong>Add to Home Screen</strong> <span style={{ fontSize: '13px' }}>⊕</span>
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="install-banner-actions">
          <button
            type="button"
            className="install-btn-primary"
            onClick={handleInstallClick}
          >
            {isIOS ? 'How to Install' : 'Install'}
          </button>
          <button
            type="button"
            className="install-btn-dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
