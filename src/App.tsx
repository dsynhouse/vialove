import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { AppShell } from './components/AppShell';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';
import Journal from './pages/Journal';
import Growth from './pages/Growth';
import PlanCalendar from './pages/PlanCalendar';
import Mindful from './pages/Mindful';
import WeeklyPulse from './pages/WeeklyPulse';
import Village from './pages/Village';
import Profile from './pages/Profile';

function Protected({ children }: { children: ReactNode }) {
  const { activeBond } = useApp();
  if (!activeBond) return <Navigate to="/onboarding" replace />;
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  const { store } = useApp();

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={store.bonds.length ? '/dashboard' : '/onboarding'} replace />}
      />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/check-in" element={<Protected><CheckIn /></Protected>} />
      <Route path="/journal" element={<Protected><Journal /></Protected>} />
      <Route path="/growth" element={<Protected><Growth /></Protected>} />
      <Route path="/calendar" element={<Protected><PlanCalendar /></Protected>} />
      <Route path="/mindful" element={<Protected><Mindful /></Protected>} />
      <Route path="/pulse" element={<Protected><WeeklyPulse /></Protected>} />
      <Route path="/village" element={<Protected><Village /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
