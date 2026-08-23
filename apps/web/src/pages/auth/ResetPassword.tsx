import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Card, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  // Supabase's client detects the recovery token in the URL on load and fires
  // this event once it has established a temporary session for the reset.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    // In case the event already fired before this listener attached.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <AuthLayout subtitle="Set a new password">
        <Card className="p-6 sm:p-8 text-center">
          <p className="text-[15px] text-[var(--color-ink)]">
            Open this page from the link in your password-reset email — this link on its own isn't valid.
          </p>
          <Link to="/forgot-password" className="inline-block mt-4 text-sm font-semibold bond-accent">
            Request a new link
          </Link>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout subtitle="Set a new password">
      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black/60 mb-1.5">New password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <p className="text-[12px] text-black/35 mt-1">At least 8 characters.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-black/60 mb-1.5">Confirm password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full justify-center">
            {loading ? 'Saving…' : 'Reset password'} <ArrowRight size={16} />
          </Button>
        </form>
      </Card>
    </AuthLayout>
  );
}
