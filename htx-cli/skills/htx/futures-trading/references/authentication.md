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
htx-cli config set-base-url futures https://api.hbdm.com
```

## Permissions

| Permission | Needed for |
|------------|-----------|
| Read | Order / match queries, trigger / TP-SL queries |
| Trade | **Everything in this skill's write operations** |
| Withdraw | Not used — keep disabled |

## IP whitelist

HTX strongly recommends binding each trade-permission key to a specific IP.

## Futures base URL

Default `https://api.hbdm.com`. Override with `htx-cli config set-base-url futures <url>`.
