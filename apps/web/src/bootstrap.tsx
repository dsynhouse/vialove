import { StrictMode } from 'react';
import type { Root } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { BondProvider } from './context/BondContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { registerServiceWorker } from './lib/push.ts';

// Registering early (rather than only when the user opts in) means the
// service worker is already active by the time they enable notifications —
// this alone doesn't request permission or subscribe to anything.
registerServiceWorker();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10_000 },
  },
});

/** Deferred from main.tsx so this module (and its Supabase-dependent imports) is only
 *  ever loaded once the required env vars are confirmed present. */
export function mount(root: Root) {
  root.render(
    <StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AuthProvider>
              <BondProvider>
                <App />
              </BondProvider>
            </AuthProvider>
          </ToastProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>,
  );
}
