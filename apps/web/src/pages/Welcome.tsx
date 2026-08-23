import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Heart, Sprout, Users, Users2, Sparkles, ArrowRight, ArrowLeft, Copy, Check, LogOut } from 'lucide-react';
import { BOND_TYPES } from '../lib/bondMeta';
import type { BondType } from '../lib/types';
import { bondsApi } from '../lib/api';
import { useBond } from '../context/BondContext';
import { useAuth } from '../context/AuthContext';
import { Button, Card } from '../components/ui';
import { LogoMark, Wordmark } from '../components/Logo';

const ICONS: Record<string, typeof Heart> = { Heart, Sprout, Users, Users2, Sparkles };

type Step = 'choose' | 'create-pick' | 'create-details' | 'created' | 'join';

export default function Welcome() {
  const [step, setStep] = useState<Step>('choose');
  const [type, setType] = useState<BondType | null>(null);
  const [label, setLabel] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { bonds, setActiveBondId, refetchBonds } = useBond();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const meta = type ? BOND_TYPES.find((b) => b.type === type)! : null;

  const createMutation = useMutation({
    mutationFn: () => bondsApi.create(type!, label),
    onSuccess: (bond) => {
      refetchBonds();
      setActiveBondId(bond.id);
      setStep('created');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Something went wrong'),
  });

  const joinMutation = useMutation({
    mutationFn: () => bondsApi.join(inviteCode),
    onSuccess: (bond) => {
      refetchBonds();
      setActiveBondId(bond.id);
      navigate('/dashboard');
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Something went wrong'),
  });

  const createdBond = createMutation.data;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 paper-texture"
      style={{ background: 'linear-gradient(180deg, #fbf6ef 0%, #f6ecdd 100%)' }}
    >
      <div className="w-full max-w-xl">
        <div className="text-center mb-8 relative">
          <LogoMark size={44} className="mx-auto mb-3 animate-float-slow" />
          {step === 'choose' ? (
            <h1 className="font-display text-4xl text-[var(--color-ink)] leading-tight">Hi {user?.name}</h1>
          ) : (
            <Wordmark size={36} className="justify-center" />
          )}
          <p className="text-black/50 mt-2 text-[15px]">
            {step === 'choose' && 'Start a new bond, or join one you were invited to.'}
            {step === 'create-pick' && 'Pick the bond you want to nurture.'}
            {step === 'create-details' && 'A few details, then you can invite them in.'}
            {step === 'created' && 'Your bond is ready.'}
            {step === 'join' && 'Enter the code they shared with you.'}
          </p>
          <button
            onClick={() => logout()}
            className="absolute right-0 top-0 flex items-center gap-1 text-xs text-black/35 hover:text-black/60"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'choose' && (
            <motion.div key="choose" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              {bonds.length > 0 && (
                <div className="mb-4 space-y-2">
                  {bonds.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setActiveBondId(b.id);
                        navigate('/dashboard');
                      }}
                      className="w-full text-left"
                    >
                      <Card className="p-4 flex items-center justify-between hover:shadow-[var(--shadow-lift)] transition-shadow">
                        <div>
                          <p className="font-display text-lg text-[var(--color-ink)]">{b.label}</p>
                          <p className="text-[13px] text-black/45">{b.members.length} of 2 joined</p>
                        </div>
                        <ArrowRight size={16} className="text-black/30" />
                      </Card>
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => setStep('create-pick')} className="text-left">
                  <Card className="p-5 h-full hover:shadow-[var(--shadow-lift)] transition-shadow">
                    <p className="font-display text-lg text-[var(--color-ink)]">Start a new bond</p>
                    <p className="text-[13px] text-black/45 mt-1">Pick a relationship and invite them in.</p>
                  </Card>
                </button>
                <button onClick={() => { setError(null); setStep('join'); }} className="text-left">
                  <Card className="p-5 h-full hover:shadow-[var(--shadow-lift)] transition-shadow">
                    <p className="font-display text-lg text-[var(--color-ink)]">Join with a code</p>
                    <p className="text-[13px] text-black/45 mt-1">Someone invited you? Enter their code.</p>
                  </Card>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'create-pick' && (
            <motion.div key="pick" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <button onClick={() => setStep('choose')} className="flex items-center gap-1 text-sm text-black/40 hover:text-black/60 mb-4">
                <ArrowLeft size={14} /> Back
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BOND_TYPES.map((b) => {
                  const Icon = ICONS[b.icon];
                  return (
                    <motion.button
                      key={b.type}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setType(b.type);
                        setLabel(b.label);
                        setStep('create-details');
                      }}
                      className="text-left rounded-2xl border border-black/5 bg-white/90 p-5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-shadow"
                    >
                      <span className="inline-flex w-10 h-10 rounded-xl items-center justify-center mb-3 text-white" style={{ backgroundColor: b.theme.accent }}>
                        <Icon size={19} />
                      </span>
                      <p className="font-display text-lg text-[var(--color-ink)]">{b.label}</p>
                      <p className="text-[13px] text-black/45 mt-1">{b.tagline}</p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 'create-details' && meta && (
            <motion.div key="details" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <Card className="p-6 sm:p-8">
                <button onClick={() => setStep('create-pick')} className="flex items-center gap-1 text-sm text-black/40 hover:text-black/60 mb-5">
                  <ArrowLeft size={14} /> Change bond type
                </button>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-1.5" style={{ color: meta.theme.accent }}>
                  {meta.label}
                </p>
                <h2 className="font-display text-2xl text-[var(--color-ink)] mb-5">Name this bond</h2>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={meta.label}
                  className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-[15px] mb-6 focus:outline-none focus:ring-2"
                  style={{ ['--tw-ring-color' as string]: meta.theme.accent }}
                />
                {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
                <Button
                  onClick={() => {
                    setError(null);
                    createMutation.mutate();
                  }}
                  disabled={createMutation.isPending}
                  className="w-full justify-center"
                  style={{ backgroundColor: meta.theme.accent }}
                >
                  {createMutation.isPending ? 'Creating…' : 'Create this bond'} <ArrowRight size={16} />
                </Button>
              </Card>
            </motion.div>
          )}

          {step === 'created' && createdBond && (
            <motion.div key="created" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <Card className="p-6 sm:p-8 text-center">
                <p className="font-display text-xl text-[var(--color-ink)] mb-2">Share this code with them</p>
                <p className="text-sm text-black/45 mb-5">They'll enter it to join {createdBond.label}.</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdBond.inviteCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="mx-auto flex items-center gap-3 rounded-2xl bond-bg-soft px-6 py-4 mb-6"
                >
                  <span className="font-display text-3xl tracking-[0.15em] bond-accent">{createdBond.inviteCode}</span>
                  {copied ? <Check size={18} className="bond-accent" /> : <Copy size={18} className="bond-accent" />}
                </button>
                <Button onClick={() => navigate('/dashboard')} className="w-full justify-center">
                  Continue to dashboard <ArrowRight size={16} />
                </Button>
              </Card>
            </motion.div>
          )}

          {step === 'join' && (
            <motion.div key="join" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <Card className="p-6 sm:p-8">
                <button onClick={() => setStep('choose')} className="flex items-center gap-1 text-sm text-black/40 hover:text-black/60 mb-5">
                  <ArrowLeft size={14} /> Back
                </button>
                <label className="block text-sm font-medium text-black/60 mb-1.5">Invite code</label>
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 037HYRWA"
                  className="w-full rounded-xl border border-black/10 px-4 py-3 text-[18px] tracking-[0.15em] text-center font-display mb-6 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
                <Button
                  onClick={() => {
                    setError(null);
                    joinMutation.mutate();
                  }}
                  disabled={!inviteCode.trim() || joinMutation.isPending}
                  className="w-full justify-center"
                >
                  {joinMutation.isPending ? 'Joining…' : 'Join bond'} <ArrowRight size={16} />
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
