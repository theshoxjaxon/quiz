export type Rankable = {
  score: number | null;
  timeTakenSec: number | null;
  submittedAt: Date | null;
};

// Higher score first, then faster, then earlier submission. Non-submitters sink to the bottom.
export function byRank(a: Rankable, b: Rankable) {
  return (
    (b.score ?? -1) - (a.score ?? -1) ||
    (a.timeTakenSec ?? 1e9) - (b.timeTakenSec ?? 1e9) ||
    (a.submittedAt?.getTime() ?? 1e15) - (b.submittedAt?.getTime() ?? 1e15)
  );
}

// ranked[0..4] -> Team 1; the rest are shuffled and dealt round-robin into Teams 2–6,
// so team sizes differ by at most one even when the class isn't exactly 30.
export function makeTeams<T>(ranked: T[], random = Math.random): T[][] {
  const rest = ranked.slice(5);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  const teams: T[][] = [ranked.slice(0, 5), [], [], [], [], []];
  rest.forEach((s, i) => teams[1 + (i % 5)].push(s));
  return teams;
}
