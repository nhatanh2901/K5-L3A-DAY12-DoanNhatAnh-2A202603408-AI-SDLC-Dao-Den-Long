export function normalizeEntry(entry) {
  if(!entry||!/^[A-Za-z0-9_]{3,12}$/.test(entry.name))throw new Error('invalid leaderboard name');
  if(!Number.isFinite(entry.score)||entry.score<0||!Number.isInteger(entry.nights_won)||entry.nights_won<0||entry.nights_won>3||!Number.isInteger(entry.seed)||entry.seed<0||!Number.isFinite(Date.parse(entry.achieved_at)))throw new Error('invalid leaderboard entry');
  return {name:entry.name,score:entry.score,nights_won:entry.nights_won,achieved_at:entry.achieved_at,seed:entry.seed};
}
export function rankEntries(entries){
  if(!Array.isArray(entries))throw new Error('entries must be an array');
  return entries.map(normalizeEntry).sort((a,b)=>b.score-a.score||Date.parse(a.achieved_at)-Date.parse(b.achieved_at)||a.name.localeCompare(b.name)).slice(0,10);
}
