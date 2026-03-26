import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Surveys from '../Surveys';
import React from 'react';

// Mock components that might be problematic or not needed
vi.mock('@/components/auth/NotAccess/NotAccess', () => ({
  default: () => <div data-testid="not-access">Not Access</div>,
}));

vi.mock('@/components/DateRangeFilterModal/DateRangeFilterModal', () => ({
  default: () => <div data-testid="date-filter-modal">Date Filter Modal</div>,
}));

// Mock useCrud
const mockOnView = vi.fn();
const mockReLoad = vi.fn();
const mockOnFilter = vi.fn();
const mockUserCan = vi.fn();
const MockList = ({ onRowClick }: any) => (
  <div data-testid="crud-list" onClick={() => onRowClick({ id: 1, title: 'Item 1' })}>
    Mock List
  </div>
);

vi.mock('@/mk/hooks/useCrud/useCrud', () => ({
  default: vi.fn(() => ({
    userCan: mockUserCan,
    List: MockList,
    onView: mockOnView,
    reLoad: mockReLoad,
    onFilter: mockOnFilter,
  })),
}));

describe('Surveys Module (Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserCan.mockReturnValue(true); // Permitir por defecto
  });

  it('renderiza el título correctamente', () => {
    render(<Surveys />);
    expect(screen.getByText('Encuestas')).toBeInTheDocument();
  });

  it('muestra NotAccess si el usuario no tiene permisos', () => {
    mockUserCan.mockReturnValue(false);
    render(<Surveys />);
    expect(screen.getByTestId('not-access')).toBeInTheDocument();
  });

  it('renderiza el List de useCrud', () => {
    render(<Surveys />);
    expect(screen.getByTestId('crud-list')).toBeInTheDocument();
  });

  it('llama a onView cuando se hace clic en una fila del List', () => {
    render(<Surveys />);
    const list = screen.getByTestId('crud-list');
    list.click();
    expect(mockOnView).toHaveBeenCalledWith({ id: 1, title: 'Item 1' });
  });
});
