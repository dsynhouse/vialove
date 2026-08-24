import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const root = createRoot(document.getElementById('root')!);

const missingSupabaseEnv =
  !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

if (missingSupabaseEnv) {
  // Everything else (App, auth, data layer) imports the Supabase client, which
  // throws the moment it's loaded if these are missing — so we deliberately
  // avoid importing any of that here and show a plain, actionable screen
  // instead of a blank page.
  root.render(
    <StrictMode>
      <ConfigError />
    </StrictMode>,
  );
} else {
  import('./bootstrap.tsx').then(({ mount }) => mount(root));
}

function ConfigError() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: '#fdf3ee',
        fontFamily: '"Nunito", sans-serif',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 460 }}>
        <h1
          style={{
            fontFamily: '"More Sugar", "Fredoka", sans-serif',
            color: '#8a2438',
            fontSize: '2rem',
            fontWeight: 600,
            marginBottom: '0.9rem',
          }}
        >
          vialove isn&rsquo;t connected yet
        </h1>
        <p style={{ color: '#4b3b3b', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
          This deployment is missing its Supabase configuration —{' '}
          <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> aren&rsquo;t
          set.
        </p>
        <p style={{ color: '#4b3b3b', lineHeight: 1.6, margin: 0 }}>
          Add them as environment variables on this Vercel project (Settings → Environment
          Variables), then redeploy. See the project README for full setup steps.
        </p>
      </div>
    </div>
  );
}
