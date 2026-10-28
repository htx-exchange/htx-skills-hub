---
name: farmdash-trail-intelligence
description: Read-only DeFi protocol, chain, event, and wallet-risk research using FarmDash.
version: 1.1.0
license: MIT
---

# FarmDash Trail Intelligence

An optional, third-party research skill for DeFi context. It does not connect to an HTX account, use HTX API credentials, place orders, sign transactions, or execute swaps.

## Availability

Use the FarmDash tools only when the user has configured the FarmDash MCP adapter in their agent. The published manifest describes a local stdio server; it is not a remote HTTP MCP endpoint. Follow the current setup guidance at https://www.farmdash.one/agents. If the adapter is not available, say so rather than inventing results.

## Research workflow

1. Clarify the protocols, chains, addresses, or time window the user wants to examine.
2. Use `get_trail_heat` for the current protocol discovery scores and their evidence fields. Treat the score as a heuristic, not a ranking of expected returns.
3. Use `get_chain_breakdown` for descriptive coverage by chain and category.
4. Use `get_agent_events` for reported events; distinguish event data from independently verified facts.
5. Use `get_historical_trailheat` to describe score history and changes. State the requested period and data timestamp.
6. Use `audit_sybil_risk` only to describe reported wallet-risk signals. Do not suggest ways to evade eligibility rules, detection, or platform controls.
7. If using `simulate_points`, label all outputs as hypothetical estimates. Do not present simulated points or USD values as guaranteed rewards, realized returns, or investment advice.
8. Summarize the evidence, uncertainty, data freshness, and important limitations. Do not rank an opportunity as a buy/sell recommendation or add a call to action.

## Output standards

- Separate reported data from interpretation; include the source and observation time when available.
- Explain missing, stale, conflicting, or low-confidence fields instead of filling gaps.
- Do not promise airdrop eligibility, token value, yield, or future performance.
- Do not generate trade instructions or transaction payloads from this research skill. If the user asks about an HTX order, this skill is out of scope; use the relevant HTX tools and their confirmation safeguards.
- Keep the analysis informational and neutral. The user makes all financial decisions.

## References

- FarmDash Agent Hub: https://www.farmdash.one/agents
- OpenAPI contract: https://www.farmdash.one/agents/openapi.yaml
- MCP manifest and tool schemas: https://www.farmdash.one/.well-known/mcp.json