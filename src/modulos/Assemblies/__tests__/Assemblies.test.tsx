import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Assemblies from '../Assemblies';
import React from 'react';

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock components
vi.mock('@/components/auth/NotAccess/NotAccess', () => ({
  default: () => <div data-testid="not-access">Not Access</div>,
}));

// Mock useCrud
const mockUserCan = vi.fn();
const mockReLoad = vi.fn();
const mockOnEdit = vi.fn();
const mockOnCloseView = vi.fn();
const MockList = ({ onRowClick }: any) => (
  <div data-testid="crud-list" onClick={() => onRowClick({ id: '1', subject: 'Asamblea 1' })}>
    Mock List
  </div>
);

vi.mock('@/mk/hooks/useCrud/useCrud', () => ({
  default: vi.fn(() => ({
    userCan: mockUserCan,
    List: MockList,
    data: { message: { total: 10, S: 5, P: 2, C: 3 } },
    reLoad: mockReLoad,
    onEdit: mockOnEdit,
    onCloseView: mockOnCloseView,
  })),
}));

describe('Assemblies Module Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserCan.mockReturnValue(true);
  });

  it('renderiza el título correctamente', () => {
    render(<Assemblies />);
    expect(screen.getByText('Asambleas')).toBeInTheDocument();
  });

  it('muestra las cards de métricas con datos correctos', () => {
    render(<Assemblies />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Programadas')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('En progreso')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renderiza el List de asambleas', () => {
    render(<Assemblies />);
    expect(screen.getByTestId('crud-list')).toBeInTheDocument();
  });

  it('muestra NotAccess si no tiene permisos', () => {
    mockUserCan.mockReturnValue(false);
    render(<Assemblies />);
    expect(screen.getByTestId('not-access')).toBeInTheDocument();
  });
});
