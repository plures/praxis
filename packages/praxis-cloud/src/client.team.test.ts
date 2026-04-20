import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCloudRelay } from './client.js';

describe('createCloudRelay team methods', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('calls team members endpoint for list/add/remove', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'healthy' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        statusText: 'OK',
        json: async () => ({ members: [{ userId: 'alice', role: 'owner' }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        statusText: 'OK',
        json: async () => ({
          members: [
            { userId: 'alice', role: 'owner' },
            { userId: 'bob', role: 'member' },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        statusText: 'OK',
        json: async () => ({ members: [{ userId: 'alice', role: 'owner' }] }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const client = createCloudRelay({
      endpoint: 'https://relay.example.com',
      appId: 'app-1',
      authToken: 'token',
    });

    await client.connect();

    const listed = await client.listTeamMembers({ teamId: 'team-1', actorId: 'alice' });
    expect(listed).toHaveLength(1);

    const added = await client.addTeamMember({
      teamId: 'team-1',
      actorId: 'alice',
      userId: 'bob',
      role: 'member',
    });
    expect(added).toHaveLength(2);

    const removed = await client.removeTeamMember({
      teamId: 'team-1',
      actorId: 'alice',
      userId: 'bob',
    });
    expect(removed).toHaveLength(1);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://relay.example.com/teams/members?teamId=team-1&actorId=alice',
      expect.objectContaining({ method: 'GET' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'https://relay.example.com/teams/members',
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'https://relay.example.com/teams/members',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
