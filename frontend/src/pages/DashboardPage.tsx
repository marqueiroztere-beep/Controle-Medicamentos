import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { agendaApi } from '../api/agendaApi';
import { adherenceApi } from '../api/adherenceApi';
import { DoseCard } from '../components/agenda/DoseCard';
import { Card } from '../components/ui/Card';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDateFull, todayISO } from '../utils/dateUtils';
import type { AgendaItem, AdherenceStats } from '../types';

export function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems]       = useState<AgendaItem[]>([]);
  const [stats, setStats]       = useState<AdherenceStats | null>(null);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    try {
      const [agendaRes, adherenceRes] = await Promise.all([
        agendaApi.getToday(),
        adherenceApi.getGlobal({ from: todayISO(), to: todayISO() }),
      ]);
      setItems(agendaRes.data.items);
      setStats(adherenceRes.data.global);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 60s
  useEffect(() => {
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) return <PageLoader />;

  const overdue  = items.filter(i => i.status === 'pending' && new Date(i.scheduled_at) < new Date());
  const upcoming = items.filter(i => i.status === 'pending' && new Date(i.scheduled_at) >= new Date());
  const done     = items.filter(i => i.status !== 'pending');

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-syne font-bold text-2xl text-text-primary mb-1">
          Olá, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-text-muted text-sm capitalize">{formatDateFull(new Date().toISOString())}</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatChip label="Pendentes" value={overdue.length + upcoming.length} color="text-text-secondary" bg="bg-surface" />
        <StatChip label="Tomados" value={stats?.taken || 0} color="text-success" bg="bg-success/5" />
        <StatChip label="Atrasados" value={overdue.length} color="text-danger" bg="bg-danger/5" />
      </div>

      {/* Adherence today */}
      {stats && stats.total > 0 && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text-secondary">Aderência hoje</span>
            <span className="font-mono text-lg font-semibold text-text-primary">{stats.rate}%</span>
          </div>
          <div className="h-2 bg-surface2 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.rate}%`, background: stats.rate >= 80 ? '#4ade80' : stats.rate >= 50 ? '#f59e0b' : '#f87171' }} />
          </div>
          <p className="text-xs text-text-muted mt-1 font-mono">{stats.taken} de {stats.total} doses</p>
        </Card>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <section className="mb-6">
          <SectionHeader label="Atrasados" count={overdue.length} color="text-danger" />
          <div className="flex flex-col gap-3">
            {overdue.map(item => <DoseCard key={item.id} item={item} onUpdated={load} />)}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="mb-6">
          <SectionHeader label="Próximas doses" count={upcoming.length} color="text-teal" />
          <div className="flex flex-col gap-3">
            {upcoming.map(item => <DoseCard key={item.id} item={item} onUpdated={load} />)}
          </div>
        </section>
      )}

      {/* Done */}
      {done.length > 0 && (
        <section className="mb-6">
          <SectionHeader label="Registradas hoje" count={done.length} color="text-text-muted" />
          <div className="flex flex-col gap-3">
            {done.map(item => <DoseCard key={item.id} item={item} onUpdated={load} compact />)}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <EmptyState
          icon="💊"
          title="Nenhuma dose hoje"
          description="Cadastre seus medicamentos para ver sua agenda diária aqui."
        />
      )}
    </div>
  );
}

function StatChip({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`${bg} border border-border rounded-xl p-3 text-center`}>
      <p className={`font-mono font-bold text-2xl ${color}`}>{value}</p>
      <p className="text-text-muted text-xs mt-0.5">{label}</p>
    </div>
  );
}

function SectionHeader({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`font-syne font-semibold text-sm ${color}`}>{label}</span>
      <span className="font-mono text-xs text-text-muted bg-surface2 px-1.5 py-0.5 rounded">{count}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
