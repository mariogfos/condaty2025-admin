import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AssemblyStatusActions from '../AssemblyStatusActions';

const mockOnStatusChange = vi.fn();
const mockExecute = vi.fn();

vi.mock('@/mk/hooks/useAxios', () => ({
  default: () => ({
    execute: mockExecute,
  }),
}));

describe('AssemblyStatusActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockReset();
  });

  const renderComponent = (assembly: any) => {
    return render(
      <AssemblyStatusActions
        assembly={assembly}
        onStatusChange={mockOnStatusChange}
      />
    );
  };

  describe('Estado Scheduled (S)', () => {
    const scheduledAssembly = {
      id: 1,
      status: 'S',
      subject: 'Asamblea Programada',
    };

    it('muestra "Iniciar" y "Cancelar" como opciones', async () => {
      renderComponent(scheduledAssembly);

      expect(screen.getByRole('button', { name: /Iniciar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    });

    it('no muestra botón de "Completar"', async () => {
      renderComponent(scheduledAssembly);

      expect(screen.queryByRole('button', { name: /Completar/i })).not.toBeInTheDocument();
    });

    it('no muestra botón de "Reagendar"', async () => {
      renderComponent(scheduledAssembly);

      expect(screen.queryByRole('button', { name: /Reagendar/i })).not.toBeInTheDocument();
    });

    it('envía PATCH al hacer clic en Iniciar', async () => {
      mockExecute.mockResolvedValueOnce({
        data: { success: true },
      });

      renderComponent(scheduledAssembly);

      const iniciarBtn = screen.getByRole('button', { name: /Iniciar/i });
      fireEvent.click(iniciarBtn);

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledWith(
          '/assemblies/1/status',
          'PATCH',
          { status: 'P' },
          false,
          true,
        );
      });
    });

    it('envía X al hacer clic en Cancelar', async () => {
      mockExecute.mockResolvedValueOnce({
        data: { success: true },
      });

      renderComponent(scheduledAssembly);

      const cancelarBtn = screen.getByRole('button', { name: /Cancelar/i });
      fireEvent.click(cancelarBtn);

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledWith(
          '/assemblies/1/status',
          'PATCH',
          { status: 'X' },
          false,
          true,
        );
      });
    });
  });

  describe('Estado InProgress (P)', () => {
    const inProgressAssembly = {
      id: 2,
      status: 'P',
      subject: 'Asamblea En Progreso',
    };

    it('muestra "Completar" como opción', async () => {
      renderComponent(inProgressAssembly);

      expect(screen.getByRole('button', { name: /Completar/i })).toBeInTheDocument();
    });

    it('muestra "Cancelar" como opción', async () => {
      renderComponent(inProgressAssembly);

      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
    });

    it('no muestra botón de "Iniciar"', async () => {
      renderComponent(inProgressAssembly);

      expect(screen.queryByRole('button', { name: /Iniciar/i })).not.toBeInTheDocument();
    });

    it('envía C al hacer clic en Completar', async () => {
      mockExecute.mockResolvedValueOnce({
        data: { success: true },
      });

      renderComponent(inProgressAssembly);

      const completarBtn = screen.getByRole('button', { name: /Completar/i });
      fireEvent.click(completarBtn);

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledWith(
          '/assemblies/2/status',
          'PATCH',
          { status: 'C' },
          false,
          true,
        );
      });
    });
  });

  describe('Estado Completed (C)', () => {
    const completedAssembly = {
      id: 3,
      status: 'C',
      subject: 'Asamblea Finalizada',
    };

    it('muestra "Reagendar" como opción', async () => {
      renderComponent(completedAssembly);

      expect(screen.getByRole('button', { name: /Reagendar/i })).toBeInTheDocument();
    });

    it('no muestra "Completar" ni "Cancelar"', async () => {
      renderComponent(completedAssembly);

      expect(screen.queryByRole('button', { name: /Completar/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Cancelar/i })).not.toBeInTheDocument();
    });

    it('envía S al hacer clic en Reagendar', async () => {
      mockExecute.mockResolvedValueOnce({
        data: { success: true },
      });

      renderComponent(completedAssembly);

      const reagendarBtn = screen.getByRole('button', { name: /Reagendar/i });
      fireEvent.click(reagendarBtn);

      await waitFor(() => {
        expect(mockExecute).toHaveBeenCalledWith(
          '/assemblies/3/status',
          'PATCH',
          { status: 'S' },
          false,
          true,
        );
      });
    });
  });

  describe('Estado Cancelled (X)', () => {
    const cancelledAssembly = {
      id: 4,
      status: 'X',
      subject: 'Asamblea Cancelada',
    };

    it('muestra "Reagendar" como opción', async () => {
      renderComponent(cancelledAssembly);

      expect(screen.getByRole('button', { name: /Reagendar/i })).toBeInTheDocument();
    });
  });

  describe('Llamadas a callbacks', () => {
    it('llama a onStatusChange después de cambiar estado exitosamente', async () => {
      mockExecute.mockResolvedValueOnce({
        data: { success: true },
      });

      const scheduledAssembly = { id: 1, status: 'S', subject: 'Test' };
      renderComponent(scheduledAssembly);

      const iniciarBtn = screen.getByRole('button', { name: /Iniciar/i });
      fireEvent.click(iniciarBtn);

      await waitFor(() => {
        expect(mockOnStatusChange).toHaveBeenCalledWith({
          id: 1,
          status: 'P',
          subject: 'Test',
        });
      });
    });

    it('no llama a onStatusChange si la petición falla', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Error'));

      const scheduledAssembly = { id: 1, status: 'S', subject: 'Test' };
      renderComponent(scheduledAssembly);

      const iniciarBtn = screen.getByRole('button', { name: /Iniciar/i });
      fireEvent.click(iniciarBtn);

      await waitFor(() => {
        expect(mockOnStatusChange).not.toHaveBeenCalled();
      });
    });

    it('no llama a onStatusChange si no hay respuesta', async () => {
      mockExecute.mockResolvedValueOnce({ data: null });

      const scheduledAssembly = { id: 1, status: 'S', subject: 'Test' };
      renderComponent(scheduledAssembly);

      const iniciarBtn = screen.getByRole('button', { name: /Iniciar/i });
      fireEvent.click(iniciarBtn);

      await waitFor(() => {
        expect(mockOnStatusChange).not.toHaveBeenCalled();
      });
    });
  });

  describe('Estados de carga', () => {
    it('deshabilita botones mientras está cargando', async () => {
      mockExecute.mockImplementation(() => new Promise(() => {})); // Never resolves

      const scheduledAssembly = { id: 1, status: 'S', subject: 'Test' };
      renderComponent(scheduledAssembly);

      const iniciarBtn = screen.getByRole('button', { name: /Iniciar/i });
      fireEvent.click(iniciarBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Iniciar/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Cancelar/i })).toBeDisabled();
      });
    });

    it('habilita botones después de cargar', async () => {
      mockExecute.mockResolvedValueOnce({ data: { success: true } });

      const scheduledAssembly = { id: 1, status: 'S', subject: 'Test' };
      renderComponent(scheduledAssembly);

      const iniciarBtn = screen.getByRole('button', { name: /Iniciar/i });
      fireEvent.click(iniciarBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Iniciar/i })).not.toBeDisabled();
      });
    });
  });

  describe('Display de estado actual', () => {
    it('muestra el estado actual correctamente para Scheduled', async () => {
      const assembly = { id: 1, status: 'S' };
      renderComponent(assembly);

      expect(screen.getByText('Estado: Programada')).toBeInTheDocument();
    });

    it('muestra el estado actual correctamente para InProgress', async () => {
      const assembly = { id: 1, status: 'P' };
      renderComponent(assembly);

      expect(screen.getByText('Estado: En progreso')).toBeInTheDocument();
    });

    it('muestra el estado actual correctamente para Completed', async () => {
      const assembly = { id: 1, status: 'C' };
      renderComponent(assembly);

      expect(screen.getByText('Estado: Completada')).toBeInTheDocument();
    });

    it('muestra el estado actual correctamente para Cancelled', async () => {
      const assembly = { id: 1, status: 'X' };
      renderComponent(assembly);

      expect(screen.getByText('Estado: Cancelada')).toBeInTheDocument();
    });
  });

  describe('Evita doble ejecución', () => {
    it('no permite múltiples clicks mientras carga', async () => {
      let callCount = 0;
      mockExecute.mockImplementation(() => {
        callCount++;
        return new Promise((resolve) => setTimeout(() => resolve({ data: { success: true } }), 100));
      });

      const scheduledAssembly = { id: 1, status: 'S', subject: 'Test' };
      renderComponent(scheduledAssembly);

      const iniciarBtn = screen.getByRole('button', { name: /Iniciar/i });
      fireEvent.click(iniciarBtn);
      fireEvent.click(iniciarBtn); // Double click
      fireEvent.click(iniciarBtn); // Triple click

      await waitFor(() => {
        expect(callCount).toBe(1);
      });
    });
  });
});