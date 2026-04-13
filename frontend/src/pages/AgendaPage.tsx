import React, { useEffect, useState, useCallback } from 'react';
import { agendaApi } from '../api/agendaApi';
import { DoseCard } from '../components/agenda/DoseCard';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { todayISO, formatDateFull } from '../utils/dateUtils';
import type { AgendaItem } from '../types';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [items, setItems]   = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await agendaApi.getByDate(selectedDate);
      setItems(res.data.items);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [selectedDate]);

  useEffect(() => { load(); }, [load]);

  function navigate(delta: number) {
    const d = delta > 0
      ? addDays(parseISO(`${selectedDate}T00:00:00`), delta)
      : subDays(parseISO(`${selectedDate}T00:00:00`), Math.abs(delta));
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  }

  const isToday = selectedDate === todayISO();

  const overdue  = items.filter(i => i.status === 'pending' && new Date(i.scheduled_at) < new Date());
  const upcoming = items.filter(i => i.status === 'pending' && new Date(i.scheduled_at) >= new Date());
  const done     = items.filter(i => i.status !== 'pending');

  return (
    <div className="max-w-3xl mx-auto">
      {/* Date navigator */}
      <div className="flex items-center justify-between mb-6 bg-surface border border-border rounded-2xl p-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface2 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        <div className="text-center flex-1">
          <p className="font-syne font-semibold text-text-primary text-sm capitalize">
            {formatDateFull(parseISO(`${selectedDate}T12:00:00`).toISOString())}
          </p>
          {isToday && <p className="text-teal text-xs font-mono mt-0.5">Hoje</p>}
        </div>

        <div className="flex items-center gap-1">
          {!isToday && (
            <button onClick={() => setSelectedDate(todayISO())}
              className="px-2 py-1 rounded-lg text-xs text-purple border border-purple/20 hover:bg-purple/10 transition-colors font-mono mr-1">
              Hoje
            </button>
          )}
          <button onClick={() => navigate(1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface2 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Date input */}
      <div className="mb-4">
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-purple font-mono" />
      </div>

      {loading ? <PageLoader /> : (
        <div>
          {items.length === 0 && (
            <EmptyState icon="📅" title="Sem doses neste dia" description="Nenhum medicamento agendado para esta data." />
          )}

          {overdue.length > 0 && (
            <TimelineSection label="Atrasadas" count={overdue.length} color="text-danger">
              {overdue.map(item => <DoseCard key={item.id} item={item} onUpdated={load} />)}
            </TimelineSection>
          )}

          {upcoming.length > 0 && (
            <TimelineSection label="Próximas" count={upcoming.length} color="text-teal">
              {upcoming.map(item => <DoseCard key={item.id} item={item} onUpdated={load} />)}
            </TimelineSection>
          )}

          {done.length > 0 && (
            <TimelineSection label="Registradas" count={done.length} color="text-text-muted">
              {done.map(item => <DoseCard key={item.id} item={item} onUpdated={load} compact />)}
            </TimelineSection>
          )}
        </div>
      )}
    </div>
  );
}

function TimelineSection({ label, count, color, children }: {
  label: string; count: number; color: string; children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className={`font-syne font-semibold text-sm ${color}`}>{label}</span>
        <span className="font-mono text-xs text-text-muted bg-surface2 px-1.5 py-0.5 rounded">{count}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
