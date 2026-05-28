import { randomInt } from "node:crypto";

function fisherYates<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface RequestRef {
  id: string;
  authorId: string;
}

/**
 * Assign each request to a member where assignee !== request.authorId.
 *
 * Two-tier strategy:
 *
 *   Tier 1 — when |R| <= |M|: Fisher-Yates shuffle the members and pair
 *   request[i] with shuffled[i]. Retry on self-assignment. Yields a clean
 *   1-per-member derangement (the expected prayer-circle pattern).
 *
 *   Tier 2 — when tier 1 fails or |R| > |M|: greedy load-balanced — for
 *   each request, pick the least-loaded non-author member, breaking ties
 *   at random. Spreads multi-request load evenly across members.
 *
 * Returns null when fewer than 2 members or zero requests.
 */
export function assignRequestsToMembers(
  requests: RequestRef[],
  memberIds: string[],
): Map<string, string> | null {
  if (requests.length === 0 || memberIds.length < 2) return null;

  if (requests.length <= memberIds.length) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const shuffled = fisherYates(memberIds);
      const result = new Map<string, string>();
      let bad = false;
      for (let i = 0; i < requests.length; i++) {
        if (shuffled[i] === requests[i].authorId) {
          bad = true;
          break;
        }
        result.set(requests[i].id, shuffled[i]);
      }
      if (!bad) return result;
    }
  }

  const shuffledReqs = fisherYates(requests);
  const load = new Map<string, number>(memberIds.map((m) => [m, 0]));
  const result = new Map<string, string>();
  for (const req of shuffledReqs) {
    const candidates = memberIds.filter((m) => m !== req.authorId);
    if (candidates.length === 0) return null;
    let best = Infinity;
    for (const c of candidates) {
      const l = load.get(c) ?? 0;
      if (l < best) best = l;
    }
    const tied = fisherYates(
      candidates.filter((c) => (load.get(c) ?? 0) === best),
    );
    const assignee = tied[0];
    result.set(req.id, assignee);
    load.set(assignee, (load.get(assignee) ?? 0) + 1);
  }
  return result;
}
