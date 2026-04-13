import React, { useEffect, useState } from 'react';
import { adherenceApi } from '../api/adherenceApi';
import { Card } from '../components/ui/Card';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import type { AdherenceResponse } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export function AdherencePage() {
  const [data, setData]     = useState<AdherenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30'>('7');

  useEffect(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - parseInt(period));

    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    adherenceApi.getGlobal({ from: fmt(from), to: fmt(to) })
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <PageLoader />;
  if (!data) return <EmptyState icon="📊" title="Sem dados" description="Registre doses para ver estatísticas de aderência." />;

  const { global, per_medication } = data;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Period filter */}
      <div className="flex gap-2 mb-6">
        {(['7', '30'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={['px-4 py-2 rounded-xl text-sm font-medium border transition-all', period === p ? 'bg-purple/15 text-purple border-purple/25' : 'bg-surface text-text-muted border-border hover:border-muted'].join(' ')}>
            Últimos {p} dias
          </button>
        ))}
      </div>

      {/* Global card */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-syne font-semibold text-text-primary">Aderência geral</h3>
            <p className="text-text-muted text-sm">Últimos {period} dias</p>
          </div>
          <div className="text-right">
            <p className={`font-mono font-bold text-3xl ${global.rate >= 80 ? 'text-success' : global.rate >= 50 ? 'text-amber' : 'text-danger'}`}>
              {global.rate}%
            </p>
            <p className="text-text-muted text-xs font-mono">{global.taken}/{global.total} doses</p>
          </div>
        </div>

        {/* Progress ring */}
        <div className="flex justify-center mb-4">
          <ProgressRing rate={global.rate} size={120} />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <StatCell label="Tomados"  value={global.taken}     color="text-success" />
          <StatCell label="Pulados"  value={global.skipped}   color="text-amber" />
          <StatCell label="Perdidos" value={global.missed}    color="text-danger" />
          <StatCell label="Adiados"  value={global.postponed} color="text-purple" />
        </div>
      </Card>

      {/* Per medication */}
      {per_medication.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-syne font-semibold text-text-primary">Por medicamento</h3>
          {per_medication.map(item => (
            <MedicationAdherenceCard key={item.medication.id} item={item} />
          ))}
        </div>
      )}

      {global.total === 0 && (
        <EmptyState icon="📊" title="Sem registros no período" description="Nenhuma dose foi registrada nos últimos dias." />
      )}
    </div>
  );
}

function ProgressRing({ rate, size = 80 }: { rate: number; size?: number }) {
  const radius = size * 0.4;
  const stroke = size * 0.07;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;
  const color = rate >= 80 ? '#4ade80' : rate >= 50 ? '#f59e0b' : '#f87171';

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#2a2d35" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="rotate-90"
        style={{ transform: `rotate(90deg) translateX(${size/2}px)`, transformOrigin: 'center', fill: color, fontFamily: 'DM Mono', fontWeight: 600, fontSize: size * 0.18 }}>
      </text>
    </svg>
  );
}

function MedicationAdherenceCard({ item }: { item: AdherenceResponse['per_medication'][0] }) {
  const color = item.rate >= 80 ? '#4ade80' : item.rate >= 50 ? '#f59e0b' : '#f87171';
  const textColor = item.rate >= 80 ? 'text-success' : item.rate >= 50 ? 'text-amber' : 'text-danger';

  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:border-muted transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-syne font-semibold text-text-primary">{item.medication.name}</span>
          {item.medication.deleted && <span className="text-xs text-text-muted font-mono bg-surface2 px-1.5 py-0.5 rounded">removido</span>}
        </div>
        <span className={`font-mono font-bold text-xl ${textColor}`}>{item.rate}%</span>
      </div>
      <div className="h-1.5 bg-surface2 rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.rate}%`, background: color }} />
      </div>
      <p className="text-text-muted text-xs font-mono">{item.taken}/{item.total} doses tomadas</p>
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-bg rounded-xl py-2 px-1">
      <p className={`font-mono font-bold text-xl ${color}`}>{value}</p>
      <p className="text-text-muted text-xs">{label}</p>
    </div>
  );
}
