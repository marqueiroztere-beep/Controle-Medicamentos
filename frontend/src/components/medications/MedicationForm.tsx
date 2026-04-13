import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input, Select, TextArea } from '../ui/Input';
import { UNIT_OPTIONS, DAYS_OF_WEEK } from '../../utils/formatters';
import { todayISO } from '../../utils/dateUtils';
import type { Medication, MedicationFormData } from '../../types';
import { medicationsApi } from '../../api/medicationsApi';
import { extractError } from '../../api/client';

interface MedicationFormProps {
  initial?: Partial<Medication>;
  onSubmit: (data: Partial<MedicationFormData>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function MedicationForm({ initial, onSubmit, onCancel, loading }: MedicationFormProps) {
  const [infoSummary, setInfoSummary] = useState<string | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  async function fetchMedInfo() {
    if (!form.name.trim()) return;
    setInfoLoading(true);
    setInfoSummary(null);
    setInfoError(null);
    try {
      const { data } = await medicationsApi.getInfo(form.name.trim());
      setInfoSummary(data.summary);
    } catch (err) {
      setInfoError(extractError(err));
    } finally {
      setInfoLoading(false);
    }
  }

  const [form, setForm] = useState<MedicationFormData>({
    name:           initial?.name || '',
    dosage:         initial?.dosage || '',
    unit:           initial?.unit || 'mg',
    instructions:   initial?.instructions || '',
    frequency_type: initial?.frequency_type || 'interval',
    interval_hours: initial?.interval_hours || '',
    daily_times:    initial?.daily_times || ['08:00'],
    specific_days:  initial?.specific_days || { days: [1, 2, 3, 4, 5], times: ['08:00'] },
    start_time:     initial?.start_time || '08:00',
    start_date:     initial?.start_date || todayISO(),
    end_date:       initial?.end_date || '',
  });

  function set(key: keyof MedicationFormData, value: unknown) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function addDailyTime() {
    set('daily_times', [...(form.daily_times as string[]), '08:00']);
  }

  function updateDailyTime(i: number, val: string) {
    const arr = [...(form.daily_times as string[])];
    arr[i] = val;
    set('daily_times', arr);
  }

  function removeDailyTime(i: number) {
    const arr = (form.daily_times as string[]).filter((_, idx) => idx !== i);
    set('daily_times', arr);
  }

  function toggleDay(day: number) {
    const sd = form.specific_days as { days: number[]; times: string[] };
    const days = sd.days.includes(day) ? sd.days.filter(d => d !== day) : [...sd.days, day];
    set('specific_days', { ...sd, days });
  }

  function addSpecificTime() {
    const sd = form.specific_days as { days: number[]; times: string[] };
    set('specific_days', { ...sd, times: [...sd.times, '08:00'] });
  }

  function updateSpecificTime(i: number, val: string) {
    const sd = form.specific_days as { days: number[]; times: string[] };
    const times = [...sd.times];
    times[i] = val;
    set('specific_days', { ...sd, times });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Name + Dosage */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1.5">
          <Input label="Nome do medicamento" value={form.name} onChange={e => { set('name', e.target.value); setInfoSummary(null); setInfoError(null); }} required placeholder="Ex: Dipirona" />
          <button
            type="button"
            onClick={fetchMedInfo}
            disabled={!form.name.trim() || infoLoading}
            className="self-start text-xs text-purple hover:text-purple-light disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          >
            {infoLoading ? (
              <>
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                Consultando...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                O que é este remédio?
              </>
            )}
          </button>

          {(infoSummary || infoError) && (
            <div className={['rounded-xl border p-3 text-xs leading-relaxed relative', infoError ? 'border-danger/30 bg-danger/5 text-danger' : 'border-purple/20 bg-purple/5 text-text-secondary'].join(' ')}>
              <button
                type="button"
                onClick={() => { setInfoSummary(null); setInfoError(null); }}
                className="absolute top-2 right-2 text-text-muted hover:text-text-primary"
                aria-label="Fechar"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              {infoError ? (
                <p>{infoError}</p>
              ) : (
                <>
                  <p className="font-medium text-purple mb-1.5">Informações sobre {form.name}</p>
                  <p className="whitespace-pre-wrap">{infoSummary}</p>
                  <p className="mt-2 text-text-muted italic">Esta informação é apenas orientativa. Consulte sempre um profissional de saúde.</p>
                </>
              )}
            </div>
          )}
        </div>
        <Input label="Dosagem" type="number" step="0.001" min="0" value={form.dosage as string} onChange={e => set('dosage', parseFloat(e.target.value) || '')} required placeholder="Ex: 500" />
        <Select label="Unidade" value={form.unit} onChange={e => set('unit', e.target.value)}>
          {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
        </Select>
      </div>

      {/* Instructions */}
      <TextArea label="Instruções adicionais" value={form.instructions} onChange={e => set('instructions', e.target.value)} placeholder="Ex: Tomar com alimento, não tomar com leite..." rows={2} />

      {/* Frequency */}
      <Select label="Tipo de frequência" value={form.frequency_type} onChange={e => set('frequency_type', e.target.value as MedicationFormData['frequency_type'])}>
        <option value="interval">Intervalo em horas (ex: a cada 8h)</option>
        <option value="daily_times">Horários fixos diários</option>
        <option value="specific_days">Dias específicos da semana</option>
      </Select>

      {form.frequency_type === 'interval' && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="Intervalo (horas)" type="number" min="0.5" step="0.5" value={form.interval_hours as string} onChange={e => set('interval_hours', parseFloat(e.target.value) || '')} required placeholder="Ex: 8" />
          <Input label="Horário da 1ª dose" type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} required />
        </div>
      )}

      {form.frequency_type === 'daily_times' && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-secondary">Horários diários</label>
          {(form.daily_times as string[]).map((t, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input type="time" value={t} onChange={e => updateDailyTime(i, e.target.value)}
                className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-purple" />
              {(form.daily_times as string[]).length > 1 && (
                <button type="button" onClick={() => removeDailyTime(i)} className="text-text-muted hover:text-danger px-2">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addDailyTime} className="text-sm text-teal hover:text-teal-light text-left mt-1">+ Adicionar horário</button>
        </div>
      )}

      {form.frequency_type === 'specific_days' && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">Dias da semana</label>
            <div className="flex gap-1.5 flex-wrap">
              {DAYS_OF_WEEK.map(d => {
                const selected = (form.specific_days as { days: number[]; times: string[] }).days.includes(d.value);
                return (
                  <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                    className={['px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-colors', selected ? 'bg-purple/15 text-purple border-purple/25' : 'bg-surface border-border text-text-muted hover:border-muted'].join(' ')}>
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary">Horários</label>
            {(form.specific_days as { days: number[]; times: string[] }).times.map((t, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="time" value={t} onChange={e => updateSpecificTime(i, e.target.value)}
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-purple" />
                {(form.specific_days as { days: number[]; times: string[] }).times.length > 1 && (
                  <button type="button" onClick={() => {
                    const sd = form.specific_days as { days: number[]; times: string[] };
                    set('specific_days', { ...sd, times: sd.times.filter((_, idx) => idx !== i) });
                  }} className="text-text-muted hover:text-danger px-2">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addSpecificTime} className="text-sm text-teal hover:text-teal-light text-left mt-1">+ Adicionar horário</button>
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Data de início" type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} required />
        <Input label="Data de término" type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} hint="Deixe em branco para tratamento contínuo" />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} fullWidth>Cancelar</Button>
        <Button type="submit" loading={loading} fullWidth>
          {initial ? 'Salvar alterações' : 'Cadastrar medicamento'}
        </Button>
      </div>
    </form>
  );
}
