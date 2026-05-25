// htx-cli futures-account — 8 read endpoints + unified info (most useful subset of 30)
// Per HTX 2024 update, futures uses unified account API (v3).
import { signedRequest } from '../client/http.js';

const H = 'api.hbdm.vn';
const arg = (a, k, def) => (a.p && a.p[k] !== undefined) ? a.p[k] : (a[k] !== undefined ? a[k] : def);

const handlers = {
  // === Unified account (v3, post-2024) ===
  'unified-info':     ()  => signedRequest(H, 'POST', '/linear-swap-api/v3/unified_account_info', {}, {}),
  'switch-status':    ()  => signedRequest(H, 'POST', '/linear-swap-api/v3/unified_account_switch_status', {}, {}),

  // === Position queries ===
  'position-cross':   (a) => signedRequest(H, 'POST', '/linear-swap-api/v1/swap_cross_position_info', {}, {
    contract_code: arg(a, 'contract_code'),
  }),
  'position-isolated': (a) => signedRequest(H, 'POST', '/linear-swap-api/v1/swap_position_info', {}, {
    contract_code: arg(a, 'contract_code'),
  }),
  'position-limit-cross': () => signedRequest(H, 'POST', '/linear-swap-api/v1/swap_cross_position_limit', {}, {}),
  'position-limit-isolated': () => signedRequest(H, 'POST', '/linear-swap-api/v1/swap_position_limit', {}, {}),

  // === Tier margin / risk ===
  'ladder-margin-cross': (a) => signedRequest(H, 'GET', '/linear-swap-api/v1/swap_cross_ladder_margin', {
    margin_account: arg(a, 'margin_account', 'USDT'),
  }),
  'ladder-margin-isolated': (a) => signedRequest(H, 'GET', '/linear-swap-api/v1/swap_ladder_margin', {
    contract_code: arg(a, 'contract_code'),
  }),

  // === Records ===
  'funding-record':   (a) => signedRequest(H, 'POST', '/linear-swap-api/v1/swap_funding_record', {}, {
    contract_code: arg(a, 'contract_code'),
    page_index: arg(a, 'page_index', 1),
    page_size: arg(a, 'page_size', 50),
  }),
  'user-fee':         (a) => signedRequest(H, 'POST', '/linear-swap-api/v1/swap_user_fee', {}, {
    contract_code: arg(a, 'contract_code'),
  }),
  'api-trading-status': () => signedRequest(H, 'POST', '/linear-swap-api/v1/swap_api_trading_status', {}, {}),
};

export async function run(args) {
  const sub = args._[0];
  const fn = handlers[sub];
  if (!fn) return { usage: 'htx-cli futures-account <sub>', subcommands: Object.keys(handlers) };
  return fn(args);
}
