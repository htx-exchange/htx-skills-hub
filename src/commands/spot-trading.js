// htx-cli spot-trading <subcommand>
// All write ops require --confirm flag OR --dry-run (default = dry-run prints request, doesn't send).
import { signedRequest } from '../client/http.js';

const H = 'api.huobi.pro';
const arg = (a, k, def) => (a.p && a.p[k] !== undefined) ? a.p[k] : (a[k] !== undefined ? a[k] : def);

const handlers = {
  // ===== Read =====
  'open-orders':  (a) => signedRequest(H, 'GET', '/v1/order/openOrders', {
    'account-id': arg(a, 'account-id'),
    symbol:       arg(a, 'symbol'),
    side:         arg(a, 'side'),
    size:         arg(a, 'size', 100),
  }),
  'order-info':   (a) => {
    const id = arg(a, 'order-id') || a._[1];
    if (!id) throw new Error('order-id required');
    return signedRequest(H, 'GET', `/v1/order/orders/${id}`);
  },
  'orders':       (a) => signedRequest(H, 'GET', '/v1/order/orders', {
    symbol: arg(a, 'symbol'),
    states: arg(a, 'states', 'filled,canceled'),
    size:   arg(a, 'size', 100),
  }),
  'matchresults': (a) => signedRequest(H, 'GET', '/v1/order/matchresults', {
    symbol: arg(a, 'symbol'),
    size:   arg(a, 'size', 100),
  }),

  // ===== Write — DRY-RUN by default =====
  'place':        (a) => writeOp(a, 'POST', '/v1/order/orders/place', null, {
    'account-id':       arg(a, 'account-id'),
    symbol:             arg(a, 'symbol'),
    type:               arg(a, 'type'),  // buy-limit / sell-limit / buy-market / sell-market
    amount:             arg(a, 'amount'),
    price:              arg(a, 'price'),
    'client-order-id':  arg(a, 'client-order-id'),
    source:             'spot-api',
  }),
  'cancel':       (a) => {
    const id = arg(a, 'order-id') || a._[1];
    return writeOp(a, 'POST', `/v1/order/orders/${id}/submitcancel`, null, {});
  },
  'cancel-all':   (a) => writeOp(a, 'POST', '/v1/order/orders/batchCancelOpenOrders', null, {
    'account-id': arg(a, 'account-id'),
    symbol:       arg(a, 'symbol'),
  }),
};

async function writeOp(args, method, path, params, body) {
  // Strip undefined fields
  const cleanBody = Object.fromEntries(Object.entries(body).filter(([_, v]) => v !== undefined && v !== ''));
  const dryRun = !args.confirm && !process.env.HTX_CONFIRM_WRITES;
  const description = {
    method, path, body: cleanBody,
    note: dryRun
      ? '⚠️ DRY-RUN: this is what WOULD be sent. Add --confirm to actually execute.'
      : '🔥 LIVE: request was sent to HTX',
    safety: 'AI Agent MUST display this to user and get explicit confirmation before adding --confirm.',
  };
  if (dryRun) return description;
  const result = await signedRequest(H, method, path, params, cleanBody);
  return { ...description, result };
}

export async function run(args) {
  const sub = args._[0];
  const fn = handlers[sub];
  if (!fn) return { usage: 'htx-cli spot-trading <sub>', subcommands: Object.keys(handlers),
    safety: 'All write ops default to DRY-RUN. Pass --confirm only after user explicitly approved.' };
  return fn(args);
}
