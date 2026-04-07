/**
 * Key paths for Praxis data in PluresDB
 */
export const PRAXIS_PATHS = {
  BASE: '/_praxis',
  FACTS: '/_praxis/facts',
  EVENTS: '/_praxis/events',
  STATE: '/_praxis/state',
  SCHEMAS: '/_praxis/schemas',
} as const;

export function getFactPath(factTag: string, id?: string): string {
  return id
    ? `${PRAXIS_PATHS.FACTS}/${factTag}/${id}`
    : `${PRAXIS_PATHS.FACTS}/${factTag}`;
}

export function getEventPath(eventTag: string): string {
  return `${PRAXIS_PATHS.EVENTS}/${eventTag}`;
}
