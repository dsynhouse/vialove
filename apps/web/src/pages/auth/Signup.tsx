import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { Card, Button } from '../../components/ui';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { needsEmailConfirmation } = await signup(email, password, name);
      if (needsEmailConfirmation) {
        setCheckEmail(true);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <AuthLayout subtitle="Grow closer, together.">
        <Card className="p-6 sm:p-8 text-center">
          <p className="text-[15px] text-[var(--color-ink)]">
            Almost there — we sent a confirmation link to <strong>{email}</strong>. Click it to activate your
            account, then sign in.
          </p>
          <Link to="/login" className="inline-block mt-4 text-sm font-semibold bond-accent">
            Back to sign in
          </Link>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout subtitle="Grow closer, together. Create your account to begin.">
      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black/60 mb-1.5">Your name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
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
          <div>
            <label className="block text-sm font-medium text-black/60 mb-1.5">Password</label>
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full justify-center">
            {loading ? 'Creating account…' : 'Create account'} <ArrowRight size={16} />
          </Button>
        </form>
      </Card>
      <p className="text-center text-sm text-black/45 mt-5">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold bond-accent">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
