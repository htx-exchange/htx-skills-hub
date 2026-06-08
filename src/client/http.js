// HTX HTTP client — public + signed requests
// HTX REST API: https://huobiapi.github.io/docs/

import crypto from 'node:crypto';

// HTX_HOST_SPOT / HTX_HOST_FUTURES env override; default mainland-friendly (.vn / .pro)
const HOSTS = {
  spot:    process.env.HTX_HOST_SPOT    || 'api.huobi.pro',
  futures: process.env.HTX_HOST_FUTURES || 'api.hbdm.vn',
};

export async function getJSON(host, path, params = {}, opts = {}) {
  const url = new URL(`https://${host}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'User-Agent': 'htx-cli/0.1.0' },
    signal: opts.signal,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  return res.json();
}

export async function postJSON(host, path, body = {}, opts = {}) {
  const url = `https://${host}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'htx-cli/0.1.0',
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  return res.json();
}

// HMAC-SHA256 signed request — used for private endpoints (account/trading)
// Reference: https://huobiapi.github.io/docs/spot/v1/cn/#api-2
export async function signedRequest(host, method, path, params = {}, body = null, creds = {}) {
  const accessKey = creds.accessKey || process.env.HTX_ACCESS_KEY;
  const secretKey = creds.secretKey || process.env.HTX_SECRET_KEY;
  if (!accessKey || !secretKey) {
    throw new Error('HTX_ACCESS_KEY and HTX_SECRET_KEY required for private endpoints');
  }
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '');
  const allParams = {
    AccessKeyId: accessKey,
    SignatureMethod: 'HmacSHA256',
    SignatureVersion: 2,
    Timestamp: timestamp,
    ...params,
  };
  const sortedKeys = Object.keys(allParams).sort();
  const queryString = sortedKeys
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join('&');
  const payload = `${method}\n${host}\n${path}\n${queryString}`;
  const signature = crypto.createHmac('sha256', secretKey).update(payload).digest('base64');
  const finalQuery = `${queryString}&Signature=${encodeURIComponent(signature)}`;
  const url = `https://${host}${path}?${finalQuery}`;

  const opts = { method, headers: { 'User-Agent': 'htx-cli/0.1.0' } };
  if (body !== null) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

export { HOSTS };
