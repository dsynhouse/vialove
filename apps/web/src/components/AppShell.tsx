import type { ReactNode, CSSProperties } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sun,
  BookHeart,
  Sprout,
  CalendarHeart,
  Wind,
  ClipboardCheck,
  HeartHandshake,
  UserCircle,
  ChevronDown,
  LogOut,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBond } from '../context/BondContext';
import { useRealtimeSync } from '../lib/realtimeSync';
import { useState } from 'react';
import clsx from 'clsx';
import { Wordmark } from './Logo';
import { ThinkingOfYouButton } from './ThinkingOfYou';

const NAV = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/check-in', label: 'Check-In', icon: Sun },
  { to: '/journal', label: 'Journal', icon: BookHeart },
  { to: '/growth', label: 'Growth', icon: Sprout },
  { to: '/calendar', label: 'Plan', icon: CalendarHeart },
  { to: '/mindful', label: 'Mindful', icon: Wind },
  { to: '/pulse', label: 'Weekly Pulse', icon: ClipboardCheck },
  { to: '/village', label: 'Village', icon: HeartHandshake },
  { to: '/profile', label: 'Profile', icon: UserCircle },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { activeBond, otherPerson, bonds, setActiveBondId } = useBond();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const { partnerOnline } = useRealtimeSync();

  if (!activeBond || !user) return <>{children}</>;

  const themeStyle: CSSProperties = {
    ['--accent' as string]: activeBond.theme.accent,
    ['--accent-soft' as string]: activeBond.theme.accentSoft,
    ['--accent-strong' as string]: activeBond.theme.accentStrong,
  };

  return (
    <div style={themeStyle} className="min-h-screen flex flex-col sm:flex-row bg-[var(--color-cream-50)]">
      <aside className="hidden sm:flex sm:flex-col w-60 shrink-0 border-r border-black/5 bg-white/60 backdrop-blur-sm px-4 py-6">
        <button onClick={() => navigate('/dashboard')} className="flex items-center px-2 mb-6">
          <Wordmark size={26} />
        </button>

        <BondSwitcher
          bonds={bonds}
          activeBondId={activeBond.id}
          onSelect={setActiveBondId}
          onNew={() => navigate('/welcome')}
          open={switcherOpen}
          setOpen={setSwitcherOpen}
        />

        {!otherPerson && <InviteBanner code={activeBond.inviteCode} />}

        <nav className="flex-1 flex flex-col gap-1 mt-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-colors',
                  isActive ? 'bond-bg-soft bond-accent' : 'text-black/55 hover:bg-black/[0.03]',
                )
              }
            >
              <item.icon size={18} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-2">
          <ThinkingOfYouButton />
        </div>

        <UserFooter name={user.name} otherName={otherPerson?.name} otherOnline={partnerOnline} onLogout={logout} />
      </aside>

      <header className="sm:hidden flex items-center justify-between px-4 py-3 border-b border-black/5 bg-white/70 backdrop-blur-sm sticky top-0 z-20">
        <button onClick={() => navigate('/dashboard')} className="flex items-center">
          <Wordmark size={22} />
        </button>
        <button
          onClick={() => logout()}
          className="w-8 h-8 rounded-full bond-bg-soft text-[11px] font-semibold bond-accent flex items-center justify-center"
          title="Sign out"
        >
          {user.name.slice(0, 1).toUpperCase()}
        </button>
      </header>

      <main className="flex-1 min-w-0 pb-20 sm:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
          {!otherPerson && (
            <div className="sm:hidden mb-5">
              <InviteBanner code={activeBond.inviteCode} compact />
            </div>
          )}
          {children}
        </div>
      </main>

      <ThinkingOfYouButton variant="compact" />

      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-20 bg-white/90 backdrop-blur-sm border-t border-black/5 flex overflow-x-auto no-scrollbar">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-0.5 py-2 px-3.5 shrink-0 text-[10px] font-medium',
                isActive ? 'bond-accent' : 'text-black/40',
              )
            }
          >
            <item.icon size={19} strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function InviteBanner({ code, compact }: { code: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={clsx(
        'w-full flex items-center justify-between gap-2 rounded-xl bond-bg-soft px-3 py-2.5 text-left',
        compact ? '' : 'mt-3',
      )}
    >
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold bond-accent uppercase tracking-wide">Waiting for your partner</span>
        <span className="block text-sm font-display tracking-[0.1em] text-[var(--color-ink)]">{code}</span>
      </span>
      {copied ? <Check size={15} className="bond-accent shrink-0" /> : <Copy size={15} className="bond-accent shrink-0" />}
    </button>
  );
}

function UserFooter({
  name,
  otherName,
  otherOnline,
  onLogout,
}: {
  name: string;
  otherName?: string;
  otherOnline: boolean;
  onLogout: () => void;
}) {
  return (
    <div className="mt-4 rounded-xl bond-bg-soft px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bond-bg-accent text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
          {name.slice(0, 1).toUpperCase()}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-[var(--color-ink)] leading-none truncate">{name}</span>
          <span className="flex items-center gap-1.5 text-[11px] text-black/45 mt-0.5 truncate">
            {otherName ? (
              <>
                <span
                  className={clsx('w-1.5 h-1.5 rounded-full shrink-0', otherOnline ? 'bg-green-500' : 'bg-black/20')}
                  title={otherOnline ? `${otherName} is online` : `${otherName} is offline`}
                />
                with {otherName}{otherOnline && ' · online now'}
              </>
            ) : (
              'invite pending'
            )}
          </span>
        </span>
        <button onClick={onLogout} title="Sign out" className="shrink-0 text-black/35 hover:text-black/60">
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}

function BondSwitcher({
  bonds,
  activeBondId,
  onSelect,
  onNew,
  open,
  setOpen,
}: {
  bonds: { id: string; label: string }[];
  activeBondId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const active = bonds.find((b) => b.id === activeBondId);
  if (bonds.length <= 1) {
    return (
      <div className="px-3 py-2 rounded-xl bg-black/[0.03] text-sm font-medium text-[var(--color-ink)] truncate">
        {active?.label}
      </div>
    );
  }
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-black/[0.03] text-sm font-medium text-[var(--color-ink)]"
      >
        <span className="truncate">{active?.label}</span>
        <ChevronDown size={15} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl bg-white shadow-[var(--shadow-lift)] border border-black/5 overflow-hidden">
          {bonds.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                onSelect(b.id);
                setOpen(false);
              }}
              className={clsx('block w-full text-left px-3 py-2 text-sm hover:bg-black/[0.03]', b.id === activeBondId && 'font-semibold')}
            >
              {b.label}
            </button>
          ))}
          <button onClick={onNew} className="block w-full text-left px-3 py-2 text-sm bond-accent font-semibold border-t border-black/5">
            + New bond
          </button>
        </div>
      )}
    </div>
  );
}
