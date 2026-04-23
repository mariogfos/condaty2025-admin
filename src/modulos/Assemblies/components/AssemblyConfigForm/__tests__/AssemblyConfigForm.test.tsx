import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AssemblyConfigForm from '../AssemblyConfigForm';

const mockOnConfigChange = vi.fn();

vi.mock('@/mk/hooks/useAxios', () => ({
  default: () => ({
    execute: vi.fn(),
  }),
}));

describe('AssemblyConfigForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAssembly = {
    id: 1,
    subject: 'Asamblea Test',
    quorum_required: 50,
    anonymous_voting: false,
    count_abstention: true,
    target_audience: 'all_owners',
  };

  it('renderiza todos los campos', () => {
    render(
      <AssemblyConfigForm
        assembly={mockAssembly as any}
        onConfigChange={mockOnConfigChange}
      />
    );

    expect(screen.getByText('Configuración de votación')).toBeInTheDocument();
    expect(screen.getByText('Audiencia objetivo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar configuración/i })).toBeInTheDocument();
  });

  it('tiene checkbox para votación anónima', () => {
    render(
      <AssemblyConfigForm
        assembly={mockAssembly as any}
        onConfigChange={mockOnConfigChange}
      />
    );

    expect(screen.getByText(/Votación anónima/i)).toBeInTheDocument();
  });

  it('tiene checkbox para contar abstenciones', () => {
    render(
      <AssemblyConfigForm
        assembly={mockAssembly as any}
        onConfigChange={mockOnConfigChange}
      />
    );

    expect(screen.getByText(/Contar abstenciones/i)).toBeInTheDocument();
  });

  it('tiene selector de audiencia', () => {
    render(
      <AssemblyConfigForm
        assembly={mockAssembly as any}
        onConfigChange={mockOnConfigChange}
      />
    );

    expect(screen.getByText(/Notificar a/i)).toBeInTheDocument();
  });

  it('muestra hints informativos', () => {
    render(
      <AssemblyConfigForm
        assembly={mockAssembly as any}
        onConfigChange={mockOnConfigChange}
      />
    );

    expect(screen.getByText(/Porcentaje mínimo de asistencia/i)).toBeInTheDocument();
    expect(screen.getByText(/Los administradores no podrán identificar votos/i)).toBeInTheDocument();
  });
});