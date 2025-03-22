import '../styles/globals.css';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider, useSession } from '@supabase/auth-helpers-react';
import { useState, useEffect } from 'react';
import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { ShoppingCartProvider } from '@/context/ShoppingCartContext';  // Import the provider

function App({ Component, pageProps }: AppProps) {
  const [supabase] = useState(() => createPagesBrowserClient());
  const router = useRouter();
  const noAuthNeeded = ['/signin']; // Any routes that don't require auth

  // We'll wrap our actual page in a "SessionCheck" component
  // so we can do the redirect logic there:
  function SessionCheck({ children }: { children: React.ReactNode }) {
    const session = useSession();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      // If the current route does NOT need auth, just allow it
      if (noAuthNeeded.includes(router.pathname)) {
        setLoading(false);
        return;
      }
      // Otherwise, if there's no session, redirect to /signin
      if (!session) {
        router.push('/signin');
      } else {
        setLoading(false);
      }
    }, [router, session]);

    if (loading) {
      // Render a simple loading state (or skeleton)
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </div>
      );
    }

    // Once we know whether to allow access, render the page
    return <>{children}</>;
  }

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
      <ShoppingCartProvider>  {/* Wrap with ShoppingCartProvider */}
        <SessionCheck>
          <Component {...pageProps} />
        </SessionCheck>
      </ShoppingCartProvider>
    </SessionContextProvider>
  );
}

export default App;
