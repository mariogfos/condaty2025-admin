import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AssemblyDetail from '../AssemblyDetail';
import React from 'react';

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const mockAssemblyData = {
  id: "1",
  subject: "Asamblea Anual 2026",
  status: "S",
  modality: "V",
  date: "2026-04-10",
  time: "10:00",
  description: "Descripción de prueba",
  attendance_count: 5,
  surveys: [],
};

const mockStatsData = {
  quorum: {
    attendees: 5,
    total_units: 100,
    quorum_percentage: 5,
  },
};

// Mock directly with the implementation
vi.mock('../../../hooks/useAssemblies', () => ({
  useAssemblies: vi.fn(() => ({
    fetchAssemblyDetail: vi.fn(async () => ({
      id: "1",
      subject: "Asamblea Anual 2026",
      status: "S",
      modality: "V",
      date: "2026-04-10",
      time: "10:00",
      description: "Descripción de prueba",
      attendance_count: 5,
      surveys: [],
    })),
    fetchAssemblyStats: vi.fn(async () => ({
      quorum: {
        attendees: 5,
        total_units: 100,
        quorum_percentage: 5,
      },
    })),
    updateAssembly: vi.fn(async () => ({ success: true })),
    execute: vi.fn(async () => ({ success: true })),
    loading: false,
    error: null,
  })),
}));

vi.mock('@/mk/contexts/AuthProvider', () => ({
  useAuth: () => ({
    showToast: vi.fn(),
  }),
}));

vi.mock('@/mk/hooks/useInstantMsg', () => ({
  default: () => ({
    notifySegmented: vi.fn(),
    notifyAll: vi.fn(),
  }),
}));

vi.mock('@instantdb/react', () => ({
  id: vi.fn(),
}));

vi.mock('@/mk/hooks/useEvents', () => ({
  useEvent: vi.fn(),
}));

describe('AssemblyDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el asunto de la asamblea', async () => {
    render(<AssemblyDetail id="1" />);
    const subject = await screen.findByText('Asamblea Anual 2026');
    expect(subject).toBeInTheDocument();
  });

  it('muestra el estado correctamente', async () => {
    render(<AssemblyDetail id="1" />);
    const status = await screen.findByText('Programada');
    expect(status).toBeInTheDocument();
  });

  it('abre el modal de edición de descripción al hacer clic en editar', async () => {
    render(<AssemblyDetail id="1" />);
    await screen.findByText('Asamblea Anual 2026');
    const buttons = screen.getAllByRole('button');
    const editBtn = buttons.find(b => b.textContent?.includes('Editar'));
    if (!editBtn) throw new Error('Button not found');
    fireEvent.click(editBtn);
    expect(screen.getByText('Editar Orden del día')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay votaciones', async () => {
    render(<AssemblyDetail id="1" />);
    const msg = await screen.findByText('No hay votaciones registradas.');
    expect(msg).toBeInTheDocument();
  });
});
