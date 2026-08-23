import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bondsApi } from '../lib/api';
import type { Bond, Person } from '../lib/types';
import { useAuth } from './AuthContext';

const LAST_BOND_KEY = 'vialove:lastBondId';

interface BondContextValue {
  bonds: Bond[];
  isLoading: boolean;
  activeBond: Bond | undefined;
  activeBondId: string | undefined;
  setActiveBondId: (id: string) => void;
  activePerson: Person | undefined;
  otherPerson: Person | undefined;
  refetchBonds: () => void;
}

const BondContext = createContext<BondContextValue | null>(null);

export function BondProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferredBondId, setPreferredBondId] = useState<string | undefined>(
    () => localStorage.getItem(LAST_BOND_KEY) ?? undefined,
  );

  const { data: bonds = [], isLoading, refetch } = useQuery({
    queryKey: ['bonds'],
    queryFn: bondsApi.list,
    enabled: !!user,
  });

  // Derived, not stored: falls back to the first bond whenever the preferred
  // one hasn't loaded yet or no longer exists, without a setState-in-effect.
  const activeBond = bonds.find((b) => b.id === preferredBondId) ?? bonds[0];

  const setActiveBondId = (id: string) => {
    setPreferredBondId(id);
    localStorage.setItem(LAST_BOND_KEY, id);
  };

  const activePerson = activeBond?.members.find((m) => m.id === user?.id);
  const otherPerson = activeBond?.members.find((m) => m.id !== user?.id);

  const value = useMemo<BondContextValue>(
    () => ({
      bonds,
      isLoading,
      activeBond,
      activeBondId: activeBond?.id,
      setActiveBondId,
      activePerson,
      otherPerson,
      refetchBonds: refetch,
    }),
    [bonds, isLoading, activeBond, activePerson, otherPerson, refetch],
  );

  return <BondContext.Provider value={value}>{children}</BondContext.Provider>;
}

export function useBond() {
  const ctx = useContext(BondContext);
  if (!ctx) throw new Error('useBond must be used within BondProvider');
  return ctx;
}
