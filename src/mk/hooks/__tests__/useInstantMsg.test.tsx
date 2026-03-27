import { renderHook } from '@testing-library/react';
import { useInstantMsg } from '../useInstantMsg';
import { useAuth } from '@/mk/contexts/AuthProvider';
import { initSocket } from '../../components/notif/provider/useNotifInstandDB';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mocks
vi.mock('@/mk/contexts/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../components/notif/provider/useNotifInstandDB', () => ({
  initSocket: vi.fn(),
}));

vi.mock('@instantdb/react', () => ({
  id: vi.fn(() => 'mock-id'),
}));

describe('useInstantMsg', () => {
  const mockUser = {
    id: 'user-123',
    client_id: 'client-456',
  };

  const mockTransact = vi.fn();
  const mockDb = {
    transact: mockTransact,
    tx: {
      notif: {
        'mock-id': {
          update: vi.fn((data) => data),
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
    (initSocket as any).mockReturnValue(Promise.resolve(mockDb));
    process.env.NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX = 'dev-';
  });

  it('should broadcast a message to the correct channel with prefix', async () => {
    const { result } = renderHook(() => useInstantMsg());
    
    await result.current.sendMsg('test-channel', 'test-event', { foo: 'bar' });

    expect(mockTransact).toHaveBeenCalledWith(
        expect.anything() // The result of db.tx.notif[id()].update
    );
    
    const updateCall = mockDb.tx.notif['mock-id'].update.mock.results[0].value;
    expect(updateCall.channel).toBe('dev-client-456-test-channel');
    expect(updateCall.event).toBe('test-event');
    expect(JSON.parse(updateCall.payload)).toEqual({ foo: 'bar' });
  });

  it('should include target_roles when criteria contains roles', async () => {
    const { result } = renderHook(() => useInstantMsg());
    const criteria = {
      roles: {
        owner_titular: true,
        owner_homeowner: false,
        guard: 1
      }
    };

    await result.current.sendMsg('owners', 'new-survey', { surveyId: 1 }, criteria);

    const updateCall = mockDb.tx.notif['mock-id'].update.mock.results[0].value;
    expect(updateCall.target_roles).toEqual(['owner_titular', 'guard']);
    expect(JSON.parse(updateCall.target_criteria)).toEqual(criteria);
  });

  it('should use notifyOwners helper correctly', async () => {
    const { result } = renderHook(() => useInstantMsg());
    
    await result.current.notifyOwners('event-x', { data: 'y' });

    const updateCall = mockDb.tx.notif['mock-id'].update.mock.results[0].value;
    expect(updateCall.channel).toBe('dev-client-456-owners');
  });
});
