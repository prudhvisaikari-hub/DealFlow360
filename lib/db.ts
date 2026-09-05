import fs from "fs";
import path from "path";
import { DB } from "./types";
import { buildSeedData } from "./seed";

const DATA_FILE = path.join(process.cwd(), "data", "dealflow360.json");

function ensureDataFile(): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const seed = buildSeedData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2));
  }
}

export function readDB(): DB {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw) as DB;
}

export function writeDB(db: DB): void {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

export function resetDB(): DB {
  const seed = buildSeedData();
  writeDB(seed);
  return seed;
}
