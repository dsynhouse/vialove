import type { ReactNode } from 'react';
import { Wordmark } from '../../components/Logo';

export function AuthLayout({ children, subtitle }: { children: ReactNode; subtitle: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 paper-texture"
      style={{ background: 'linear-gradient(180deg, #fbf6ef 0%, #f6ecdd 100%)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Wordmark size={44} className="justify-center animate-float-slow" />
          <p className="text-black/50 mt-3 text-[15px]">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
