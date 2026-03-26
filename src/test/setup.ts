import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Common mocks
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/mk/contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User' },
    userCan: (perm: string, action: string) => true,
    store: {},
    setStore: vi.fn(),
  }),
}));
