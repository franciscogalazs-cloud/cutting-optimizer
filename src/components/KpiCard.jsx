import { cn } from '@/lib/utils';

const intentBorder = {
  default: 'var(--primary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
};

export const KpiCard = ({ label, value, subtitle, intent = 'default', className }) => {
  const accent = intentBorder[intent] ?? intentBorder.default;
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-lg transition hover:shadow-xl',
        className,
      )}
      style={{ boxShadow: 'var(--shadow), 0 10px 15px -3px rgba(17,24,39,0.05), 0 4px 6px -4px rgba(17,24,39,0.05)' }}
    >
      <span
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}aa)` }}
      />
      <div className="space-y-2 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
        <p className="text-2xl font-semibold text-[var(--text)]">{value}</p>
        {subtitle ? (
          <p className="text-xs text-[var(--muted)]">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
};


