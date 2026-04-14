import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { usePatientStore } from '../store/patientStore';
import { authApi } from '../api/authApi';
import { extractError } from '../api/client';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { NotificationSetupGuide } from '../components/layout/NotificationSetupGuide';

export function AccountPage() {
  const { user, logout } = useAuth();
  const { isEnabled, enable } = useNotifications();
  const { showToast } = useToast();
  const setActiveFilter = usePatientStore(s => s.setActiveFilter);
  const setPatients = usePatientStore(s => s.setPatients);

  const [clearOpen, setClearOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  async function handleClearData() {
    setClearLoading(true);
    try {
      const { data } = await authApi.clearMyData();

      // Reset patient filter (patients were deleted)
      setPatients([]);
      setActiveFilter(null);

      // Clear localStorage flags so banners re-appear
      localStorage.removeItem('push-banner-dismissed');
      localStorage.removeItem('ios-install-prompt');

      // Re-register push subscription if permission is still granted
      if (isEnabled || (typeof Notification !== 'undefined' && Notification.permission === 'granted')) {
        await enable();
      }

      showToast(
        `Dados limpos: ${data.deleted.medications} medicamentos, ${data.deleted.agenda_items} itens da agenda, ${data.deleted.patients} pacientes removidos.`,
        'success'
      );
      setClearOpen(false);
    } catch (err) {
      showToast(extractError(err), 'error');
    } finally {
      setClearLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <h2 className="font-syne font-bold text-xl text-text-primary">Minha Conta</h2>

      {/* Profile info */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple/15 flex items-center justify-center flex-shrink-0">
            <span className="text-purple font-syne font-bold text-lg">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <p className="font-syne font-semibold text-text-primary">{user?.name}</p>
            <p className="text-sm text-text-muted">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* iOS notification setup guide — only on mobile */}
      {/iPhone|iPad|iPod/.test(navigator.userAgent) && (
        <NotificationSetupGuide mode="inline" />
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {/* Clear data */}
        <button
          onClick={() => setClearOpen(true)}
          className="flex items-center gap-3 bg-surface border border-border rounded-xl p-4 hover:border-danger/30 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-danger">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </div>
          <div>
            <p className="text-text-primary text-sm font-medium">Limpar todos os dados</p>
            <p className="text-text-muted text-xs">Remove medicamentos, agenda, pacientes e histórico. Sua conta continua ativa.</p>
          </div>
        </button>

        {/* Logout */}
        <button
          onClick={() => setLogoutOpen(true)}
          className="flex items-center gap-3 bg-surface border border-border rounded-xl p-4 hover:border-amber/30 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-amber/10 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-amber">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <div>
            <p className="text-text-primary text-sm font-medium">Sair da conta</p>
            <p className="text-text-muted text-xs">Você precisará fazer login novamente.</p>
          </div>
        </button>
      </div>

      {/* Clear data confirmation modal */}
      <Modal open={clearOpen} onClose={() => setClearOpen(false)} title="Limpar todos os dados?" size="sm">
        <div className="flex flex-col gap-4">
          <div className="bg-danger/5 border border-danger/20 rounded-xl p-3">
            <p className="text-sm text-text-primary font-medium mb-1">Isso vai remover:</p>
            <ul className="text-xs text-text-secondary space-y-1">
              <li>- Todos os medicamentos cadastrados</li>
              <li>- Toda a agenda de doses</li>
              <li>- Todo o histórico de doses tomadas/perdidas</li>
              <li>- Todos os pacientes</li>
              <li>- Inscrições de notificação</li>
            </ul>
            <p className="text-xs text-danger font-medium mt-2">Esta ação não pode ser desfeita.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setClearOpen(false)} fullWidth>Cancelar</Button>
            <Button variant="danger" onClick={handleClearData} loading={clearLoading} fullWidth>Sim, limpar tudo</Button>
          </div>
        </div>
      </Modal>

      {/* Logout confirmation modal */}
      <Modal open={logoutOpen} onClose={() => setLogoutOpen(false)} title="Sair da conta?" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">Você será redirecionado para a tela de login.</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setLogoutOpen(false)} fullWidth>Cancelar</Button>
            <Button variant="amber" onClick={logout} fullWidth>Sair</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
