import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const StatsSkeleton = () => (
  <Card className="animate-pulse border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-[var(--text)]">
        <span className="h-5 w-5 rounded-full bg-[var(--border)]/60" />
        <span className="h-5 w-48 rounded bg-[var(--border)]/60" />
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="h-4 w-20 rounded bg-[var(--border)]/60" />
            <div className="h-6 w-24 rounded bg-[var(--border)]/40" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-4 w-40 rounded bg-[var(--border)]/50" />
        <div className="h-3 w-full rounded bg-[var(--border)]/40" />
      </div>
      <div className="grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[var(--border)]/50" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-[var(--border)]/50" />
              <div className="h-3 w-24 rounded bg-[var(--border)]/40" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-4 w-full rounded bg-[var(--border)]/40" />
        ))}
      </div>
    </CardContent>
  </Card>
);
