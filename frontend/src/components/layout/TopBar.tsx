import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useToast } from '../ui/Toast';

const PAGE_TITLES: Record<string, string> = {
  '/':           'Dashboard',
  '/medications': 'Medicamentos',
  '/agenda':     'Agenda',
  '/history':    'Histórico',
  '/adherence':  'Aderência',
  '/account':    'Minha Conta',
};

export function TopBar() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'MedControl';
  const { isSupported, isEnabled, permission, enable, disable } = useNotifications();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function toggleNotifications() {
    if (!isSupported) {
      showToast('Notificações push não são suportadas neste navegador', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isEnabled) {
        await disable();
        showToast('Notificações desativadas', 'info');
      } else {
        const ok = await enable();
        if (ok) {
          showToast('Notificações ativadas! Você receberá lembretes 10 minutos antes de cada dose.', 'success');
        } else if (permission === 'denied') {
          showToast('Permissão negada. Ative nas configurações do navegador.', 'error');
        }
      }
    } catch {
      showToast('Erro ao configurar notificações', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-sm border-b border-border px-4 lg:px-6 py-3 flex items-center justify-between">
      <h1 className="font-syne font-bold text-text-primary text-lg">{title}</h1>
      <div className="flex items-center gap-3">
        {/* Notification toggle */}
        <button
          onClick={isSupported ? toggleNotifications : () => {
            showToast(
              /iPhone|iPad/.test(navigator.userAgent)
                ? 'Para receber notificações no iPhone, adicione o site à tela de início: toque em Compartilhar (⬆) > "Adicionar à Tela de Início"'
                : 'Notificações push não são suportadas neste navegador. Use o Chrome para receber lembretes.',
              'info'
            );
          }}
          disabled={loading}
          title={isEnabled ? 'Desativar notificações' : 'Ativar notificações push'}
          className={[
            'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
            isEnabled
              ? 'text-teal bg-teal/10 hover:bg-teal/20'
              : !isSupported
                ? 'text-text-muted/50 hover:text-text-muted hover:bg-surface2'
                : 'text-text-muted hover:text-text-primary hover:bg-surface2',
            loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          ].join(' ')}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              {isEnabled && <circle cx="18" cy="6" r="3" fill="currentColor" stroke="none" className="text-teal" />}
              {!isSupported && <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" />}
            </svg>
          )}
        </button>

        {/* Online indicator */}
        <div className="w-2 h-2 rounded-full bg-teal animate-[pulse-dot_1.5s_ease-in-out_infinite]" title="Online" />
      </div>
    </header>
  );
}
