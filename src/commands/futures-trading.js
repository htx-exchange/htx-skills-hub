// htx-cli futures-trading — most-used subset of ~50 futures endpoints.
// All write ops default DRY-RUN.
import { signedRequest } from '../client/http.js';

const H = 'api.hbdm.vn';
const arg = (a, k, def) => (a.p && a.p[k] !== undefined) ? a.p[k] : (a[k] !== undefined ? a[k] : def);

const handlers = {
  // ===== Read =====
  'open-orders-cross':  (a) => signedRequest(H, 'POST', '/linear-swap-api/v1/swap_cross_openorders', {}, {
    contract_code: arg(a, 'contract_code'),
    page_index:    arg(a, 'page_index', 1),
    page_size:     arg(a, 'page_size', 50),
  }),
  'open-orders-isolated': (a) => signedRequest(H, 'POST', '/linear-swap-api/v1/swap_openorders', {}, {
    contract_code: arg(a, 'contract_code'),
  }),
  'order-info-cross':   (a) => signedRequest(H, 'POST', '/linear-swap-api/v1/swap_cross_order_info', {}, {
    contract_code: arg(a, 'contract_code'),
    order_id:      arg(a, 'order_id'),
  }),
  'matchresults-cross': (a) => signedRequest(H, 'POST', '/linear-swap-api/v1/swap_cross_matchresults', {}, {
    contract_code: arg(a, 'contract_code'),
    page_index:    arg(a, 'page_index', 1),
    page_size:     arg(a, 'page_size', 50),
  }),

  // ===== Write (DRY-RUN by default) =====
  'place-cross':       (a) => writeOp(a, '/linear-swap-api/v1/swap_cross_order', {
    contract_code:    arg(a, 'contract_code'),
    direction:        arg(a, 'direction'),    // buy / sell
    offset:           arg(a, 'offset'),       // open / close
    lever_rate:       Number(arg(a, 'lever_rate', 1)),
    order_price_type: arg(a, 'order_price_type', 'limit'),
    price:            arg(a, 'price'),
    volume:           Number(arg(a, 'volume')),
    client_order_id:  arg(a, 'client_order_id'),
  }),
  'cancel-cross':      (a) => writeOp(a, '/linear-swap-api/v1/swap_cross_cancel', {
    contract_code: arg(a, 'contract_code'),
    order_id:      arg(a, 'order_id'),
  }),
  'cancel-all-cross':  (a) => writeOp(a, '/linear-swap-api/v1/swap_cross_cancelall', {
    contract_code: arg(a, 'contract_code'),
  }),
  'tpsl-cross':        (a) => writeOp(a, '/linear-swap-api/v1/swap_cross_tpsl_order', {
    contract_code:           arg(a, 'contract_code'),
    direction:               arg(a, 'direction'), // sell to close long, buy to close short
    volume:                  Number(arg(a, 'volume')),
    tp_trigger_price:        arg(a, 'tp_trigger_price'),
    tp_order_price:          arg(a, 'tp_order_price'),
    tp_order_price_type:     arg(a, 'tp_order_price_type', 'limit'),
    sl_trigger_price:        arg(a, 'sl_trigger_price'),
    sl_order_price:          arg(a, 'sl_order_price'),
    sl_order_price_type:     arg(a, 'sl_order_price_type', 'limit'),
  }),
  'lightning-close-cross': (a) => writeOp(a, '/linear-swap-api/v1/swap_cross_lightning_close_position', {
    contract_code: arg(a, 'contract_code'),
    direction:     arg(a, 'direction'), // sell to close long, buy to close short
    volume:        arg(a, 'volume'),
  }),
  'switch-leverage':   (a) => writeOp(a, '/linear-swap-api/v1/swap_cross_switch_lever_rate', {
    contract_code: arg(a, 'contract_code'),
    lever_rate:    Number(arg(a, 'lever_rate')),
  }),
};

async function writeOp(args, path, body) {
  const clean = Object.fromEntries(Object.entries(body).filter(([_, v]) => v !== undefined && v !== ''));
  const dryRun = !args.confirm && !process.env.HTX_CONFIRM_WRITES;
  const desc = {
    method: 'POST', path, body: clean,
    note: dryRun
      ? '⚠️ DRY-RUN: this is what WOULD be sent. Add --confirm to actually execute.'
      : '🔥 LIVE: request was sent.',
    safety: '**Futures write ops are HIGH RISK.** AI Agent MUST display: contract / direction / offset / leverage / volume / price / required margin / liquidation risk before user confirmation.',
  };
  if (dryRun) return desc;
  const result = await signedRequest(H, 'POST', path, {}, clean);
  return { ...desc, result };
}

export async function run(args) {
  const sub = args._[0];
  const fn = handlers[sub];
  if (!fn) return { usage: 'htx-cli futures-trading <sub>', subcommands: Object.keys(handlers),
    safety: 'All write ops default to DRY-RUN.' };
  return fn(args);
}
