import { useTheme } from '@/theme/ThemeProvider.jsx';

export const ThemeToggle = () => {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className="inline-flex items-center justify-center h-9 px-3 rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-sm transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
    >
      <span className="text-lg" aria-hidden="true">{theme === 'dark' ? '🌙' : '☀️'}</span>
    </button>
  );
};

