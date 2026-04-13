import React, { useEffect, useState } from 'react';
import { usePatientStore } from '../../store/patientStore';
import { patientsApi } from '../../api/patientsApi';
import { extractError } from '../../api/client';
import { PatientModal } from './PatientModal';
import type { Patient } from '../../types';

export function PatientBar() {
  const { patients, activeFilter, setPatients, setActiveFilter, getActiveLabel } = usePatientStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);

  async function load() {
    try {
      const res = await patientsApi.list();
      setPatients(res.data.patients);
    } catch {
      // silently ignore
    }
  }

  useEffect(() => { load(); }, []);

  function openEdit(p: Patient, e: React.MouseEvent) {
    e.stopPropagation();
    setEditPatient(p);
    setModalOpen(true);
  }

  function openAdd() {
    setEditPatient(null);
    setModalOpen(true);
  }

  async function handleDelete(p: Patient, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Remover "${p.name}"? Os medicamentos vinculados serão mantidos sem paciente.`)) return;
    try {
      await patientsApi.delete(p.id);
      if (activeFilter === p.id) setActiveFilter(null);
      load();
    } catch (err) {
      alert(extractError(err));
    }
  }

  const label = getActiveLabel();

  return (
    <>
      <div className="sticky top-[57px] z-20 bg-bg/90 backdrop-blur-sm border-b border-border px-4 lg:px-6 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-text-muted text-xs flex-shrink-0 mr-1">Paciente:</span>

        {/* Todos */}
        <button
          onClick={() => setActiveFilter(null)}
          className={[
            'flex-shrink-0 px-3 py-1 rounded-lg text-xs font-medium border transition-all',
            activeFilter === null
              ? 'bg-purple/15 text-purple border-purple/25'
              : 'bg-surface text-text-muted border-border hover:border-muted',
          ].join(' ')}
        >
          Todos
        </button>

        {/* Eu */}
        <button
          onClick={() => setActiveFilter('self')}
          className={[
            'flex-shrink-0 px-3 py-1 rounded-lg text-xs font-medium border transition-all',
            activeFilter === 'self'
              ? 'bg-teal/15 text-teal border-teal/25'
              : 'bg-surface text-text-muted border-border hover:border-muted',
          ].join(' ')}
        >
          Eu
        </button>

        {/* Pacientes cadastrados */}
        {patients.map(p => (
          <button
            key={p.id}
            onClick={() => setActiveFilter(p.id)}
            className={[
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all group',
              activeFilter === p.id
                ? 'bg-amber/15 text-amber border-amber/25'
                : 'bg-surface text-text-muted border-border hover:border-muted',
            ].join(' ')}
          >
            <span>{p.name}</span>
            {p.relationship && (
              <span className="opacity-60">· {p.relationship}</span>
            )}
            <span
              onClick={(e) => openEdit(p, e)}
              className="hidden group-hover:inline opacity-50 hover:opacity-100 ml-0.5"
              title="Editar"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </span>
            <span
              onClick={(e) => handleDelete(p, e)}
              className="hidden group-hover:inline opacity-50 hover:opacity-100 hover:text-danger"
              title="Remover"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </span>
          </button>
        ))}

        {/* Adicionar paciente */}
        <button
          onClick={openAdd}
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-text-muted border border-dashed border-border hover:border-teal hover:text-teal transition-all"
          title="Adicionar paciente"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          Novo
        </button>

        {/* Indicador ativo (mobile) */}
        {activeFilter !== null && (
          <span className="ml-auto flex-shrink-0 text-xs text-text-muted">
            Exibindo: <span className="text-text-primary font-medium">{label}</span>
          </span>
        )}
      </div>

      <PatientModal
        open={modalOpen}
        patient={editPatient}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
      />
    </>
  );
}
