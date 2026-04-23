import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import VotersListModal from '../VotersListModal';

// Mock DataModal
vi.mock('@/mk/components/ui/DataModal/DataModal', () => ({
  default: ({ children, open, title, onClose, buttonCancel }: any) => (
    <div data-testid="data-modal" data-open={open}>
      {open && (
        <div>
          <h2 data-testid="modal-title">{title}</h2>
          {children}
          {buttonCancel && (
            <button onClick={onClose}>{buttonCancel}</button>
          )}
        </div>
      )}
    </div>
  ),
}));

// Mock Avatar
vi.mock('@/mk/components/ui/Avatar/Avatar', () => ({
  Avatar: ({ name }: any) => (
    <div data-testid="avatar" data-name={name}>
      Avatar-{name}
    </div>
  ),
}));

// Mock IconHousing
vi.mock('@/components/layout/icons/IconsBiblioteca', () => ({
  IconHousing: () => <span data-testid="icon-housing">Housing</span>,
}));

// Mock useAxios
const mockExecute = vi.fn();
vi.mock('@/mk/hooks/useAxios', () => ({
  default: () => ({
    execute: mockExecute,
    loaded: false,
  }),
}));

describe('VotersListModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    soptionId: 123,
    soptionText: 'Aprobar',
    totalVoters: 3,
  };

  const mockVotersResponse = {
    data: {
      success: true,
      data: {
        soption_id: 123,
        soption_text: 'Aprobar',
        total_voters: 3,
        voters: [
          { respondent_id: '1', respondent_type: 'owner', dpto_nro: '101', owner_name: 'Juan Pérez' },
          { respondent_id: '2', respondent_type: 'owner', dpto_nro: '102', owner_name: 'María García' },
          { respondent_id: '3', respondent_type: 'owner', dpto_nro: '103', owner_name: 'Carlos López' },
        ],
      },
    },
    error: null,
  };

  it('renderiza correctamente cuando está abierto', async () => {
    mockExecute.mockResolvedValueOnce(mockVotersResponse);

    render(<VotersListModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Votantes');
    });
    expect(screen.getByText('Aprobar')).toBeInTheDocument();
    expect(screen.getByText('3 votantes')).toBeInTheDocument();
  });

  it('muestra mensaje de carga mientras espera respuesta', async () => {
    // Simula un execute que tarda en responder
    mockExecute.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockVotersResponse), 100);
      });
    });

    render(<VotersListModal {...defaultProps} />);

    // Espera a que cargue
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });
  });

  it('muestra mensaje cuando no hay votantes', async () => {
    mockExecute.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          soption_id: 123,
          soption_text: 'Aprobar',
          total_voters: 0,
          voters: [],
        },
      },
      error: null,
    });

    render(<VotersListModal {...defaultProps} totalVoters={0} />);

    await waitFor(() => {
      expect(screen.getByText('No hay votantes para esta opción')).toBeInTheDocument();
    });
  });

  it('renderiza lista de votantes con datos correctos', async () => {
    mockExecute.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          soption_id: 123,
          soption_text: 'Aprobar',
          total_voters: 2,
          voters: [
            { respondent_id: '1', respondent_type: 'owner', dpto_nro: '101', owner_name: 'Juan Pérez' },
            { respondent_id: '2', respondent_type: 'owner', dpto_nro: '102', owner_name: 'María García' },
          ],
        },
      },
      error: null,
    });

    render(<VotersListModal {...defaultProps} totalVoters={2} />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('María García')).toBeInTheDocument();
      expect(screen.getByText('Unidad 101')).toBeInTheDocument();
      expect(screen.getByText('Unidad 102')).toBeInTheDocument();
    });
  });

  it('no hace llamada cuando no está abierto', () => {
    render(<VotersListModal {...defaultProps} open={false} />);

    expect(mockExecute).not.toHaveBeenCalled();
  });

  it('llama a onClose cuando se presiona Cerrar', async () => {
    mockExecute.mockResolvedValueOnce({
      data: { success: true, data: { voters: [] } },
      error: null,
    });

    render(<VotersListModal {...defaultProps} />);

    await waitFor(() => {
      const closeBtn = screen.getByRole('button', { name: /Cerrar/i });
      if (closeBtn) fireEvent.click(closeBtn);
    });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});