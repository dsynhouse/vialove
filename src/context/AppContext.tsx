import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadStore, saveStore, uid, type StoreShape } from '../lib/storage';
import type {
  Bond,
  BondType,
  CalendarEvent,
  CheckIn,
  EmpathyGuess,
  Goal,
  JournalEntry,
  Person,
  VaultEntry,
  WeeklyResponse,
} from '../lib/types';
import { bondMeta } from '../lib/bondMeta';

interface AppContextValue {
  store: StoreShape;
  activeBond: Bond | undefined;
  activePerson: Person | undefined;
  otherPerson: Person | undefined;
  createBond: (type: BondType, label: string, names: [string, string]) => string;
  setActiveBond: (bondId: string) => void;
  switchActivePerson: () => void;
  setActivePersonId: (personId: string) => void;
  addCheckIn: (data: Omit<CheckIn, 'id' | 'bondId' | 'createdAt'>) => void;
  addJournalEntry: (data: Omit<JournalEntry, 'id' | 'bondId' | 'createdAt'>) => void;
  addVaultEntry: (data: Omit<VaultEntry, 'id' | 'bondId' | 'createdAt'>) => void;
  addGoal: (data: Omit<Goal, 'id' | 'bondId' | 'createdAt' | 'cheers'>) => void;
  updateGoalProgress: (goalId: string, progress: number) => void;
  cheerGoal: (goalId: string, personId: string) => void;
  submitWeeklyResponse: (weekOf: string, personId: string, response: Omit<WeeklyResponse, 'submittedAt'>) => void;
  addEvent: (data: Omit<CalendarEvent, 'id' | 'bondId'>) => void;
  removeEvent: (eventId: string) => void;
  addEmpathyGuess: (data: Omit<EmpathyGuess, 'id' | 'bondId'>) => void;
  logMindfulSession: (personId: string, sessionId: string) => void;
  resetAll: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<StoreShape>(() => loadStore());

  useEffect(() => {
    saveStore(store);
  }, [store]);

  const activeBond = store.bonds.find((b) => b.id === store.activeBondId);
  const activePerson = activeBond?.people.find((p) => p.id === store.activePersonId);
  const otherPerson = activeBond?.people.find((p) => p.id !== store.activePersonId);

  const value = useMemo<AppContextValue>(
    () => ({
      store,
      activeBond,
      activePerson,
      otherPerson,
      createBond: (type, label, names) => {
        const id = uid();
        const theme = bondMeta(type).theme;
        const people: [Person, Person] = [
          { id: uid(), name: names[0] || bondMeta(type).roleLabels[0] },
          { id: uid(), name: names[1] || bondMeta(type).roleLabels[1] },
        ];
        const bond: Bond = {
          id,
          type,
          label: label || bondMeta(type).label,
          people,
          createdAt: new Date().toISOString(),
          theme,
        };
        setStore((s) => ({
          ...s,
          bonds: [...s.bonds, bond],
          activeBondId: id,
          activePersonId: people[0].id,
        }));
        return id;
      },
      setActiveBond: (bondId) => {
        setStore((s) => {
          const bond = s.bonds.find((b) => b.id === bondId);
          return { ...s, activeBondId: bondId, activePersonId: bond?.people[0].id ?? null };
        });
      },
      switchActivePerson: () => {
        setStore((s) => {
          const bond = s.bonds.find((b) => b.id === s.activeBondId);
          if (!bond) return s;
          const next = bond.people.find((p) => p.id !== s.activePersonId) ?? bond.people[0];
          return { ...s, activePersonId: next.id };
        });
      },
      setActivePersonId: (personId) => setStore((s) => ({ ...s, activePersonId: personId })),
      addCheckIn: (data) => {
        setStore((s) => ({
          ...s,
          checkIns: [
            ...s.checkIns,
            { ...data, id: uid(), bondId: s.activeBondId!, createdAt: new Date().toISOString() },
          ],
        }));
      },
      addJournalEntry: (data) => {
        setStore((s) => ({
          ...s,
          journalEntries: [
            ...s.journalEntries,
            { ...data, id: uid(), bondId: s.activeBondId!, createdAt: new Date().toISOString() },
          ],
        }));
      },
      addVaultEntry: (data) => {
        setStore((s) => ({
          ...s,
          vaultEntries: [
            ...s.vaultEntries,
            { ...data, id: uid(), bondId: s.activeBondId!, createdAt: new Date().toISOString() },
          ],
        }));
      },
      addGoal: (data) => {
        setStore((s) => ({
          ...s,
          goals: [
            ...s.goals,
            { ...data, id: uid(), bondId: s.activeBondId!, createdAt: new Date().toISOString(), cheers: [] },
          ],
        }));
      },
      updateGoalProgress: (goalId, progress) => {
        setStore((s) => ({
          ...s,
          goals: s.goals.map((g) => (g.id === goalId ? { ...g, progress } : g)),
        }));
      },
      cheerGoal: (goalId, personId) => {
        setStore((s) => ({
          ...s,
          goals: s.goals.map((g) =>
            g.id === goalId
              ? { ...g, cheers: g.cheers.includes(personId) ? g.cheers : [...g.cheers, personId] }
              : g,
          ),
        }));
      },
      submitWeeklyResponse: (weekOf, personId, response) => {
        setStore((s) => {
          const bondId = s.activeBondId!;
          const existing = s.weeklyPulses.find((w) => w.bondId === bondId && w.weekOf === weekOf);
          const fullResponse: WeeklyResponse = { ...response, submittedAt: new Date().toISOString() };
          if (existing) {
            return {
              ...s,
              weeklyPulses: s.weeklyPulses.map((w) =>
                w.id === existing.id
                  ? { ...w, responses: { ...w.responses, [personId]: fullResponse } }
                  : w,
              ),
            };
          }
          return {
            ...s,
            weeklyPulses: [
              ...s.weeklyPulses,
              { id: uid(), bondId, weekOf, responses: { [personId]: fullResponse } },
            ],
          };
        });
      },
      addEvent: (data) => {
        setStore((s) => ({
          ...s,
          events: [...s.events, { ...data, id: uid(), bondId: s.activeBondId! }],
        }));
      },
      removeEvent: (eventId) => {
        setStore((s) => ({ ...s, events: s.events.filter((e) => e.id !== eventId) }));
      },
      addEmpathyGuess: (data) => {
        setStore((s) => ({
          ...s,
          empathyGuesses: [...s.empathyGuesses, { ...data, id: uid(), bondId: s.activeBondId! }],
        }));
      },
      logMindfulSession: (personId, sessionId) => {
        setStore((s) => ({
          ...s,
          mindfulLogs: [
            ...s.mindfulLogs,
            { id: uid(), bondId: s.activeBondId!, personId, sessionId, completedAt: new Date().toISOString() },
          ],
        }));
      },
      resetAll: () => setStore(loadStoreFresh()),
    }),
    [store, activeBond, activePerson, otherPerson],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function loadStoreFresh(): StoreShape {
  localStorage.removeItem('vialove:v1');
  return loadStore();
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
