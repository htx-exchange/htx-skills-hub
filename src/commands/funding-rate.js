// htx-cli funding-rate <subcommand> — 4 endpoints
import { getJSON, HOSTS } from '../client/http.js';

const H = HOSTS.futures;

const handlers = {
  'current':         (a) => getJSON(H, '/linear-swap-api/v1/swap_funding_rate', { contract_code: arg(a, 'contract_code') }),
  'batch':           ()  => getJSON(H, '/linear-swap-api/v1/swap_batch_funding_rate'),
  'history':         (a) => getJSON(H, '/linear-swap-api/v1/swap_historical_funding_rate', {
                              contract_code: arg(a, 'contract_code'),
                              page_index:    arg(a, 'page_index', 1),
                              page_size:     arg(a, 'page_size', 50),
                            }),
  'estimated-kline': (a) => getJSON(H, '/linear-swap-ex/market/history/funding_rate', {
                              contract_code: arg(a, 'contract_code'),
                              period:        arg(a, 'period', '1day'),
                              size:          arg(a, 'size', 100),
                            }),
};

export async function run(args) {
  const sub = args._[0];
  const fn = handlers[sub];
  if (!fn) return { usage: 'htx-cli funding-rate <sub>', subcommands: Object.keys(handlers) };
  return fn(args);
}

function arg(a, k, def) {
  if (a.p && a.p[k] !== undefined) return a.p[k];
  if (a[k] !== undefined) return a[k];
  return def;
}
