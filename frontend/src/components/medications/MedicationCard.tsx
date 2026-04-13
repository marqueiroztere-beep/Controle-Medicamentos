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
import { usePatientStore } from '../../store/patientStore';
import type { Medication, MedicationFormData } from '../../types';

interface Props {
  medication: Medication;
  onUpdated: () => void;
}

export function MedicationCard({ medication, onUpdated }: Props) {
  const [editOpen, setEditOpen]     = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [infoOpen, setInfoOpen]     = useState(false);
  const [infoText, setInfoText]     = useState<string | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const { showToast } = useToast();
  const { patients } = usePatientStore();

  const patientName = medication.patient_id
    ? (patients.find(p => p.id === medication.patient_id)?.name || 'Paciente')
    : null;

  async function handleInfo() {
    setInfoOpen(true);
    if (infoText) return; // already loaded
    setInfoLoading(true);
    try {
      const { data } = await medicationsApi.getInfo(medication.name);
      setInfoText(data.summary);
    } catch (err) {
      setInfoText('Não foi possível obter informações. Verifique se a chave OpenAI está configurada.');
    } finally {
      setInfoLoading(false);
    }
  }

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
              {patientName && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber/10 text-amber border border-amber/20">
                  {patientName}
                </span>
              )}
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
              <button
                type="button"
                onClick={handleInfo}
                className="ml-auto flex items-center gap-1 text-purple/70 hover:text-purple transition-colors"
                title="Ver informações sobre este medicamento"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Informações
              </button>
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

      <Modal open={infoOpen} onClose={() => setInfoOpen(false)} title={`Informações: ${medication.name}`} size="md">
        {infoLoading ? (
          <div className="flex items-center justify-center py-8 gap-3 text-text-muted">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            Consultando informações...
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl border border-purple/20 bg-purple/5 p-4">
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{infoText}</p>
            </div>
            <p className="text-xs text-text-muted italic text-center">
              Informação orientativa — consulte sempre um profissional de saúde.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
