import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Card, Button } from '../../components/ui';
import { authApi, ApiError } from '../../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.message);
      setDevResetUrl(res.devResetUrl ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout subtitle="We'll send a link to reset your password.">
      <Card className="p-6 sm:p-8">
        {message ? (
          <div className="text-center">
            <p className="text-[15px] text-[var(--color-ink)]">{message}</p>
            {devResetUrl && (
              <div className="mt-5 rounded-xl bond-bg-soft p-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide bond-accent mb-1.5">
                  Dev mode — no SMTP configured
                </p>
                <p className="text-[13px] text-black/55 mb-2">
                  The email was logged to the server console instead of sent. Use this link directly:
                </p>
                <Link to={devResetUrl.replace(window.location.origin, '')} className="text-[13px] font-semibold bond-accent break-all">
                  {devResetUrl}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black/60 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? 'Sending…' : 'Send reset link'} <ArrowRight size={16} />
            </Button>
          </form>
        )}
      </Card>
      <p className="text-center text-sm text-black/45 mt-5">
        <Link to="/login" className="inline-flex items-center gap-1 font-semibold bond-accent">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
