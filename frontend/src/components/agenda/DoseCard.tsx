import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { DoseStatusBadge } from '../medications/StatusBadge';
import { Input } from '../ui/Input';
import { dosesApi } from '../../api/dosesApi';
import { extractError } from '../../api/client';
import { useToast } from '../ui/Toast';
import { formatTime, formatDate, timeLabel, isOverdue, addMinutesISO } from '../../utils/dateUtils';
import type { AgendaItem } from '../../types';

interface Props {
  item: AgendaItem;
  onUpdated: () => void;
  compact?: boolean;
}

export function DoseCard({ item, onUpdated, compact = false }: Props) {
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [noteOpen, setNoteOpen]         = useState(false);
  const [actionType, setActionType]     = useState<'take' | 'skip'>('take');
  const [note, setNote]                 = useState('');
  const [postponeTo, setPostponeTo]     = useState('');
  const [loading, setLoading]           = useState(false);
  const { showToast } = useToast();

  const overdue   = isOverdue(item.scheduled_at) && item.status === 'pending';
  const isPending = item.status === 'pending';
  const mins      = Math.round((new Date(item.scheduled_at).getTime() - Date.now()) / 60000);

  const accentColor = overdue ? 'danger' : isPending && mins <= 15 ? 'amber' : null;

  async function handleAction(type: 'take' | 'skip', withNote?: string) {
    setLoading(true);
    try {
      if (type === 'take') {
        await dosesApi.take(item.id, withNote);
        showToast('Dose registrada como tomada!', 'success');
      } else {
        await dosesApi.skip(item.id, withNote);
        showToast('Dose marcada como pulada', 'warning');
      }
      onUpdated();
    } catch (err) {
      showToast(extractError(err), 'error');
    } finally {
      setLoading(false);
      setNoteOpen(false);
    }
  }

  async function handlePostpone() {
    if (!postponeTo) return;
    setLoading(true);
    try {
      await dosesApi.postpone(item.id, postponeTo, note || undefined);
      showToast('Dose adiada', 'info');
      setPostponeOpen(false);
      onUpdated();
    } catch (err) {
      showToast(extractError(err), 'error');
    } finally {
      setLoading(false);
    }
  }

  function openNoteAction(type: 'take' | 'skip') {
    setActionType(type);
    setNote('');
    setNoteOpen(true);
  }

  function openPostpone() {
    setPostponeTo(addMinutesISO(item.scheduled_at, 30));
    setNote('');
    setPostponeOpen(true);
  }

  return (
    <>
      <Card accent={accentColor as 'danger' | 'amber' | null} className={compact ? 'p-3' : ''}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-lg font-medium text-text-primary">
                {formatTime(item.scheduled_at)}
              </span>
              <DoseStatusBadge status={item.status} />
              {overdue && <span className="text-xs text-danger font-mono">atrasado</span>}
              {isPending && !overdue && mins <= 15 && mins > 0 && (
                <span className="text-xs text-amber font-mono animate-[pulse-dot_1.5s_ease-in-out_infinite]">em breve</span>
              )}
            </div>
            <p className="font-syne font-semibold text-text-primary">
              {item.medication.name}
            </p>
            {item.patient_name && (
              <p className="text-xs text-amber font-medium">
                <span className="inline-flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {item.patient_name}
                </span>
              </p>
            )}
            <p className="text-text-secondary text-sm font-mono">
              {item.medication.dosage} {item.medication.unit}
            </p>
            {item.medication.instructions && !compact && (
              <p className="text-text-muted text-xs mt-1 italic">{item.medication.instructions}</p>
            )}
            {item.note && (
              <p className="text-text-muted text-xs mt-1">"{item.note}"</p>
            )}
            {item.taken_at && (
              <p className="text-success text-xs mt-1 font-mono">
                Tomado às {formatTime(item.taken_at)}
              </p>
            )}
          </div>

          {/* Status label (non-pending) */}
          {!isPending && !compact && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-text-muted font-mono">{formatDate(item.scheduled_at)}</p>
            </div>
          )}
        </div>

        {/* Actions for pending */}
        {isPending && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" variant="success" onClick={() => handleAction('take')} loading={loading} icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m5 13 4 4L19 7"/></svg>
            }>
              Tomei
            </Button>
            <Button size="sm" variant="ghost" onClick={openPostpone}>
              Adiar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => openNoteAction('skip')}>
              Pular
            </Button>
          </div>
        )}
      </Card>

      {/* Postpone modal */}
      <Modal open={postponeOpen} onClose={() => setPostponeOpen(false)} title="Adiar dose" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-text-secondary text-sm">
            {item.medication.name} · {item.medication.dosage} {item.medication.unit}
          </p>
          <div className="flex gap-2">
            {[15, 30, 60].map(m => (
              <button key={m} onClick={() => setPostponeTo(addMinutesISO(item.scheduled_at, m))}
                className="flex-1 py-2 rounded-lg border border-border text-sm text-text-secondary hover:border-purple hover:text-purple transition-colors font-mono">
                +{m}min
              </button>
            ))}
          </div>
          <Input label="Novo horário" type="datetime-local" value={postponeTo.slice(0, 16)} onChange={e => setPostponeTo(e.target.value + ':00')} />
          <Input label="Observação (opcional)" value={note} onChange={e => setNote(e.target.value)} placeholder="Motivo do adiamento..." />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPostponeOpen(false)} fullWidth>Cancelar</Button>
            <Button onClick={handlePostpone} loading={loading} fullWidth>Adiar</Button>
          </div>
        </div>
      </Modal>

      {/* Note modal (take or skip) */}
      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title={actionType === 'take' ? 'Registrar dose' : 'Pular dose'} size="sm">
        <div className="flex flex-col gap-4">
          <Input label="Observação (opcional)" value={note} onChange={e => setNote(e.target.value)} placeholder="Alguma observação?" autoFocus />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setNoteOpen(false)} fullWidth>Cancelar</Button>
            <Button variant={actionType === 'take' ? 'success' : 'amber'} onClick={() => handleAction(actionType, note || undefined)} loading={loading} fullWidth>
              {actionType === 'take' ? 'Confirmar' : 'Pular dose'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
