#!/usr/bin/env node
// Build script: generates src/embedded-skills.js then compiles cross-platform binaries via bun.

import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills', 'htx');
const OUTPUT = path.join(ROOT, 'src', 'embedded-skills.js');
const DIST = path.join(ROOT, 'dist');
const ENTRY = path.join(ROOT, 'bin', 'htx-cli.js');

const TARGETS = [
  { target: 'bun-darwin-arm64',  out: 'htx-cli-darwin-arm64' },
  { target: 'bun-darwin-x64',    out: 'htx-cli-darwin-x64' },
  { target: 'bun-linux-x64',     out: 'htx-cli-linux-x64' },
  { target: 'bun-windows-x64',   out: 'htx-cli-windows-x64.exe' },
];

async function scanDir(dir, base) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = {};
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.join(base, e.name);
    if (e.isDirectory()) {
      Object.assign(files, await scanDir(full, rel));
    } else if (e.isFile()) {
      files[rel] = await fs.readFile(full, 'utf8');
    }
  }
  return files;
}

async function codegen() {
  console.log('Scanning skills/htx/ ...');
  const skills = await scanDir(SKILLS_DIR, '');
  const keys = Object.keys(skills);
  console.log(`  Found ${keys.length} files`);

  // Generate module
  let code = '// AUTO-GENERATED — do not edit. Run: node scripts/build.js --codegen-only\n';
  code += 'export const SKILLS = {\n';
  for (const key of keys) {
    // Normalize path separators to forward slashes
    const normalizedKey = key.split(path.sep).join('/');
    const escaped = skills[key]
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');
    code += `  ${JSON.stringify(normalizedKey)}: \`${escaped}\`,\n`;
  }
  code += '};\n';

  await fs.writeFile(OUTPUT, code, 'utf8');
  console.log(`  Generated ${OUTPUT}`);
}

async function compile() {
  await fs.mkdir(DIST, { recursive: true });
  for (const { target, out } of TARGETS) {
    const outPath = path.join(DIST, out);
    const cmd = `bun build --compile --minify --target=${target} ${ENTRY} --outfile ${outPath}`;
    console.log(`  Compiling ${target} ...`);
    try {
      execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
      console.log(`    → ${outPath}`);
    } catch (e) {
      console.error(`    ✗ Failed for ${target}: ${e.message}`);
    }
  }
}

const codegenOnly = process.argv.includes('--codegen-only');
await codegen();
if (!codegenOnly) {
  await compile();
}
