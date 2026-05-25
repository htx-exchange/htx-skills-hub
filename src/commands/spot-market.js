// htx-cli spot-market <subcommand> — 13 public endpoints
import { getJSON, HOSTS } from '../client/http.js';

const H = HOSTS.spot;

export async function run(args) {
  const sub = args._[0];
  const handler = handlers[sub];
  if (!handler) return showHelp();
  return handler(args);
}

const handlers = {
  'market-detail-merged': async (a) => getJSON(H, '/market/detail/merged', { symbol: a.symbol || a.p?.symbol }),
  'market-detail':        async (a) => getJSON(H, '/market/detail',         { symbol: a.symbol || a.p?.symbol }),
  'tickers':              async ()  => getJSON(H, '/market/tickers'),
  'kline':                async (a) => getJSON(H, '/market/history/kline', {
                                          symbol: a.symbol || a.p?.symbol,
                                          period: a.period || a.p?.period || '1day',
                                          size:   a.size   || a.p?.size   || 150,
                                        }),
  'depth':                async (a) => getJSON(H, '/market/depth', {
                                          symbol: a.symbol || a.p?.symbol,
                                          type:   a.type   || a.p?.type   || 'step0',
                                          depth:  a.depth  || a.p?.depth  || 20,
                                        }),
  'trade':                async (a) => getJSON(H, '/market/trade',         { symbol: a.symbol || a.p?.symbol }),
  'history-trade':        async (a) => getJSON(H, '/market/history/trade', { symbol: a.symbol || a.p?.symbol, size: a.size || 100 }),
  'symbols':              async ()  => getJSON(H, '/v1/common/symbols'),
  'currencys':            async ()  => getJSON(H, '/v1/common/currencys'),
  'currencies-v2':        async ()  => getJSON(H, '/v2/reference/currencies'),
  'market-status':        async ()  => getJSON(H, '/v2/market-status'),
  'timestamp':            async ()  => getJSON(H, '/v1/common/timestamp'),
  'chains':               async ()  => getJSON(H, '/v1/settings/common/chains'),
};

function showHelp() {
  return {
    usage: 'htx-cli spot-market <subcommand> [-p key=value ...]',
    subcommands: Object.keys(handlers),
    examples: [
      'htx-cli spot-market market-detail-merged -p symbol=btcusdt',
      'htx-cli spot-market kline -p symbol=ethusdt -p period=4hour -p size=100',
      'htx-cli spot-market tickers',
    ],
  };
}
