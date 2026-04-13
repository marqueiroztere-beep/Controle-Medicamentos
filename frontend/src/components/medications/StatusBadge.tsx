import { Badge } from '../ui/Badge';
import { STATUS_LABELS, STATUS_COLORS, DOSE_STATUS_LABELS, DOSE_STATUS_COLORS } from '../../utils/formatters';
import type { MedicationStatus, DoseStatus } from '../../types';

export function MedicationStatusBadge({ status }: { status: MedicationStatus }) {
  return (
    <Badge className={STATUS_COLORS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function DoseStatusBadge({ status }: { status: DoseStatus }) {
  const dot = {
    pending:   'bg-text-muted',
    taken:     'bg-success',
    missed:    'bg-danger',
    skipped:   'bg-amber',
    postponed: 'bg-purple',
  }[status];

  return (
    <Badge className={DOSE_STATUS_COLORS[status]}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot}`} />
      {DOSE_STATUS_LABELS[status]}
    </Badge>
  );
}
