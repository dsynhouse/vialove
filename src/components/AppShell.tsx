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
  Repeat,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useState } from 'react';
import clsx from 'clsx';

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
  const { activeBond, activePerson, otherPerson, switchActivePerson, store, setActiveBond } = useApp();
  const navigate = useNavigate();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  if (!activeBond) return <>{children}</>;

  const themeStyle: CSSProperties = {
    ['--accent' as string]: activeBond.theme.accent,
    ['--accent-soft' as string]: activeBond.theme.accentSoft,
    ['--accent-strong' as string]: activeBond.theme.accentStrong,
  };

  return (
    <div style={themeStyle} className="min-h-screen flex flex-col sm:flex-row bg-[var(--color-cream-50)]">
      <aside className="hidden sm:flex sm:flex-col w-60 shrink-0 border-r border-black/5 bg-white/60 backdrop-blur-sm px-4 py-6">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 px-2 mb-8">
          <span className="w-8 h-8 rounded-xl bond-bg-accent flex items-center justify-center text-white font-display text-sm">
            v
          </span>
          <span className="font-display text-xl text-[var(--color-ink)]">vialove</span>
        </button>

        <BondSwitcher
          open={switcherOpen}
          setOpen={setSwitcherOpen}
          bonds={store.bonds}
          activeBondId={activeBond.id}
          onSelect={(id) => setActiveBond(id)}
          onNew={() => navigate('/onboarding')}
        />

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

        <PersonSwitcher activePerson={activePerson} otherPerson={otherPerson} onSwitch={switchActivePerson} />
      </aside>

      <header className="sm:hidden flex items-center justify-between px-4 py-3 border-b border-black/5 bg-white/70 backdrop-blur-sm sticky top-0 z-20">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bond-bg-accent flex items-center justify-center text-white font-display text-xs">
            v
          </span>
          <span className="font-display text-lg text-[var(--color-ink)]">vialove</span>
        </button>
        <PersonSwitcher compact activePerson={activePerson} otherPerson={otherPerson} onSwitch={switchActivePerson} />
      </header>

      <main className="flex-1 min-w-0 pb-20 sm:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">{children}</div>
      </main>

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

function PersonSwitcher({
  activePerson,
  otherPerson,
  onSwitch,
  compact,
}: {
  activePerson?: { id: string; name: string };
  otherPerson?: { id: string; name: string };
  onSwitch: () => void;
  compact?: boolean;
}) {
  if (!activePerson) return null;
  return (
    <button
      onClick={onSwitch}
      title={`Viewing as ${activePerson.name}. Tap to switch to ${otherPerson?.name}.`}
      className={clsx(
        'flex items-center gap-2 rounded-xl bond-bg-soft transition-colors hover:brightness-95',
        compact ? 'px-2.5 py-1.5' : 'px-3 py-2.5 mt-4',
      )}
    >
      <span className="w-6 h-6 rounded-full bond-bg-accent text-white text-[11px] font-semibold flex items-center justify-center">
        {activePerson.name.slice(0, 1).toUpperCase()}
      </span>
      {!compact && (
        <span className="flex-1 text-left">
          <span className="block text-sm font-semibold text-[var(--color-ink)] leading-none">
            {activePerson.name}
          </span>
          <span className="block text-[11px] text-black/45 mt-0.5">viewing this bond</span>
        </span>
      )}
      <Repeat size={14} className="bond-accent" />
    </button>
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
              className={clsx(
                'block w-full text-left px-3 py-2 text-sm hover:bg-black/[0.03]',
                b.id === activeBondId && 'font-semibold',
              )}
            >
              {b.label}
            </button>
          ))}
          <button
            onClick={onNew}
            className="block w-full text-left px-3 py-2 text-sm bond-accent font-semibold border-t border-black/5"
          >
            + New bond
          </button>
        </div>
      )}
    </div>
  );
}
