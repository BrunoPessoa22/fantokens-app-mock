# FanTokens — native app concept

A visual mockup of fantokens.com rebuilt as a native app: newsroom, an AI analyst called
**the Intern** (Fan Token Intel MCP), a trading desk **powered by Kayen**, and the **Trading
League** gamification model from `trading.brunopessoa.com`.

- **Gallery** — https://fantokens.brunopessoa.com (13 interactive screens in phone frames)
- **Prototype** — https://ftapp.brunopessoa.com (same app, full screen, open it on a phone)

## Shape

```
site/index.html        gallery + design notes + idea list
site/app/index.html    the app: 13 screens, one document, hash-routed (#today, #markets, ...)
site/app/app.css       Chiliz brand kit applied to an iOS shell
site/app/app.js        routing, market list, SVG charts, gallery remote (postMessage {ftScreen})
site/app/data.js       the dataset — see below
site/app/frame.css     phone bezel on desktop, full-bleed under 520px
site/assets/fonts/     TT Firs Neue (400/500/600/800/900) + Kallisto Heavy — the FanTokens
                       brand faces, subset to latin + latin-ext. TypeType licensed; internal
                       review only, not for redistribution
```

## Data

Every market number in the mock is real, pulled from the Fan Token Intel MCP on
**10 Sep 2026 between 14:41 and 14:45 UTC**: all 65 tokens (price, 24h, volume, health grade,
percentile), 60 real 4h candles for ASR, 11 completed fixtures with kick-off / full-time / +24h
prices, 85 Chiliz Chain pools, whale prints, capital rotation, market regime, the fixture list
and one real Polymarket odds curve. Editorial copy, the league tables, the portfolio holdings
and the Intern's replies are written for the mock; the full split is on the gallery page.

To refresh: re-run the MCP calls and regenerate `site/app/data.js`.

## Deploy

Coolify, `nginx:alpine`, Dockerfile build pack. Redeploy:

```
curl -X POST -H "Authorization: Bearer $COOLIFY_TOKEN" \
  "https://coolify.brunopessoa.com/api/v1/deploy?uuid=<app_uuid>&force=true"
```

## Local

```
cd site && python3 -m http.server 8099
open http://127.0.0.1:8099/
```
