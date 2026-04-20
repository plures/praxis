import { describe, expect, it } from 'vitest';
import { teamMembersEndpoint } from './endpoints.js';

const createContext = () => ({
  log: (_message: string) => undefined,
  done: (_err?: Error, _result?: unknown) => undefined,
});

function generateTeamId(): string {
  return `team-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

describe('teamMembersEndpoint', () => {
  it('allows owner to add members and blocks unauthorized role changes', async () => {
    const teamId = generateTeamId();

    const createOwner = await teamMembersEndpoint(createContext(), {
      method: 'POST',
      url: '/teams/members',
      headers: {},
      query: {},
      body: {
        teamId,
        actorId: 'alice',
        userId: 'alice',
        role: 'owner',
      },
    });

    expect(createOwner.status).toBe(200);

    const addAdmin = await teamMembersEndpoint(createContext(), {
      method: 'POST',
      url: '/teams/members',
      headers: {},
      query: {},
      body: {
        teamId,
        actorId: 'alice',
        userId: 'bob',
        role: 'admin',
      },
    });

    expect(addAdmin.status).toBe(201);

    const adminAssignOwner = await teamMembersEndpoint(createContext(), {
      method: 'POST',
      url: '/teams/members',
      headers: {},
      query: {},
      body: {
        teamId,
        actorId: 'bob',
        userId: 'carol',
        role: 'owner',
      },
    });

    expect(adminAssignOwner.status).toBe(403);
    expect(adminAssignOwner.body).toEqual({ error: 'Insufficient permission to assign that role' });

    const invalidCreate = await teamMembersEndpoint(createContext(), {
      method: 'POST',
      url: '/teams/members',
      headers: {},
      query: {},
      body: {
        teamId: generateTeamId(),
        actorId: 'alice',
        userId: 'eve',
        role: 'member',
      },
    });

    expect(invalidCreate.status).toBe(400);
    expect(invalidCreate.body).toEqual({
      error: 'New teams must be initialized by adding yourself as owner',
    });
  });

  it('enforces member access for listing and remove role permissions', async () => {
    const teamId = generateTeamId();

    await teamMembersEndpoint(createContext(), {
      method: 'POST',
      url: '/teams/members',
      headers: {},
      query: {},
      body: {
        teamId,
        actorId: 'owner',
        userId: 'owner',
        role: 'owner',
      },
    });

    await teamMembersEndpoint(createContext(), {
      method: 'POST',
      url: '/teams/members',
      headers: {},
      query: {},
      body: {
        teamId,
        actorId: 'owner',
        userId: 'member-user',
        role: 'member',
      },
    });

    const outsiderList = await teamMembersEndpoint(createContext(), {
      method: 'GET',
      url: '/teams/members',
      headers: {},
      query: {
        teamId,
        actorId: 'outsider',
      },
    });

    expect(outsiderList.status).toBe(403);

    const ownerList = await teamMembersEndpoint(createContext(), {
      method: 'GET',
      url: '/teams/members',
      headers: {},
      query: {
        teamId,
        actorId: 'owner',
      },
    });

    expect(ownerList.status).toBe(200);
    expect((ownerList.body as { members: Array<{ userId: string }> }).members).toEqual(
      expect.arrayContaining([expect.objectContaining({ userId: 'owner' })])
    );

    const removeOwner = await teamMembersEndpoint(createContext(), {
      method: 'DELETE',
      url: '/teams/members',
      headers: {},
      query: {},
      body: {
        teamId,
        actorId: 'owner',
        userId: 'owner',
      },
    });

    expect(removeOwner.status).toBe(400);
    expect(removeOwner.body).toEqual({ error: 'Team must have at least one owner' });

    const demoteOwner = await teamMembersEndpoint(createContext(), {
      method: 'POST',
      url: '/teams/members',
      headers: {},
      query: {},
      body: {
        teamId,
        actorId: 'owner',
        userId: 'owner',
        role: 'member',
      },
    });

    expect(demoteOwner.status).toBe(400);
    expect(demoteOwner.body).toEqual({ error: 'Team must have at least one owner' });
  });
});
