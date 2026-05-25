// htx-cli spot-account <subcommand> — 10 endpoints (5 read + 5 write/transfer)
// All endpoints require API Key. Transfers MUST require explicit user confirmation in caller.
import { signedRequest } from '../client/http.js';

const H = 'api.huobi.pro';
const arg = (a, k, def) => (a.p && a.p[k] !== undefined) ? a.p[k] : (a[k] !== undefined ? a[k] : def);

const handlers = {
  // ===== Read (5) =====
  'list':              ()  => signedRequest(H, 'GET', '/v1/account/accounts'),
  'balance':           (a) => {
    const id = arg(a, 'id') || a._[1];
    if (!id) throw new Error('Usage: spot-account balance <account-id> | -p id=<id>');
    return signedRequest(H, 'GET', `/v1/account/accounts/${id}/balance`);
  },
  'valuation':         (a) => signedRequest(H, 'GET', '/v2/account/asset-valuation', {
    accountType: arg(a, 'accountType', 'spot'),
    valuationCurrency: arg(a, 'currency', 'USD'),
  }),
  'history':           (a) => signedRequest(H, 'GET', '/v1/account/history', {
    'account-id': arg(a, 'account-id'),
    currency: arg(a, 'currency'),
    'transact-types': arg(a, 'transact-types'),
    size: arg(a, 'size', 100),
  }),
  'deposit-withdraw':  (a) => signedRequest(H, 'GET', '/v1/query/deposit-withdraw', {
    type: arg(a, 'type', 'deposit'),
    currency: arg(a, 'currency'),
    size: arg(a, 'size', 100),
  }),

  // ===== Write — transfers (5). Caller MUST confirm with user before invoking. =====
  'transfer-internal': (a) => {
    requireConfirm(a, 'transfer-internal');
    return signedRequest(H, 'POST', '/v1/account/transfer', {}, {
      'from-account-id': arg(a, 'from'),
      'to-account-id':   arg(a, 'to'),
      currency:          arg(a, 'currency'),
      amount:            arg(a, 'amount'),
    });
  },
  'transfer-coinm':    (a) => {
    requireConfirm(a, 'transfer-coinm');
    return signedRequest(H, 'POST', '/v1/futures/transfer', {}, {
      currency: arg(a, 'currency'),
      amount:   arg(a, 'amount'),
      type:     arg(a, 'type'), // pro-to-futures | futures-to-pro
    });
  },
  'transfer-usdt':     (a) => {
    requireConfirm(a, 'transfer-usdt');
    return signedRequest(H, 'POST', '/v2/account/transfer', {}, {
      from:             arg(a, 'from', 'spot'),
      to:               arg(a, 'to', 'linear-swap'),
      currency:         arg(a, 'currency', 'usdt'),
      amount:           arg(a, 'amount'),
      'margin-account': arg(a, 'margin-account', 'USDT'),
    });
  },
  'point-balance':     ()  => signedRequest(H, 'GET', '/v1/point/account'),
  'point-transfer':    (a) => {
    requireConfirm(a, 'point-transfer');
    return signedRequest(H, 'POST', '/v1/point/transfer', {}, {
      fromUid: arg(a, 'fromUid'),
      toUid:   arg(a, 'toUid'),
      amount:  arg(a, 'amount'),
    });
  },
};

function requireConfirm(args, op) {
  if (!args.confirm && !process.env.HTX_CONFIRM_WRITES) {
    throw new Error(
      `Write operation '${op}' requires explicit confirmation.\n` +
      `Add --confirm flag, or set HTX_CONFIRM_WRITES=1 env var.\n` +
      `Caller (AI Agent) MUST display all params to user and get human confirmation first.`
    );
  }
}

export async function run(args) {
  const sub = args._[0];
  const fn = handlers[sub];
  if (!fn) return { usage: 'htx-cli spot-account <sub>', subcommands: Object.keys(handlers) };
  return fn(args);
}
