import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Card, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout subtitle="We'll send a link to reset your password.">
      <Card className="p-6 sm:p-8">
        {sent ? (
          <p className="text-[15px] text-[var(--color-ink)] text-center">
            If an account exists for <strong>{email}</strong>, a reset link is on its way.
          </p>
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
