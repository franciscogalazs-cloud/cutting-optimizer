import { useTheme } from '@/theme/theme-context.js';
import { Sun, SunMedium } from 'lucide-react';

export const ThemeToggle = () => {
  const { contrast = 'normal', toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={contrast === 'outdoor' ? 'Cambiar a modo interior' : 'Cambiar a modo exterior'}
      className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-sm transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
    >
      {contrast === 'outdoor' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <SunMedium className="h-4 w-4" />
      )}
    </button>
  );
};

