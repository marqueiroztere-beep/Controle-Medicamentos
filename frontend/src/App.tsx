import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './components/ui/Toast';
import { AppShell } from './components/layout/AppShell';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { MedicationsPage } from './pages/MedicationsPage';
import { AgendaPage } from './pages/AgendaPage';
import { HistoryPage } from './pages/HistoryPage';
import { AdherencePage } from './pages/AdherencePage';
import { AccountPage } from './pages/AccountPage';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/"            element={<DashboardPage />} />
        <Route path="/medications" element={<MedicationsPage />} />
        <Route path="/agenda"      element={<AgendaPage />} />
        <Route path="/history"     element={<HistoryPage />} />
        <Route path="/adherence"   element={<AdherencePage />} />
        <Route path="/account"     element={<AccountPage />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
