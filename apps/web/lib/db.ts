import fs from "node:fs";
import path from "node:path";

type Case = {
  id: string;
  task: string;
  status: string;
  verdict: string | null;
  sentence: string | null;
  createdAt: string; // ISO string for JSON safety
};

// On-disk JSON store. Tiny and durable enough for the demo, and survives
// every Next.js dev restart / hot reload (in-memory Maps don't).
const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "cases.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

function readAll(): Case[] {
  try {
    ensureFile();
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("[DB] Failed to read store:", err);
    return [];
  }
}

function writeAll(cases: Case[]) {
  try {
    ensureFile();
    // Atomic-ish write: write to temp then rename so the file is never empty.
    const tmp = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(cases, null, 2), "utf8");
    fs.renameSync(tmp, DATA_FILE);
  } catch (err) {
    console.error("[DB] Failed to write store:", err);
  }
}

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

export const db = {
  cases: {
    findMany: async () => {
      const all = readAll();
      console.log("[DB] findMany - total cases:", all.length);
      return all
        .slice()
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((c) => ({
          id: c.id,
          task: c.task,
          status: c.status,
          verdict: c.verdict,
          sentence: c.sentence,
          createdAt: c.createdAt,
        }));
    },

    findUnique: async ({ where }: { where: { id: string } }) => {
      const all = readAll();
      const found = all.find((c) => c.id === where.id) ?? null;
      console.log(
        "[DB] findUnique - looking for:",
        where.id,
        "- exists:",
        !!found
      );
      return found;
    },

    create: async ({
      data,
    }: {
      data: { task: string; status: string; verdict: string | null; sentence: string | null };
    }) => {
      const all = readAll();
      const newCase: Case = {
        id: generateId(),
        task: data.task,
        status: data.status ?? "PENDING",
        verdict: data.verdict ?? null,
        sentence: data.sentence ?? null,
        createdAt: new Date().toISOString(),
      };
      all.push(newCase);
      writeAll(all);
      console.log(
        "[DB] create - new case:",
        newCase.id,
        "- total cases:",
        all.length
      );
      return newCase;
    },

    update: async ({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<Omit<Case, "id" | "createdAt">>;
    }) => {
      const all = readAll();
      const idx = all.findIndex((c) => c.id === where.id);
      if (idx === -1) throw new Error(`Case ${where.id} not found`);
      const updated: Case = { ...all[idx], ...data };
      all[idx] = updated;
      writeAll(all);
      console.log("[DB] update - case:", where.id);
      return updated;
    },
  },
};
