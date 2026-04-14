import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

function isInStandaloneMode(): boolean {
  return ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone)
    || window.matchMedia('(display-mode: standalone)').matches;
}

export function PushPermissionBanner() {
  const { isAuthenticated } = useAuth();
  const { isSupported, isEnabled, permission, enable } = useNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'success' | 'denied' | null>(null);

  // Only show if: authenticated, PWA mode OR desktop, notifications supported, not already enabled
  const shouldShow = isAuthenticated
    && !isEnabled
    && !dismissed
    && permission !== 'denied'
    && result === null;

  // On iOS, only show in standalone (PWA) mode since push only works there
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const showBanner = shouldShow && (isIOS ? isInStandaloneMode() : isSupported);

  useEffect(() => {
    // Check if user previously dismissed
    const d = localStorage.getItem('push-banner-dismissed');
    if (d) setDismissed(true);
  }, []);

  if (!showBanner) return null;

  async function handleEnable() {
    setLoading(true);
    try {
      const ok = await enable();
      if (ok) {
        setResult('success');
        setTimeout(() => setDismissed(true), 3000);
      } else {
        setResult('denied');
      }
    } catch {
      setResult('denied');
    }
    setLoading(false);
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem('push-banner-dismissed', '1');
  }

  if (result === 'success') {
    return (
      <div className="mx-4 mt-3 bg-success/10 border border-success/25 rounded-xl p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-success"><path d="m5 13 4 4L19 7"/></svg>
        </div>
        <p className="text-sm text-text-primary font-medium">Notificações ativadas! Você será lembrado antes de cada dose.</p>
      </div>
    );
  }

  if (result === 'denied') {
    return (
      <div className="mx-4 mt-3 bg-amber/10 border border-amber/25 rounded-xl p-4">
        <p className="text-sm text-text-primary font-medium mb-1">Permissão negada</p>
        <p className="text-xs text-text-secondary">
          {isIOS
            ? 'Vá em Ajustes > Notificações > MedControl e ative as notificações.'
            : 'Clique no cadeado na barra de endereço do navegador e permita notificações.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-3 bg-purple/5 border border-purple/20 rounded-xl p-4 relative">
      {/* Dismiss X */}
      <button onClick={handleDismiss} className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text-primary">
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>

      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-purple/15 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-purple">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div>
          <p className="text-sm text-text-primary font-semibold">Ativar lembretes</p>
          <p className="text-xs text-text-secondary mt-0.5">
            Receba notificações no celular antes de cada dose, mesmo com o app fechado.
          </p>
        </div>
      </div>

      <Button onClick={handleEnable} loading={loading} fullWidth size="sm" icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      }>
        Ativar notificações
      </Button>
    </div>
  );
}
