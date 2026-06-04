# HTX authentication — HMAC-SHA256

All private endpoints require a signature.

## Required parameters

| Param | Value |
|-------|-------|
| `AccessKeyId` | Your API key id |
| `SignatureMethod` | `HmacSHA256` |
| `SignatureVersion` | `2` |
| `Timestamp` | UTC `YYYY-MM-DDTHH:mm:ss` |
| `Signature` | Base64(HMAC-SHA256(stringToSign, secretKey)) |

## String-to-sign

```
<HTTP_METHOD>\n<host>\n<path>\n<sorted_query_without_Signature>
```

Uppercase method, lowercase host, sorted URL-encoded query string.

## CLI

```bash
htx-cli config set-key    <AccessKeyId>
htx-cli config set-secret <SecretKey>
htx-cli config show
htx-cli config clear
```

## Permissions

| Permission | Needed for |
|------------|-----------|
| Read | Order / match queries, margin balance |
| Trade | Order place / cancel, batch cancel |
| Margin | Margin borrow / repay |
| Withdraw | **Not used — keep disabled** |

## Base URL

Default `https://api.huobi.pro`. Override:

```bash
htx-cli config set-base-url spot <url>
```
