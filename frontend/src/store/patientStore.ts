import { create } from 'zustand';
import type { Patient } from '../types';

// null = "Todos", 'self' = conta principal, number = id do paciente
export type PatientFilter = null | 'self' | number;

interface PatientStore {
  patients: Patient[];
  activeFilter: PatientFilter;
  setPatients: (patients: Patient[]) => void;
  setActiveFilter: (filter: PatientFilter) => void;
  getActiveLabel: () => string;
  getApiParam: () => string | undefined;
}

export const usePatientStore = create<PatientStore>((set, get) => ({
  patients: [],
  activeFilter: null,

  setPatients(patients) {
    set({ patients });
  },

  setActiveFilter(filter) {
    set({ activeFilter: filter });
  },

  getActiveLabel() {
    const { activeFilter, patients } = get();
    if (activeFilter === null)    return 'Todos';
    if (activeFilter === 'self')  return 'Eu (conta principal)';
    const pat = patients.find(p => p.id === activeFilter);
    return pat?.name || 'Paciente';
  },

  getApiParam() {
    const { activeFilter } = get();
    if (activeFilter === null)   return undefined;
    if (activeFilter === 'self') return 'self';
    return String(activeFilter);
  },
}));
