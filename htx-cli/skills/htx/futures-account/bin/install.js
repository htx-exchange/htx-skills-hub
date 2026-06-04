#!/usr/bin/env node
// Installer for an HTX Skills Hub skill.
// Copies SKILL.md, LICENSE.md, README.md and references/ into the target
// skills directory under htx/<skill-name>/.

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const PKG = require('../package.json');
// Package name is "@htx-skills/<skill-name>"; skill name is the last segment.
const SKILL_NAME = PKG.name.split('/').pop();
const SKILL_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = { command: null, dest: null, force: false, help: false };
  const rest = argv.slice(2);
  if (rest.length && !rest[0].startsWith('-')) {
    args.command = rest.shift();
  }
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--dest' || a === '-d') {
      args.dest = rest[++i];
    } else if (a.startsWith('--dest=')) {
      args.dest = a.slice('--dest='.length);
    } else if (a === '--force' || a === '-f') {
      args.force = true;
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    } else {
      console.error(`Unknown argument: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

function resolveSkillsDir(explicit) {
  if (explicit) return path.resolve(explicit);
  if (process.env.CLAUDE_SKILLS_DIR) return path.resolve(process.env.CLAUDE_SKILLS_DIR);
  if (process.env.XDG_DATA_HOME) return path.join(process.env.XDG_DATA_HOME, 'claude', 'skills');
  return path.join(os.homedir(), '.claude', 'skills');
}

function copyRecursive(src, dst, force) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dst, entry), force);
    }
    return;
  }
  if (fs.existsSync(dst) && !force) {
    throw new Error(`refusing to overwrite ${dst} (pass --force)`);
  }
  fs.copyFileSync(src, dst);
}

function install(args) {
  const skillsDir = resolveSkillsDir(args.dest);
  const target = path.join(skillsDir, SKILL_NAME);
  fs.mkdirSync(target, { recursive: true });

  const items = ['SKILL.md', 'README.md', 'LICENSE.md', 'references'];
  for (const name of items) {
    const src = path.join(SKILL_ROOT, name);
    if (!fs.existsSync(src)) continue;
    copyRecursive(src, path.join(target, name), args.force);
  }

  console.log(`installed @htx-skills/${SKILL_NAME}@${PKG.version} -> ${target}`);
}

function uninstall(args) {
  const skillsDir = resolveSkillsDir(args.dest);
  const target = path.join(skillsDir, SKILL_NAME);
  if (!fs.existsSync(target)) {
    console.log(`not installed at ${target}`);
    return;
  }
  fs.rmSync(target, { recursive: true, force: true });
  console.log(`removed ${target}`);
}

function printPath(args) {
  const skillsDir = resolveSkillsDir(args.dest);
  console.log(path.join(skillsDir, SKILL_NAME));
}

function printHelp() {
  console.log(`@htx-skills/${SKILL_NAME} installer

Usage:
  npx -y @htx-skills/${SKILL_NAME} install   [--dest DIR] [--force]
  npx -y @htx-skills/${SKILL_NAME} uninstall [--dest DIR]
  npx -y @htx-skills/${SKILL_NAME} path      [--dest DIR]

Target resolution order:
  --dest  >  $CLAUDE_SKILLS_DIR  >  $XDG_DATA_HOME/claude/skills  >  ~/.claude/skills

The skill is written to <target>/${SKILL_NAME}/.`);
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.command) {
    printHelp();
    process.exit(args.command ? 0 : 1);
  }
  try {
    switch (args.command) {
      case 'install':   return install(args);
      case 'uninstall': return uninstall(args);
      case 'remove':    return uninstall(args);
      case 'path':      return printPath(args);
      default:
        console.error(`Unknown command: ${args.command}`);
        printHelp();
        process.exit(2);
    }
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

main();
