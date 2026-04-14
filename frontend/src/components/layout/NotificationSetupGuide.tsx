import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

const STEPS = [
  {
    title: 'Permitir alertas e sons',
    path: 'Ajustes > Notificações > MedControl',
    detail: 'Ative Permitir Notificações, Alertas, Sons e Selos.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
  {
    title: 'Exceção no Modo Foco',
    path: 'Ajustes > Foco > Não Perturbe > Apps',
    detail: 'Adicione MedControl como exceção para receber lembretes mesmo no modo silencioso.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
      </svg>
    ),
  },
  {
    title: 'Atualização em 2.o plano',
    path: 'Ajustes > Geral > Atualizar App em 2.o Plano',
    detail: 'Mantenha ativado para que o MedControl receba dados mesmo quando fechado.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M21 12a9 9 0 1 1-6.22-8.56"/><polyline points="21 3 21 9 15 9"/>
      </svg>
    ),
  },
];

interface Props {
  /** Show as inline card (Account page) or as modal (after enabling push) */
  mode: 'inline' | 'modal';
  open?: boolean;
  onClose?: () => void;
}

export function NotificationSetupGuide({ mode, open, onClose }: Props) {
  const [checked, setChecked] = useState<boolean[]>([false, false, false]);

  function toggle(idx: number) {
    setChecked(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  }

  function handleOpenSettings() {
    // On iOS, app-settings: opens the Settings app
    window.location.href = 'app-settings:';
  }

  const content = (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-secondary">
        Para garantir que os lembretes cheguem mesmo com a tela desligada, configure estas 3 opcoes no iPhone:
      </p>

      {STEPS.map((step, i) => (
        <button
          key={i}
          onClick={() => toggle(i)}
          className={[
            'flex items-start gap-3 rounded-xl p-3 text-left transition-all border',
            checked[i]
              ? 'bg-success/5 border-success/25'
              : 'bg-surface border-border hover:border-purple/30',
          ].join(' ')}
        >
          {/* Checkbox */}
          <div className={[
            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
            checked[i] ? 'bg-success text-white' : 'bg-surface2 text-text-muted',
          ].join(' ')}>
            {checked[i] ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="m5 13 4 4L19 7"/></svg>
            ) : (
              <span className="text-xs font-bold">{i + 1}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={checked[i] ? 'text-success' : 'text-text-muted'}>{step.icon}</span>
              <p className={[
                'text-sm font-semibold',
                checked[i] ? 'text-success line-through' : 'text-text-primary',
              ].join(' ')}>{step.title}</p>
            </div>
            <p className="text-xs text-purple font-mono mb-0.5">{step.path}</p>
            <p className="text-xs text-text-muted">{step.detail}</p>
          </div>
        </button>
      ))}

      <Button variant="secondary" onClick={handleOpenSettings} fullWidth size="sm" icon={
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      }>
        Abrir Ajustes do iPhone
      </Button>

      {checked.every(Boolean) && (
        <div className="bg-success/10 border border-success/25 rounded-xl p-3 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-success flex-shrink-0"><path d="m5 13 4 4L19 7"/></svg>
          <p className="text-sm text-success font-medium">Tudo pronto! Os lembretes vao chegar mesmo com a tela desligada.</p>
        </div>
      )}
    </div>
  );

  if (mode === 'modal') {
    return (
      <Modal open={!!open} onClose={onClose || (() => {})} title="Configurar lembretes no iPhone" size="md">
        {content}
        <div className="mt-4">
          <Button variant="primary" onClick={onClose} fullWidth>Entendi</Button>
        </div>
      </Modal>
    );
  }

  // Inline mode
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <h3 className="font-syne font-semibold text-text-primary text-sm mb-3 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-purple">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>
        </svg>
        Configurar lembretes no iPhone
      </h3>
      {content}
    </div>
  );
}
