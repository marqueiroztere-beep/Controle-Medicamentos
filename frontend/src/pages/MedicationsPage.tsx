import React, { useEffect, useState, useCallback } from 'react';
import { medicationsApi } from '../api/medicationsApi';
import { extractError } from '../api/client';
import { MedicationCard } from '../components/medications/MedicationCard';
import { MedicationForm } from '../components/medications/MedicationForm';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { usePatientStore } from '../store/patientStore';
import type { Medication, MedicationStatus, MedicationFormData } from '../types';

const STATUS_FILTERS: Array<{ value: MedicationStatus | 'all'; label: string }> = [
  { value: 'all',       label: 'Todos' },
  { value: 'active',    label: 'Ativos' },
  { value: 'paused',    label: 'Pausados' },
  { value: 'completed', label: 'Concluídos' },
];

export function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [filter, setFilter]           = useState<MedicationStatus | 'all'>('all');
  const [loading, setLoading]         = useState(true);
  const [addOpen, setAddOpen]         = useState(false);
  const [addLoading, setAddLoading]   = useState(false);
  const { showToast } = useToast();
  const { getApiParam, activeFilter } = usePatientStore();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await medicationsApi.list(false, getApiParam());
      setMedications(res.data.medications);
    } catch (err) {
      showToast(extractError(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, activeFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(data: Partial<MedicationFormData>) {
    setAddLoading(true);
    try {
      // Se tem filtro de paciente ativo, já pré-seleciona
      const payload = {
        ...data,
        patient_id: data.patient_id ?? (typeof activeFilter === 'number' ? activeFilter : null),
      };
      await medicationsApi.create(payload);
      showToast('Medicamento cadastrado!');
      setAddOpen(false);
      load();
    } catch (err) {
      showToast(extractError(err), 'error');
    } finally {
      setAddLoading(false);
    }
  }

  const filtered = filter === 'all' ? medications : medications.filter(m => m.status === filter);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-text-muted text-sm">{medications.length} medicamentos cadastrados</p>
        </div>
        <Button onClick={() => setAddOpen(true)} icon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        }>
          Novo medicamento
        </Button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={[
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150',
              filter === f.value
                ? 'bg-purple/15 text-purple border-purple/25'
                : 'bg-surface text-text-muted border-border hover:border-muted',
            ].join(' ')}
          >
            {f.label}
            {f.value !== 'all' && (
              <span className="ml-1.5 font-mono text-xs opacity-60">
                {medications.filter(m => m.status === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="💊"
          title={filter === 'all' ? 'Nenhum medicamento cadastrado' : `Nenhum medicamento ${filter === 'active' ? 'ativo' : filter === 'paused' ? 'pausado' : 'concluído'}`}
          description={filter === 'all' ? 'Adicione seus medicamentos para começar a controlar seus horários.' : undefined}
          action={filter === 'all' ? (
            <Button onClick={() => setAddOpen(true)}>Cadastrar medicamento</Button>
          ) : undefined}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(med => (
            <MedicationCard key={med.id} medication={med} onUpdated={load} />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Novo medicamento" size="lg">
        <MedicationForm
          onSubmit={handleAdd}
          onCancel={() => setAddOpen(false)}
          loading={addLoading}
        />
      </Modal>
    </div>
  );
}
