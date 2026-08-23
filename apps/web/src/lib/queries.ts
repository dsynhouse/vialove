import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  checkInsApi,
  eventsApi,
  goalsApi,
  journalApi,
  mindfulApi,
  supportApi,
  timelineApi,
  vaultApi,
  weeklyPulsesApi,
} from './api';
import type { JournalKind, VaultCategory, Visibility, WeeklyResponse } from './types';

// ---- Check-ins ----
export const useCheckIns = (bondId?: string) =>
  useQuery({ queryKey: ['checkins', bondId], queryFn: () => checkInsApi.list(bondId!), enabled: !!bondId });

export const useSaveCheckIn = (bondId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; mood: number; note: string; visibility: Visibility }) =>
      checkInsApi.save(bondId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['checkins', bondId] }),
  });
};

// ---- Journal ----
export const useJournal = (bondId?: string) =>
  useQuery({ queryKey: ['journal', bondId], queryFn: () => journalApi.list(bondId!), enabled: !!bondId });

export const useAddJournalEntry = (bondId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { kind: JournalKind; prompt: string; content: string; visibility: Visibility }) =>
      journalApi.create(bondId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal', bondId] }),
  });
};

// ---- Vault ----
export const useVault = (bondId?: string) =>
  useQuery({ queryKey: ['vault', bondId], queryFn: () => vaultApi.list(bondId!), enabled: !!bondId });

export const useAddVaultEntry = (bondId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { category: VaultCategory; content: string; visibility: Visibility }) =>
      vaultApi.create(bondId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vault', bondId] }),
  });
};

// ---- Goals ----
export const useGoals = (bondId?: string) =>
  useQuery({ queryKey: ['goals', bondId], queryFn: () => goalsApi.list(bondId!), enabled: !!bondId });

export const useAddGoal = (bondId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; ownerId: string | 'shared' }) => goalsApi.create(bondId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', bondId] }),
  });
};

export const useUpdateGoalProgress = (bondId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, progress }: { goalId: string; progress: number }) =>
      goalsApi.updateProgress(bondId!, goalId, progress),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', bondId] }),
  });
};

export const useCheerGoal = (bondId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) => goalsApi.cheer(bondId!, goalId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals', bondId] }),
  });
};

// ---- Weekly pulse ----
export const useWeeklyPulse = (bondId: string | undefined, weekOf: string) =>
  useQuery({
    queryKey: ['pulse', bondId, weekOf],
    queryFn: () => weeklyPulsesApi.getWeek(bondId!, weekOf),
    enabled: !!bondId,
  });

export const usePastPulses = (bondId: string | undefined, currentWeekOf: string) =>
  useQuery({
    queryKey: ['pulses', bondId, 'past', currentWeekOf],
    queryFn: () => weeklyPulsesApi.listPast(bondId!, currentWeekOf),
    enabled: !!bondId,
  });

export const useSubmitWeeklyResponse = (bondId: string | undefined, weekOf: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (response: Omit<WeeklyResponse, 'submittedAt'>) =>
      weeklyPulsesApi.submit(bondId!, weekOf, response),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pulse', bondId, weekOf] }),
  });
};

// ---- Events ----
export const useEvents = (bondId?: string) =>
  useQuery({ queryKey: ['events', bondId], queryFn: () => eventsApi.list(bondId!), enabled: !!bondId });

export const useAddEvent = (bondId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof eventsApi.create>[1]) => eventsApi.create(bondId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', bondId] }),
  });
};

export const useRemoveEvent = (bondId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => eventsApi.remove(bondId!, eventId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', bondId] }),
  });
};

// ---- Mindful ----
export const useMindfulLogs = (bondId?: string) =>
  useQuery({ queryKey: ['mindful', bondId], queryFn: () => mindfulApi.list(bondId!), enabled: !!bondId });

export const useLogMindfulSession = (bondId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => mindfulApi.log(bondId!, sessionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mindful', bondId] }),
  });
};

// ---- Support signals ----
export const useSendSupportSignal = (bondId?: string) =>
  useMutation({ mutationFn: () => supportApi.send(bondId!) });

// ---- Timeline / badges ----
export const useTimeline = (bondId?: string) =>
  useQuery({ queryKey: ['timeline', bondId], queryFn: () => timelineApi.get(bondId!), enabled: !!bondId });
