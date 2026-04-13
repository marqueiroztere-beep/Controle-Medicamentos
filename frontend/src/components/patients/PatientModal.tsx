import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, TextArea } from '../ui/Input';
import { patientsApi } from '../../api/patientsApi';
import { extractError } from '../../api/client';
import type { Patient } from '../../types';

interface Props {
  open: boolean;
  patient: Patient | null;
  onClose: () => void;
  onSaved: () => void;
}

const RELATIONSHIPS = ['Filho(a)', 'Cônjuge', 'Pai/Mãe', 'Avô/Avó', 'Irmão(ã)', 'Outro'];

export function PatientModal({ open, patient, onClose, onSaved }: Props) {
  const [form, setForm] = useState({ name: '', relationship: '', birth_date: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({
        name:         patient?.name || '',
        relationship: patient?.relationship || '',
        birth_date:   patient?.birth_date || '',
        notes:        patient?.notes || '',
      });
      setError('');
    }
  }, [open, patient]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (patient) {
        await patientsApi.update(patient.id, form);
      } else {
        await patientsApi.create(form);
      }
      onSaved();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={patient ? 'Editar paciente' : 'Novo paciente'} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nome *"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="Ex: Maria"
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">Relação</label>
          <div className="flex flex-wrap gap-1.5">
            {RELATIONSHIPS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setForm(f => ({ ...f, relationship: f.relationship === r ? '' : r }))}
                className={[
                  'px-2.5 py-1 rounded-lg text-xs border transition-colors',
                  form.relationship === r
                    ? 'bg-amber/15 text-amber border-amber/25'
                    : 'bg-surface border-border text-text-muted hover:border-muted',
                ].join(' ')}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Data de nascimento"
          type="date"
          value={form.birth_date}
          onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))}
        />

        <TextArea
          label="Observações"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Alergias, condições especiais..."
          rows={2}
        />

        {error && <p className="text-danger text-xs">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} fullWidth>Cancelar</Button>
          <Button type="submit" loading={loading} fullWidth>
            {patient ? 'Salvar' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
