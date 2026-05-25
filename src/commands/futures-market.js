// htx-cli futures-market <subcommand> — 15 public endpoints (USDT-M perpetual)
import { getJSON, HOSTS } from '../client/http.js';

const H = HOSTS.futures;

const handlers = {
  'detail-merged':        (a) => getJSON(H, '/linear-swap-ex/market/detail/merged', { contract_code: arg(a, 'contract_code') }),
  'detail-batch-merged':  (a) => getJSON(H, '/linear-swap-ex/market/detail/batch_merged', { business_type: arg(a, 'business_type', 'swap') }),
  'kline':                (a) => getJSON(H, '/linear-swap-ex/market/history/kline', {
                                    contract_code: arg(a, 'contract_code'),
                                    period:        arg(a, 'period', '60min'),
                                    size:          arg(a, 'size', 150),
                                  }),
  'depth':                (a) => getJSON(H, '/linear-swap-ex/market/depth', {
                                    contract_code: arg(a, 'contract_code'),
                                    type:          arg(a, 'type', 'step0'),
                                  }),
  'bbo':                  (a) => getJSON(H, '/linear-swap-ex/market/bbo', { contract_code: arg(a, 'contract_code') }),
  'trade':                (a) => getJSON(H, '/linear-swap-ex/market/trade', { contract_code: arg(a, 'contract_code') }),
  'history-trade':        (a) => getJSON(H, '/linear-swap-ex/market/history/trade', { contract_code: arg(a, 'contract_code'), size: arg(a, 'size', 100) }),
  'index-price':          (a) => getJSON(H, '/linear-swap-api/v1/swap_index', { contract_code: arg(a, 'contract_code') }),
  'contract-info':        (a) => getJSON(H, '/linear-swap-api/v1/swap_contract_info', a.contract_code ? { contract_code: a.contract_code } : {}),
  'query-elements':       (a) => getJSON(H, '/linear-swap-api/v1/swap_query_elements', { contract_code: arg(a, 'contract_code') }),
  'risk-info':            ()  => getJSON(H, '/linear-swap-api/v1/swap_risk_info'),
  'funding-rate-cap':     (a) => getJSON(H, '/linear-swap-api/v1/swap_funding_rate_cap_info', { contract_code: arg(a, 'contract_code') }),
  'timestamp':            ()  => getJSON(H, '/api/v1/timestamp'),
  'heartbeat':            ()  => getJSON(H, '/heartbeat/'),
  'transfer-state':       ()  => getJSON(H, '/linear-swap-api/v1/swap_transfer_state'),
};

export async function run(args) {
  const sub = args._[0];
  const fn = handlers[sub];
  if (!fn) return { usage: 'htx-cli futures-market <sub>', subcommands: Object.keys(handlers) };
  return fn(args);
}

function arg(a, k, def) {
  if (a.p && a.p[k] !== undefined) return a.p[k];
  if (a[k] !== undefined) return a[k];
  return def;
}
