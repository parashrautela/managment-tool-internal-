'use client';
import { useEffect, useState } from 'react';
import { Download, X, Share, CheckCircle2, WifiOff, Smartphone, ArrowRight } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [showFloatingBanner, setShowFloatingBanner] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    // 1. Service Worker Registration
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV !== 'production') {
        // In development mode, unregister active workers and clear dev caches to prevent HMR reload loops
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
        if ('caches' in window) {
          caches.keys().then((keys) => {
            for (const key of keys) {
              caches.delete(key);
            }
          });
        }
      } else {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
              console.log('[PWA] Service Worker registered with scope:', registration.scope);
              // Check for updates
              registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (installingWorker) {
                  installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      console.log('[PWA] New content is available; please refresh.');
                    }
                  };
                }
              };
            })
            .catch((error) => {
              console.warn('[PWA] Service Worker registration failed:', error);
            });
        });
      }
    }

    // 2. Check standalone display mode (already installed as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // 3. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    setIsIos(isIosDevice && isSafari && !isStandalone);

    // 4. Capture Chromium/Android install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);

      // Check if user dismissed prompt recently
      const dismissed = localStorage.getItem('flowboard_pwa_dismissed');
      if (!dismissed) {
        setShowFloatingBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Track successful install
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] Flowboard installed successfully');
      setIsInstalled(true);
      setIsInstallable(false);
      setShowFloatingBanner(false);
      setDeferredPrompt(null);
    });

    // 6. Network status listeners
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 4000);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 7. Custom event for triggering installation from anywhere in the UI
    const handleTriggerInstall = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choice) => {
          if (choice.outcome === 'accepted') {
            setIsInstallable(false);
            setShowFloatingBanner(false);
          }
          setDeferredPrompt(null);
        });
      } else if (isIosDevice) {
        setShowIosPrompt(true);
      } else {
        alert('To install Flowboard, open this page in Google Chrome, Edge, or Safari on your mobile device and select "Install" or "Add to Home Screen".');
      }
    };

    window.addEventListener('flowboard:install', handleTriggerInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('flowboard:install', handleTriggerInstall);
    };
  }, [deferredPrompt]);

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstallable(false);
        setShowFloatingBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosPrompt(true);
    }
  }

  function handleDismissBanner() {
    setShowFloatingBanner(false);
    try {
      localStorage.setItem('flowboard_pwa_dismissed', 'true');
    } catch {
      // Ignore
    }
  }

  return (
    <>
      {/* Offline Status Top Ribbon */}
      {!isOnline && (
        <div className="pwa-offline-ribbon" role="alert">
          <WifiOff size={14} />
          <span>You are currently working offline. Cached workspace shell is available.</span>
        </div>
      )}

      {/* Online Reconnected Toast */}
      {showOnlineToast && (
        <div className="pwa-online-toast" role="status">
          <CheckCircle2 size={16} />
          <span>Back online! Workspace connectivity restored.</span>
        </div>
      )}

      {/* Main app children */}
      {children}

      {/* Android/Desktop Floating Install Prompt Banner */}
      {showFloatingBanner && !isInstalled && isInstallable && (
        <aside className="pwa-install-banner" aria-label="Install app banner">
          <div className="pwa-banner-content">
            <span className="pwa-app-icon">
              <svg width="22" height="22" viewBox="0 0 40 40">
                <rect width="40" height="40" rx="11" fill="#7360df" />
                <path d="M11 13h18v6H17v10h-6z" fill="white" />
                <path d="M21 23h8v6h-8z" fill="#c8bdff" />
              </svg>
            </span>
            <div className="pwa-banner-text">
              <strong>Install Flowboard</strong>
              <small>Fast, offline-ready desktop & mobile experience</small>
            </div>
          </div>
          <div className="pwa-banner-actions">
            <button className="primary small-btn" onClick={handleInstallClick}>
              <Download size={13} /> Install
            </button>
            <button
              className="pwa-close-btn"
              onClick={handleDismissBanner}
              aria-label="Dismiss installation prompt"
            >
              <X size={15} />
            </button>
          </div>
        </aside>
      )}

      {/* iOS Safari Add to Home Screen Instructions Modal */}
      {showIosPrompt && (
        <div className="modal-overlay" onClick={() => setShowIosPrompt(false)}>
          <div
            className="modal pwa-ios-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Install on iOS Safari"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowIosPrompt(false)}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            <span className="modal-icon">
              <Smartphone size={24} />
            </span>

            <h2>Install Flowboard on your iPhone / iPad</h2>
            <p className="modal-subtitle">
              Add Flowboard to your home screen for full-screen mode and quick launch.
            </p>

            <div className="ios-steps-list">
              <div className="ios-step-item">
                <span className="ios-step-badge">1</span>
                <div>
                  <p>
                    Tap the <strong>Share</strong> button <Share size={15} className="inline-icon" /> at the bottom of Safari.
                  </p>
                </div>
              </div>

              <div className="ios-step-item">
                <span className="ios-step-badge">2</span>
                <div>
                  <p>
                    Scroll down and tap <strong>Add to Home Screen</strong> <PlusIcon />.
                  </p>
                </div>
              </div>

              <div className="ios-step-item">
                <span className="ios-step-badge">3</span>
                <div>
                  <p>
                    Tap <strong>Add</strong> in the top-right corner to launch Flowboard like a native app.
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="primary wide"
                onClick={() => setShowIosPrompt(false)}
              >
                Got it <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PlusIcon() {
  return (
    <span className="ios-inline-plus">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </span>
  );
}
