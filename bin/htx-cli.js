#!/usr/bin/env node
// htx-cli — entry point. Routes to skill handlers based on first arg.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { run as spotMarket } from '../src/commands/spot-market.js';
import { run as futuresMarket } from '../src/commands/futures-market.js';
import { run as fundingRate } from '../src/commands/funding-rate.js';
import {
  oiTracker, elitePositioning, liquidationStream, markPrice, settlement,
} from '../src/commands/derivatives.js';
import { run as spotAccount } from '../src/commands/spot-account.js';
import { run as spotTrading } from '../src/commands/spot-trading.js';
import { run as futuresAccount } from '../src/commands/futures-account.js';
import { run as futuresTrading } from '../src/commands/futures-trading.js';
import { installSkill } from '../src/installer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_ROOT = path.resolve(__dirname, '..', 'skills', 'htx');

const SKILLS = {
  'spot-market':        { run: spotMarket },
  'futures-market':     { run: futuresMarket },
  'funding-rate':       { run: fundingRate },
  'oi-tracker':         oiTracker,
  'elite-positioning':  elitePositioning,
  'liquidation-stream': liquidationStream,
  'mark-price':         markPrice,
  'settlement':         settlement,
  'spot-account':       { run: spotAccount },
  'spot-trading':       { run: spotTrading },
  'futures-account':    { run: futuresAccount },
  'futures-trading':    { run: futuresTrading },
};

function parseArgs(argv) {
  // First arg is skill name, rest is sub + flags
  const [skill, ...rest] = argv;
  const args = { _: [], p: {} };
  for (let i = 0; i < rest.length; i++) {
    const t = rest[i];
    if (t === '-p' || t === '--param') {
      const kv = rest[++i] || '';
      const idx = kv.indexOf('=');
      if (idx > 0) args.p[kv.slice(0, idx)] = kv.slice(idx + 1);
    } else if (t.startsWith('--')) {
      const key = t.slice(2);
      const next = rest[i + 1];
      if (!next || next.startsWith('-')) { args[key] = true; }
      else { args[key] = next; i++; }
    } else if (t === '--json') {
      args.json = true;
    } else {
      args._.push(t);
    }
  }
  return { skill, args };
}

function showRoot() {
  console.error(`htx-cli — HTX exchange CLI for AI agents

Usage:
  htx-cli <skill> <subcommand> [-p key=value ...]

Available skills (Phase 3a — public endpoints):
  spot-market         13 endpoints (现货行情)
  futures-market      15 endpoints (合约行情)
  funding-rate         4 endpoints (资金费率)
  oi-tracker           2 endpoints (持仓量)
  elite-positioning    2 endpoints (精英多空比)
  liquidation-stream   1 endpoint  (清算流)
  mark-price           3 endpoints (标记价/溢价/基差)
  settlement           4 endpoints (结算/保险基金)

Examples:
  htx-cli spot-market market-detail-merged -p symbol=btcusdt
  htx-cli funding-rate batch
  htx-cli futures-market kline -p contract_code=BTC-USDT -p period=4hour -p size=200

Run any skill without subcommand to see its subcommands.

Repo: https://github.com/sheerl/htx-skills-hub
`);
}

const SKILL_NAMES = [
  'spot-market', 'spot-account', 'spot-trading',
  'futures-market', 'funding-rate', 'oi-tracker', 'elite-positioning',
  'liquidation-stream', 'mark-price', 'settlement',
  'futures-account', 'futures-trading',
  'technical-analysis', 'ta-master',
  'derivatives-analyst', 'sentiment-analyst', 'market-overview',
];

async function handleSkillCmd(argv) {
  const sub = argv[1];
  if (sub === 'list') {
    console.log(SKILL_NAMES.join('\n'));
    return;
  }
  if (sub === 'install') {
    const name = argv[2];
    if (!name) { console.error('Usage: htx-cli skill install <name>|all'); process.exit(1); }
    if (name === 'all') {
      for (const n of SKILL_NAMES) await tryInstall(n);
    } else {
      await tryInstall(name);
    }
    return;
  }
  console.error('Usage: htx-cli skill <list|install <name>|install all>');
  process.exit(1);
}

async function tryInstall(name) {
  const src = path.join(SKILLS_ROOT, name);
  try { await installSkill(name, src); }
  catch (e) { console.error(`✗ ${name}: ${e.message}`); }
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    showRoot(); process.exit(0);
  }
  if (argv[0] === 'skill') {
    await handleSkillCmd(argv);
    return;
  }
  const { skill, args } = parseArgs(argv);
  const handler = SKILLS[skill];
  if (!handler) {
    console.error(`Unknown skill: ${skill}\n`);
    showRoot();
    process.exit(1);
  }
  try {
    const out = await handler.run(args);
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
