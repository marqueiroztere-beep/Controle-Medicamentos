// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface Patient {
  id: number;
  user_id: number;
  name: string;
  relationship: string | null;
  birth_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientFormData {
  name: string;
  relationship: string;
  birth_date: string;
  notes: string;
}

// ─── Medication ───────────────────────────────────────────────────────────────

export type MedicationStatus = 'active' | 'paused' | 'completed';
export type FrequencyType    = 'interval' | 'daily_times' | 'specific_days';

export interface Medication {
  id: number;
  user_id: number;
  patient_id: number | null;
  name: string;
  dosage: number;
  unit: string;
  instructions: string | null;
  frequency_type: FrequencyType;
  interval_hours: number | null;
  daily_times: string[] | null;
  specific_days: { days: number[]; times: string[] } | null;
  start_time: string;
  start_date: string;
  end_date: string | null;
  status: MedicationStatus;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicationFormData {
  name: string;
  dosage: number | '';
  unit: string;
  instructions: string;
  frequency_type: FrequencyType;
  interval_hours: number | '';
  daily_times: string[];
  specific_days: { days: number[]; times: string[] };
  start_time: string;
  start_date: string;
  end_date: string;
  patient_id: number | null;
}

// ─── Agenda ───────────────────────────────────────────────────────────────────

export type DoseStatus = 'pending' | 'taken' | 'missed' | 'skipped' | 'postponed';

export interface AgendaMedication {
  id: number;
  name: string;
  dosage: number;
  unit: string;
  instructions: string | null;
  deleted: boolean;
}

export interface AgendaItem {
  id: number;
  medication_id: number;
  scheduled_at: string;
  status: DoseStatus;
  taken_at: string | null;
  postponed_to: string | null;
  note: string | null;
  medication: AgendaMedication;
}

// ─── History ──────────────────────────────────────────────────────────────────

export interface HistoryItem extends AgendaItem {
  // same shape, just not pending
}

export interface HistoryResponse {
  total: number;
  page: number;
  limit: number;
  items: HistoryItem[];
}

// ─── Adherence ────────────────────────────────────────────────────────────────

export interface AdherenceStats {
  total: number;
  taken: number;
  skipped: number;
  missed: number;
  postponed: number;
  rate: number;
}

export interface MedicationAdherence {
  medication: Medication & { deleted?: boolean };
  total: number;
  taken: number;
  skipped: number;
  missed: number;
  postponed: number;
  rate: number;
}

export interface AdherenceResponse {
  global: AdherenceStats;
  per_medication: MedicationAdherence[];
}

export interface DailyAdherence {
  day: string;
  taken: number;
  skipped: number;
  missed: number;
  total: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
  message?: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}
