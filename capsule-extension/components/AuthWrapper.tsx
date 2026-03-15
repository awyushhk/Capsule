import React, { useEffect, useState } from 'react';
import { SignIn, useAuth } from '@clerk/chrome-extension';
import { setApiTokenFetcher } from '../utils/api';
import { useCapsuleStore } from '../store/capsuleStore';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('[Capsule ErrorBoundary] Caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900/20 text-red-500 h-full overflow-auto">
          <h1 className="font-bold mb-2">Something went wrong</h1>
          <pre className="text-[10px] bg-black/50 p-2 rounded">
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-3 py-1 bg-red-500 text-white rounded text-sm"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const { getToken, isLoaded, isSignedIn } = auth;
  const [isFetcherReady, setIsFetcherReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    setApiTokenFetcher(async () => {
      try {
        return await getToken();
      } catch (e) {
        console.error('[Capsule] Failed to get token:', e);
        return null;
      }
    });

    setIsFetcherReady(true);
  }, [getToken, isLoaded]);

  if (!isLoaded || !isFetcherReady) {
    return (
      <div className="flex w-full h-full items-center justify-center p-8 text-neutral-400 bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Clerk...</span>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {isSignedIn ? (
        <>{children}</>
      ) : (
        <div className="flex w-full h-full p-4 flex-col justify-center items-center overflow-auto bg-[#0A0A0A]">
          <h2 className="text-white mb-6 font-bold">Sign in to Capsule</h2>
          <SignIn routing="hash" />
        </div>
      )}
    </ErrorBoundary>
  );
}
