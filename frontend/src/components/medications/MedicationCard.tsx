import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { MedicationStatusBadge } from './StatusBadge';
import { MedicationForm } from './MedicationForm';
import { medicationsApi } from '../../api/medicationsApi';
import { extractError } from '../../api/client';
import { useToast } from '../ui/Toast';
import { formatShortDate } from '../../utils/dateUtils';
import type { Medication, MedicationFormData } from '../../types';

interface Props {
  medication: Medication;
  onUpdated: () => void;
}

export function MedicationCard({ medication, onUpdated }: Props) {
  const [editOpen, setEditOpen]     = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const { showToast } = useToast();

  const freqLabel = {
    interval:      `A cada ${medication.interval_hours}h`,
    daily_times:   `${(medication.daily_times?.length || 1)}x ao dia`,
    specific_days: 'Dias específicos',
  }[medication.frequency_type] || '';

  async function handleEdit(data: Partial<MedicationFormData>) {
    setEditLoading(true);
    try {
      await medicationsApi.update(medication.id, data);
      showToast('Medicamento atualizado!');
      setEditOpen(false);
      onUpdated();
    } catch (err) {
      showToast(extractError(err), 'error');
    } finally {
      setEditLoading(false);
    }
  }

  async function handleStatus(status: string) {
    setMenuOpen(false);
    try {
      await medicationsApi.updateStatus(medication.id, status);
      showToast(status === 'active' ? 'Medicamento reativado' : status === 'paused' ? 'Medicamento pausado' : 'Tratamento concluído');
      onUpdated();
    } catch (err) {
      showToast(extractError(err), 'error');
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    if (!confirm(`Remover "${medication.name}"? O histórico de doses será mantido.`)) return;
    try {
      await medicationsApi.delete(medication.id);
      showToast('Medicamento removido');
      onUpdated();
    } catch (err) {
      showToast(extractError(err), 'error');
    }
  }

  const accentColor = medication.status === 'active' ? 'teal' : medication.status === 'paused' ? 'amber' : null;

  return (
    <>
      <Card accent={accentColor as 'teal' | 'amber' | null} className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-syne font-semibold text-text-primary truncate">{medication.name}</h3>
              <MedicationStatusBadge status={medication.status} />
            </div>
            <p className="text-text-secondary text-sm font-mono mb-2">
              {medication.dosage} {medication.unit} · {freqLabel}
            </p>
            {medication.instructions && (
              <p className="text-text-muted text-xs mb-2 italic">{medication.instructions}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-text-muted font-mono">
              <span>Início: {formatShortDate(medication.start_date)}</span>
              {medication.end_date && <span>Fim: {formatShortDate(medication.end_date)}</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface2 transition-colors flex items-center justify-center"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/>
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 bg-surface2 border border-border rounded-xl shadow-xl w-44 py-1 overflow-hidden">
                  <button onClick={() => { setMenuOpen(false); setEditOpen(true); }}
                    className="w-full px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface text-left transition-colors">
                    Editar
                  </button>
                  {medication.status !== 'active' && (
                    <button onClick={() => handleStatus('active')}
                      className="w-full px-3 py-2 text-sm text-success hover:bg-success/5 text-left transition-colors">
                      Reativar
                    </button>
                  )}
                  {medication.status === 'active' && (
                    <button onClick={() => handleStatus('paused')}
                      className="w-full px-3 py-2 text-sm text-amber hover:bg-amber/5 text-left transition-colors">
                      Pausar
                    </button>
                  )}
                  {medication.status !== 'completed' && (
                    <button onClick={() => handleStatus('completed')}
                      className="w-full px-3 py-2 text-sm text-text-muted hover:bg-surface text-left transition-colors">
                      Concluir tratamento
                    </button>
                  )}
                  <div className="border-t border-border my-1" />
                  <button onClick={handleDelete}
                    className="w-full px-3 py-2 text-sm text-danger hover:bg-danger/5 text-left transition-colors">
                    Remover
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar medicamento" size="lg">
        <MedicationForm
          initial={medication}
          onSubmit={handleEdit}
          onCancel={() => setEditOpen(false)}
          loading={editLoading}
        />
      </Modal>
    </>
  );
}
