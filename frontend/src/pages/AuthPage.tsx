import React, { useState } from 'react';
import { useAuth, extractError } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

export function AuthPage() {
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { login, register }     = useAuth();
  const { showToast }           = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) { showToast('Nome é obrigatório', 'error'); return; }
        await register(name, email, password);
      }
    } catch (err) {
      showToast(extractError(err), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[300px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #14b8a6 0%, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-[420px] animate-[slide-up_0.3s_ease-out]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal/10 border border-teal/20 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-teal">
              <path d="M12 2a5 5 0 0 1 5 5v1h1a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3h1V7a5 5 0 0 1 5-5z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 14v-3m0 0V8m0 3h3m-3 0H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="font-syne font-bold text-2xl text-text-primary mb-1">MedControl</h1>
          <p className="text-text-muted text-sm">Controle de medicamentos inteligente</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl">
          {/* Tab toggle */}
          <div className="flex bg-bg rounded-xl p-1 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={[
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  mode === m
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary',
                ].join(' ')}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <Input
                label="Nome completo"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Senha"
              type="password"
              placeholder={mode === 'login' ? 'Sua senha' : 'Mínimo 6 caracteres'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />

            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <p className="text-center text-sm text-text-muted mt-4">
            {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-purple hover:text-purple-light transition-colors font-medium"
            >
              {mode === 'login' ? 'Criar conta' : 'Entrar'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          Seus dados ficam salvos localmente e com segurança
        </p>
      </div>
    </div>
  );
}
