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
        'relative overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-lg shadow-black/5 transition hover:shadow-xl',
        className,
      )}
      style={{ boxShadow: 'var(--shadow)' }}
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
