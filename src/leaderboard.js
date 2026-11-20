import fs from "node:fs";

export function normalizeEntry(entry) {
  if (!/^[A-Za-z0-9_]{3,12}$/.test(entry.name)) throw new Error("invalid leaderboard name");
  return {name:entry.name,score:Number(entry.score),nights_won:Number(entry.nights_won),achieved_at:entry.achieved_at,seed:Number(entry.seed)};
}

export function rankEntries(entries) {
  return entries
    .map(normalizeEntry)
    .sort((a,b)=>b.score-a.score || new Date(a.achieved_at)-new Date(b.achieved_at))
    .slice(0,10);
}

export function loadLeaderboard(file) {
  if (!fs.existsSync(file)) return [];
  return rankEntries(JSON.parse(fs.readFileSync(file,"utf8")).entries || []);
}

export function saveLeaderboard(file,entries) {
  fs.mkdirSync(requireDir(file),{recursive:true});
  fs.writeFileSync(file,JSON.stringify({entries:rankEntries(entries)},null,2));
}

function requireDir(file) { return file.includes("/") ? file.slice(0,file.lastIndexOf("/")) : "."; }
