// htx-skill installer — copies SKILL.md + scripts/references for a skill
// to ~/.claude/skills/htx/<name>/

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function installSkill(skillName, sourceDir) {
  const target = path.join(os.homedir(), '.claude', 'skills', 'htx', skillName);
  await fs.mkdir(target, { recursive: true });
  await copyDir(sourceDir, target);
  console.log(`✓ Installed htx/${skillName} → ${target}`);
}

async function copyDir(src, dst) {
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) {
      await fs.mkdir(d, { recursive: true });
      await copyDir(s, d);
    } else if (e.isFile()) {
      await fs.copyFile(s, d);
    }
  }
}
