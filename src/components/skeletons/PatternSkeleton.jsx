import { Card, CardContent } from '@/components/ui/card';

export const PatternSkeleton = () => (
  <Card className="animate-pulse border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
    <CardContent className="space-y-6 p-6">
      <div className="h-6 w-56 rounded bg-[var(--border)]/60" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="h-4 w-16 rounded bg-[var(--border)]/60" />
            <div className="h-6 w-24 rounded bg-[var(--border)]/40" />
          </div>
        ))}
      </div>
      <div className="h-72 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--border)]/30" />
      <div className="h-24 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--border)]/30" />
    </CardContent>
  </Card>
);
