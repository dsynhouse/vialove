import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { useBond } from './context/BondContext';
import { AppShell } from './components/AppShell';
import { LogoMark, Wordmark } from './components/Logo';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import CheckIn from './pages/CheckIn';
import Journal from './pages/Journal';
import Growth from './pages/Growth';
import PlanCalendar from './pages/PlanCalendar';
import Mindful from './pages/Mindful';
import WeeklyPulse from './pages/WeeklyPulse';
import Village from './pages/Village';
import Profile from './pages/Profile';

function SplashLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[var(--color-cream-50)]">
      <LogoMark size={48} className="animate-breathe" />
      <Wordmark size={22} />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <SplashLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireBond({ children }: { children: ReactNode }) {
  const { activeBond, isLoading } = useBond();
  if (isLoading) return <SplashLoader />;
  if (!activeBond) return <Navigate to="/welcome" replace />;
  return <AppShell>{children}</AppShell>;
}

function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** Auth + bond guard, wrapped in the shell and an animated page transition. Used for every feature route. */
function Protected({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <RequireBond>
        <PageTransition>{children}</PageTransition>
      </RequireBond>
    </RequireAuth>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const { bonds, isLoading: bondsLoading } = useBond();

  return (
    <Routes>
      <Route
        path="/"
        element={
          loading || (user && bondsLoading) ? (
            <SplashLoader />
          ) : !user ? (
            <Navigate to="/login" replace />
          ) : bonds.length === 0 ? (
            <Navigate to="/welcome" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/welcome" element={<RequireAuth><Welcome /></RequireAuth>} />

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
