import '@testing-library/jest-dom';
import { vi } from 'vitest';

const createMemoryStorage = () => {
  let storage: Record<string, string> = {};

  return {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => {
      storage[key] = String(value);
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      storage = {};
    },
    key: (index: number) => Object.keys(storage)[index] ?? null,
    get length() {
      return Object.keys(storage).length;
    },
  };
};

if (
  typeof globalThis.localStorage === 'undefined' ||
  typeof globalThis.localStorage.clear !== 'function'
) {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: createMemoryStorage(),
  });
}

process.env.NEXT_PUBLIC_AUTH_IAM ??= '/adm-iam';
process.env.NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX ??= 'dev';
process.env.NEXT_PUBLIC_INSTANTDB_APP_ID ??= 'test-app-id';

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
