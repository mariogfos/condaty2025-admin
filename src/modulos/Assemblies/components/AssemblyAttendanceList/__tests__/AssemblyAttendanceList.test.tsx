import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AssemblyAttendanceList from '../AssemblyAttendanceList';

vi.mock('@/mk/contexts/AuthProvider', () => ({
  useAuth: () => ({
    showToast: vi.fn(),
  }),
}));

vi.mock('@/mk/hooks/useAxios', () => ({
  default: () => ({
    execute: vi.fn().mockResolvedValue({ data: { success: true, data: [] } }),
    loaded: true,
  }),
}));

vi.mock('@/mk/hooks/useScreenSize', () => ({
  useScreenSize: () => ({ isMobile: false }),
}));

vi.mock('@/mk/components/ui/Avatar/Avatar', () => ({
  Avatar: ({ name }: any) => <div data-testid="avatar">{name}</div>,
}));

vi.mock('@/components/layout/icons/IconsBiblioteca', () => ({
  IconTrash: () => <span data-testid="icon-trash">Trash</span>,
}));

describe('AssemblyAttendanceList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    assemblyId: '1',
    refreshKey: 0,
    onAttendanceChange: vi.fn(),
    readOnly: false,
  };

  it('muestra mensaje de carga inicialmente', () => {
    render(<AssemblyAttendanceList {...defaultProps} />);
    expect(screen.getByText('Cargando asistentes...')).toBeInTheDocument();
  });

  it('renderiza lista vacía cuando no hay asistentes', async () => {
    render(<AssemblyAttendanceList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No hay asistentes registrados aún.')).toBeInTheDocument();
    });
  });

  it('muestra totales en el resumen', async () => {
    render(<AssemblyAttendanceList {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Asistentes:/)).toBeInTheDocument();
    });
  });
});