// 5 derivatives skills bundled here for brevity. Each exports `run`.
import { getJSON, HOSTS } from '../client/http.js';
const H = HOSTS.futures;

const arg = (a, k, def) => (a.p && a.p[k] !== undefined) ? a.p[k] : (a[k] !== undefined ? a[k] : def);

// ============ oi-tracker (2 endpoints) ============
const oiHandlers = {
  'current': (a) => getJSON(H, '/linear-swap-api/v1/swap_open_interest', { contract_code: arg(a, 'contract_code') }),
  'history': (a) => getJSON(H, '/linear-swap-api/v1/swap_his_open_interest', {
    contract_code: arg(a, 'contract_code'),
    period:        arg(a, 'period', '60min'),
    amount_type:   arg(a, 'amount_type', 2), // 1=张 2=币
    size:          arg(a, 'size', 48),
  }),
};

// ============ elite-positioning (2 endpoints) ============
// period: 5min / 15min / 30min / 60min / 4hour / 12hour / 1day
const eliteHandlers = {
  'account-ratio':  (a) => getJSON(H, '/linear-swap-api/v1/swap_elite_account_ratio', {
    contract_code: arg(a, 'contract_code'),
    period:        arg(a, 'period', '60min'),
  }),
  'position-ratio': (a) => getJSON(H, '/linear-swap-api/v1/swap_elite_position_ratio', {
    contract_code: arg(a, 'contract_code'),
    period:        arg(a, 'period', '60min'),
  }),
};

// ============ liquidation-stream (1 endpoint) ============
const liqHandlers = {
  'recent': (a) => getJSON(H, '/linear-swap-api/v3/swap_liquidation_orders', {
    contract: arg(a, 'contract'),
    trade_type: arg(a, 'trade_type', 0), // 0=ALL 1=买入开多被强平 2=卖出开空被强平 3=买入平空被强平 4=卖出平多被强平
    pair: arg(a, 'pair'),
  }),
};

// ============ mark-price (3 endpoints) ============
const markHandlers = {
  'mark-price-kline': (a) => getJSON(H, '/index/market/history/linear_swap_mark_price_kline', {
    contract_code: arg(a, 'contract_code'),
    period:        arg(a, 'period', '60min'),
    size:          arg(a, 'size', 150),
  }),
  'premium-kline':    (a) => getJSON(H, '/index/market/history/linear_swap_premium_index_kline', {
    contract_code: arg(a, 'contract_code'),
    period:        arg(a, 'period', '60min'),
    size:          arg(a, 'size', 150),
  }),
  'basis':            (a) => getJSON(H, '/index/market/history/linear_swap_basis', {
    contract_code: arg(a, 'contract_code'),
    period:        arg(a, 'period', '60min'),
    basis_price_type: arg(a, 'basis_price_type', 'open'),
    size:          arg(a, 'size', 150),
  }),
};

// ============ settlement (4 endpoints) ============
// HTX renamed insurance fund endpoint; using settlement_records (public) +
// estimated_settlement_price + adjustfactor + insurance_fund (post-only)
const setHandlers = {
  'estimated-price':         (a) => getJSON(H, '/linear-swap-api/v1/swap_estimated_settlement_price', {
    contract_code: arg(a, 'contract_code'),
  }),
  'history':                 (a) => getJSON(H, '/linear-swap-api/v1/swap_settlement_records', {
    contract_code: arg(a, 'contract_code'),
    start_time: arg(a, 'start_time'),
    end_time:   arg(a, 'end_time'),
    page_index: arg(a, 'page_index', 1),
    page_size:  arg(a, 'page_size', 50),
  }),
  'adjustfactor':            (a) => getJSON(H, '/linear-swap-api/v1/swap_adjustfactor', {
    contract_code: arg(a, 'contract_code'),
  }),
  'insurance-fund':          (a) => getJSON(H, '/linear-swap-api/v1/swap_insurance_fund', {
    contract_code: arg(a, 'contract_code'),
  }),
};

const buildRun = (handlers, name) => async (args) => {
  const sub = args._[0];
  const fn = handlers[sub];
  if (!fn) return { usage: `htx-cli ${name} <sub>`, subcommands: Object.keys(handlers) };
  return fn(args);
};

export const oiTracker          = { run: buildRun(oiHandlers, 'oi-tracker') };
export const elitePositioning   = { run: buildRun(eliteHandlers, 'elite-positioning') };
export const liquidationStream  = { run: buildRun(liqHandlers, 'liquidation-stream') };
export const markPrice          = { run: buildRun(markHandlers, 'mark-price') };
export const settlement         = { run: buildRun(setHandlers, 'settlement') };
