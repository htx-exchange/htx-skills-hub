# HTX authentication — HMAC-SHA256

All private endpoints (account, trading, transfer) require a signature over the request.

## Required parameters (appended to the query string)

| Param | Value |
|-------|-------|
| `AccessKeyId` | Your API key id |
| `SignatureMethod` | `HmacSHA256` |
| `SignatureVersion` | `2` |
| `Timestamp` | UTC timestamp `YYYY-MM-DDTHH:mm:ss` |
| `Signature` | Base64(HMAC-SHA256(stringToSign, secretKey)) |

## String-to-sign format

```
<HTTP_METHOD>\n
<HOST>\n
<PATH>\n
<sorted_query_string_without_Signature>
```

- `HTTP_METHOD` is uppercase (`GET`, `POST`).
- `HOST` is lowercase, no scheme, no port (e.g. `api.huobi.pro`).
- `PATH` starts with `/` (e.g. `/v1/account/accounts`).
- Query parameters are URL-encoded and **sorted alphabetically by key**. Exclude the `Signature` parameter itself.

## The CLI handles all of this for you

```bash
htx-cli config set-key    <AccessKeyId>
htx-cli config set-secret <SecretKey>
htx-cli config show        # secret is redacted
htx-cli config clear       # wipe stored credentials
```

Once configured, every authenticated subcommand (`spot account ...`, `spot order ...`, `futures account ...`, `futures order ...`) signs requests automatically.

## Key permission levels

| Permission | Needed for |
|------------|-----------|
| Read | `/account/*` queries, order queries, balance / position reads |
| Trade | Order placement, cancel, transfers, strategy orders |
| Withdraw | **Not used by these skills** |

Create API keys in the HTX web console. **Disable "withdraw"** unless you absolutely need it.

## IP whitelist

HTX recommends binding each API key to a specific IP. If you run this CLI from a stable host, add its public IP to the key's allowlist to reduce the blast radius of a leaked secret.

## Base URLs

Default is `https://api.huobi.pro`. Override with:

```bash
htx-cli config set-base-url <market> <url>
```

Valid `<market>` values: `spot`, `futures`.
