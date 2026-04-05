import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Nav } from '../components/layouts/Nav';
import { Footer } from '../components/layouts/Footer';
import { Hero } from '../features/transcript/components/Hero';
import { initGoogleAuth, requestAccessToken, revokeToken } from '../lib/google-auth';
import { fetchSubscriptions } from '../lib/youtube-api';
import type { YouTubeChannel } from '../lib/youtube-api';

const Features = lazy(() => import('../features/transcript/components/Features').then(m => ({ default: m.Features })));
const Steps = lazy(() => import('../features/transcript/components/Steps').then(m => ({ default: m.Steps })));
const Demo = lazy(() => import('../features/transcript/components/Demo').then(m => ({ default: m.Demo })));
const Subscriptions = lazy(() => import('../features/transcript/components/Subscriptions').then(m => ({ default: m.Subscriptions })));

const TOKEN_KEY = 'transcripto_access_token';

export function App() {
  const [accessToken, setAccessToken] = useState<string | null>(
    () => sessionStorage.getItem(TOKEN_KEY),
  );
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  const isLoggedIn = accessToken !== null;

  // Init Google auth SDK
  useEffect(() => {
    initGoogleAuth();
  }, []);

  // Restore session: if token exists, reload subscriptions
  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    setSubsLoading(true);

    fetchSubscriptions(accessToken)
      .then((subs) => {
        if (!cancelled) setChannels(subs);
      })
      .catch(() => {
        // Token expired or invalid — clear it
        if (!cancelled) {
          sessionStorage.removeItem(TOKEN_KEY);
          setAccessToken(null);
          setChannels([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSubsLoading(false);
      });

    return () => { cancelled = true; };
  }, [accessToken]);

  const handleLogin = useCallback(async () => {
    try {
      const { accessToken: token } = await requestAccessToken();
      sessionStorage.setItem(TOKEN_KEY, token);
      setAccessToken(token);
    } catch (err) {
      console.error('Google login failed:', err);
    }
  }, []);

  const handleLogout = useCallback(() => {
    if (accessToken) revokeToken(accessToken);
    sessionStorage.removeItem(TOKEN_KEY);
    setAccessToken(null);
    setChannels([]);
  }, [accessToken]);

  const handleAuthToggle = useCallback(() => {
    if (isLoggedIn) {
      handleLogout();
    } else {
      handleLogin();
    }
  }, [isLoggedIn, handleLogin, handleLogout]);

  return (
    <>
      <Nav isLoggedIn={isLoggedIn} onAuthToggle={handleAuthToggle} />
      <main>
        <Hero />
        <Suspense>
          <Features />
          <Steps />
          <Demo />
          <Subscriptions
            isVisible={isLoggedIn}
            accessToken={accessToken}
            channels={channels}
            isLoading={subsLoading}
          />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
