import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

function isIOS(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

function isMobile(): boolean {
  return isIOS() || isAndroid();
}

function isInStandaloneMode(): boolean {
  return ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone)
    || window.matchMedia('(display-mode: standalone)').matches;
}

export function IOSInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show on any mobile device that hasn't installed the PWA yet
    if (!isMobile() || isInStandaloneMode()) return;

    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (dismissed) return;

    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem('install-prompt-dismissed', '1');
  }

  if (!show) return null;

  const ios = isIOS();

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      {/* Backdrop — NÃO fecha ao tocar, para dar tempo de ler */}
      <div className="absolute inset-0" aria-hidden />
      <div className="relative w-full max-w-md bg-surface rounded-t-2xl border-t border-border p-5 pb-8 animate-[slide-up_0.3s_ease-out] safe-area-bottom">
        {/* Close */}
        <button onClick={dismiss} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal to-purple flex items-center justify-center shadow-lg">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-syne font-bold text-text-primary text-lg text-center mb-2">
          Instale o MedControl
        </h3>
        <p className="text-text-secondary text-sm text-center mb-5">
          Adicione à tela inicial para abrir como um app e receber lembretes de medicamentos.
        </p>

        {/* Steps — different per platform */}
        <div className="flex flex-col gap-3 mb-5">
          {ios ? (
            <>
              <div className="flex items-center gap-3 bg-surface2 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-purple/15 text-purple flex items-center justify-center font-mono font-bold text-sm flex-shrink-0">1</div>
                <div className="flex-1">
                  <p className="text-text-primary text-sm font-medium">Toque no botão Compartilhar</p>
                  <p className="text-text-muted text-xs">O ícone <span className="inline-block align-middle">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  </span> na barra inferior do Safari</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-surface2 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-purple/15 text-purple flex items-center justify-center font-mono font-bold text-sm flex-shrink-0">2</div>
                <div className="flex-1">
                  <p className="text-text-primary text-sm font-medium">Adicionar à Tela de Início</p>
                  <p className="text-text-muted text-xs">Role para baixo e toque em "Adicionar à Tela de Início"</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 bg-surface2 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-purple/15 text-purple flex items-center justify-center font-mono font-bold text-sm flex-shrink-0">1</div>
                <div className="flex-1">
                  <p className="text-text-primary text-sm font-medium">Toque no menu do Chrome</p>
                  <p className="text-text-muted text-xs">Os 3 pontinhos <span className="font-mono font-bold">⋮</span> no canto superior direito</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-surface2 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-purple/15 text-purple flex items-center justify-center font-mono font-bold text-sm flex-shrink-0">2</div>
                <div className="flex-1">
                  <p className="text-text-primary text-sm font-medium">Adicionar à tela inicial</p>
                  <p className="text-text-muted text-xs">Toque em "Adicionar à tela inicial" ou "Instalar app"</p>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-3 bg-surface2 rounded-xl p-3">
            <div className="w-8 h-8 rounded-full bg-teal/15 text-teal flex items-center justify-center font-mono font-bold text-sm flex-shrink-0">3</div>
            <div className="flex-1">
              <p className="text-text-primary text-sm font-medium">Abra pelo ícone na tela inicial</p>
              <p className="text-text-muted text-xs">O MedControl vai abrir como um app, sem barra do navegador</p>
            </div>
          </div>
        </div>

        <Button onClick={dismiss} variant="primary" fullWidth>
          Entendi
        </Button>
      </div>
    </div>
  );
}
