import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EDGE_TYPE_OPTIONS } from '@/types/pieces.js';

export const EdgeTypeSelect = ({
  value,
  onChange,
  options = EDGE_TYPE_OPTIONS,
  disabled = false,
  className,
}) => {
  const fallback = options[0] ?? 'General';
  const current = value && options.includes(value) ? value : fallback;

  return (
    <Select disabled={disabled} value={current} onValueChange={(next) => onChange?.(next)}>
      <SelectTrigger className={className ?? 'w-32'}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
