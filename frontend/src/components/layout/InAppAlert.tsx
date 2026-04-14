import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { agendaApi } from '../../api/agendaApi';
import { Button } from '../ui/Button';
import { dosesApi } from '../../api/dosesApi';
import type { AgendaItem } from '../../types';

interface AlertDose {
  item: AgendaItem;
  minsUntil: number;
}

// Generate a notification sound using Web Audio API
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.4);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });

    // Clean up context after sounds finish
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // Audio not available, fail silently
  }
}

const POLL_INTERVAL = 30_000; // 30 seconds
const ALERT_WINDOW = 5; // Show alert for doses within 5 minutes

export function InAppAlert() {
  const { isAuthenticated } = useAuth();
  const [alertDoses, setAlertDoses] = useState<AlertDose[]>([]);
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const notifiedIds = useRef<Set<number>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const checkUpcoming = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const { data } = await agendaApi.getToday(undefined);
      const now = Date.now();
      const upcoming: AlertDose[] = [];

      for (const item of data.items) {
        if (item.status !== 'pending') continue;
        const scheduled = new Date(item.scheduled_at).getTime();
        const minsUntil = Math.round((scheduled - now) / 60000);

        // Alert for doses between -2 minutes (slightly overdue) and +ALERT_WINDOW minutes
        if (minsUntil >= -2 && minsUntil <= ALERT_WINDOW) {
          upcoming.push({ item, minsUntil });

          // Play sound only once per dose
          if (!notifiedIds.current.has(item.id)) {
            notifiedIds.current.add(item.id);
            playAlertSound();
          }
        }
      }

      setAlertDoses(upcoming);
    } catch {
      // Silent fail - don't disrupt user
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    checkUpcoming();
    intervalRef.current = setInterval(checkUpcoming, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, checkUpcoming]);

  async function handleTake(itemId: number) {
    setLoading(prev => ({ ...prev, [itemId]: true }));
    try {
      await dosesApi.take(itemId);
      setAlertDoses(prev => prev.filter(d => d.item.id !== itemId));
    } catch { /* silent */ }
    setLoading(prev => ({ ...prev, [itemId]: false }));
  }

  function handleDismiss(itemId: number) {
    setAlertDoses(prev => prev.filter(d => d.item.id !== itemId));
  }

  if (alertDoses.length === 0) return null;

  return createPortal(
    <div className="fixed top-16 left-0 right-0 z-[55] flex flex-col items-center gap-2 px-3 pointer-events-none">
      {alertDoses.map(({ item, minsUntil }) => (
        <div
          key={item.id}
          className="w-full max-w-md pointer-events-auto bg-surface border border-teal/30 rounded-2xl shadow-2xl shadow-teal/10 p-4 animate-[slide-up_0.3s_ease-out]"
        >
          <div className="flex items-start gap-3">
            {/* Pulsing icon */}
            <div className="w-10 h-10 rounded-full bg-teal/15 flex items-center justify-center flex-shrink-0 animate-[pulse-dot_1.5s_ease-in-out_infinite]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-teal">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-teal mb-0.5">
                {minsUntil <= 0 ? 'Agora!' : minsUntil === 1 ? 'Em 1 minuto' : `Em ${minsUntil} minutos`}
              </p>
              <p className="font-syne font-semibold text-text-primary text-sm">
                {item.medication.name}
              </p>
              <p className="text-text-secondary text-xs font-mono">
                {item.medication.dosage} {item.medication.unit}
                {item.patient_name && <span className="text-amber"> · {item.patient_name}</span>}
              </p>
            </div>

            {/* Dismiss */}
            <button onClick={() => handleDismiss(item.id)} className="text-text-muted hover:text-text-primary p-1 flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>

          {/* Quick action */}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="success"
              onClick={() => handleTake(item.id)}
              loading={loading[item.id]}
              fullWidth
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m5 13 4 4L19 7"/></svg>}
            >
              Tomei
            </Button>
          </div>
        </div>
      ))}
    </div>,
    document.body
  );
}
