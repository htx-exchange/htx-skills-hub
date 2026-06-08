// htx-skill installer — writes embedded skill files to ~/.claude/skills/htx/<name>/

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { SKILLS } from './embedded-skills.js';

export async function installSkill(skillName) {
  const prefix = skillName + '/';
  const entries = Object.entries(SKILLS).filter(
    ([key]) => key.startsWith(prefix)
  );

  if (entries.length === 0) {
    throw new Error(`Skill "${skillName}" not found in embedded data`);
  }

  const target = path.join(os.homedir(), '.claude', 'skills', 'htx', skillName);

  for (const [key, content] of entries) {
    const relPath = key.slice(prefix.length);
    const filePath = path.join(target, relPath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf8');
  }

  console.log(`✓ Installed htx/${skillName} → ${target}`);
}
