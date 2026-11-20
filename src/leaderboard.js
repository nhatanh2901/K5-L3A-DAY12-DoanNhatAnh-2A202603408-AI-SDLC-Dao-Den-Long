import fs from "node:fs";
import path from 'node:path';
import {rankEntries} from './ranking.js';
export {rankEntries,normalizeEntry} from './ranking.js';

export function loadLeaderboard(file) {
  if (!fs.existsSync(file)) return [];
  return rankEntries(JSON.parse(fs.readFileSync(file,"utf8")).entries || []);
}

export function saveLeaderboard(file,entries) {
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,JSON.stringify({entries:rankEntries(entries)},null,2));
}
