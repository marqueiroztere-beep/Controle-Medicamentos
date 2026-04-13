import React, { useEffect, useState, useCallback } from 'react';
import { dosesApi } from '../api/dosesApi';
import { medicationsApi } from '../api/medicationsApi';
import { DoseStatusBadge } from '../components/medications/StatusBadge';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatDateTime, formatTime, todayISO } from '../utils/dateUtils';
import type { HistoryItem, Medication } from '../types';

const STATUS_OPTIONS = [
  { value: '',          label: 'Todos' },
  { value: 'taken',     label: 'Tomados' },
  { value: 'skipped',   label: 'Pulados' },
  { value: 'missed',    label: 'Perdidos' },
  { value: 'postponed', label: 'Adiados' },
];

export function HistoryPage() {
  const [items, setItems]           = useState<HistoryItem[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);

  // Filters
  const [medId, setMedId]     = useState('');
  const [status, setStatus]   = useState('');
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState(todayISO());

  const limit = 20;

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await dosesApi.getHistory({
        medication_id: medId ? parseInt(medId) : undefined,
        status: status || undefined,
        from: from || undefined,
        to:   to   || undefined,
        page: p,
        limit,
      });
      setItems(res.data.items);
      setTotal(res.data.total);
      setPage(p);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [medId, status, from, to]);

  useEffect(() => {
    medicationsApi.list(true).then(res => setMedications(res.data.medications));
  }, []);

  useEffect(() => { load(1); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Filters */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-5">
        <p className="text-text-muted text-xs font-mono mb-3">FILTROS</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <select value={medId} onChange={e => setMedId(e.target.value)}
            className="bg-bg border border-border rounded-lg px-3 py-2 text-text-secondary text-sm focus:outline-none focus:border-purple">
            <option value="">Todos os remédios</option>
            {medications.map(m => (
              <option key={m.id} value={m.id}>{m.name} {m.deleted_at ? '(removido)' : ''}</option>
            ))}
          </select>

          <select value={status} onChange={e => setStatus(e.target.value)}
            className="bg-bg border border-border rounded-lg px-3 py-2 text-text-secondary text-sm focus:outline-none focus:border-purple">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="bg-bg border border-border rounded-lg px-3 py-2 text-text-secondary text-sm focus:outline-none focus:border-purple font-mono"
            placeholder="De" />

          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="bg-bg border border-border rounded-lg px-3 py-2 text-text-secondary text-sm focus:outline-none focus:border-purple font-mono"
            placeholder="Até" />
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-text-muted text-xs font-mono">{total} registros encontrados</p>
          <Button size="sm" variant="ghost" onClick={() => { setMedId(''); setStatus(''); setFrom(''); setTo(todayISO()); }}>
            Limpar filtros
          </Button>
        </div>
      </div>

      {/* Results */}
      {loading ? <PageLoader /> : items.length === 0 ? (
        <EmptyState icon="📋" title="Nenhum registro encontrado" description="Ajuste os filtros ou aguarde registros de doses." />
      ) : (
        <>
          <div className="flex flex-col gap-2 mb-4">
            {items.map(item => (
              <HistoryRow key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => load(page - 1)}>
                Anterior
              </Button>
              <span className="text-text-muted text-sm font-mono px-2">{page} / {totalPages}</span>
              <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => load(page + 1)}>
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function HistoryRow({ item }: { item: HistoryItem }) {
  return (
    <div className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-3 hover:border-muted transition-colors animate-[slide-up_0.2s_ease-out]">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-syne font-semibold text-text-primary text-sm">{item.medication.name}</span>
          {item.medication.deleted && (
            <span className="text-xs text-text-muted bg-surface2 px-1.5 py-0.5 rounded font-mono">removido</span>
          )}
          <DoseStatusBadge status={item.status} />
        </div>
        <p className="text-text-muted text-xs font-mono mt-0.5">
          {item.medication.dosage} {item.medication.unit} · {formatDateTime(item.scheduled_at)}
        </p>
        {item.note && <p className="text-text-muted text-xs mt-0.5 italic">"{item.note}"</p>}
      </div>
      {item.taken_at && (
        <p className="text-success text-xs font-mono flex-shrink-0">{formatTime(item.taken_at)}</p>
      )}
    </div>
  );
}
