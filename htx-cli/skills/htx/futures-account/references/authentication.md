# HTX authentication — HMAC-SHA256

## Required parameters

| Param | Value |
|-------|-------|
| `AccessKeyId` | API key id |
| `SignatureMethod` | `HmacSHA256` |
| `SignatureVersion` | `2` |
| `Timestamp` | UTC `YYYY-MM-DDTHH:mm:ss` |
| `Signature` | Base64(HMAC-SHA256(stringToSign, secretKey)) |

## String-to-sign

```
<HTTP_METHOD>\n<host>\n<path>\n<sorted_query_without_Signature>
```

## CLI

```bash
htx-cli config set-key    <AccessKeyId>
htx-cli config set-secret <SecretKey>
htx-cli config show
htx-cli config clear
htx-cli config set-base-url futures <url>
```

## Permissions

| Permission | Needed for |
|------------|-----------|
| Read | All query endpoints in this skill |
| Trade | `swap_master_sub_transfer`, `swap_transfer_inner` |
| Withdraw | **Not used — keep disabled** |

## Futures base URL

Default `https://api.hbdm.com`.

## Isolated vs cross

Futures endpoints are split into two margin modes:

- **Isolated (逐仓)** — plain `/swap_*` paths. Margin scoped per contract.
- **Cross (全仓)** — `/swap_cross_*` paths. Shared pool across contracts.

Use the set matching your account mode. If unsure, query
`/linear-swap-api/v3/swap_unified_account_type` (from the `futures-market` skill).
