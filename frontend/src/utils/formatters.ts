import type { DoseStatus, MedicationStatus } from '../types';

export function formatDosage(dosage: number, unit: string): string {
  return `${dosage} ${unit}`;
}

export const STATUS_LABELS: Record<MedicationStatus, string> = {
  active:    'Ativo',
  paused:    'Pausado',
  completed: 'Concluído',
};

export const STATUS_COLORS: Record<MedicationStatus, string> = {
  active:    'text-success bg-success/10 border-success/20',
  paused:    'text-amber bg-amber/10 border-amber/20',
  completed: 'text-text-muted bg-surface2 border-border',
};

export const DOSE_STATUS_LABELS: Record<DoseStatus, string> = {
  pending:   'Pendente',
  taken:     'Tomado',
  missed:    'Perdido',
  skipped:   'Pulado',
  postponed: 'Adiado',
};

export const DOSE_STATUS_COLORS: Record<DoseStatus, string> = {
  pending:   'text-text-secondary bg-surface border-border',
  taken:     'text-success bg-success/10 border-success/20',
  missed:    'text-danger bg-danger/10 border-danger/20',
  skipped:   'text-amber bg-amber/10 border-amber/20',
  postponed: 'text-purple bg-purple/10 border-purple/20',
};

export const UNIT_OPTIONS = [
  'mg', 'mcg', 'g', 'ml', 'L',
  'comprimido', 'cápsula', 'gota', 'gotas',
  'ampola', 'sachê', 'UI', '%'
];

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];
