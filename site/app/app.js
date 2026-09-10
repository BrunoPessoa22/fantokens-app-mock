/* FanTokens app mockup runtime: screen routing, list + chart rendering, gallery remote control. */
(function () {
  'use strict';
  var D = window.FT;
  var TABS = ['today', 'markets', 'trade', 'intern', 'league'];
  var PARENT = { token: 'markets', matchday: 'today', article: 'today', alerts: 'today', you: 'today',
                 receipt: 'trade', missions: 'league', onboard: 'today' };

  function icons() { if (window.lucide) window.lucide.createIcons(); }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function money(n) {
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'k';
    return '$' + n.toFixed(0);
  }
  function px(p) {
    if (p >= 1) return '$' + p.toFixed(3);
    if (p >= 0.01) return '$' + p.toFixed(4);
    if (p >= 0.0001) return '$' + p.toFixed(6);
    return '$' + p.toExponential(2);
  }
  function pct(n) { return (n > 0 ? '+' : '') + n.toFixed(2) + '%'; }
  function cls(n) { return n > 0 ? 'up' : (n < 0 ? 'down' : 'muted'); }
  function crest(t, size) {
    var lbl = (D.short && D.short[t.s]) || t.s.slice(0, 3);
    return '<span class="crest ' + (size || '') + '" style="background:' + t.col + '">' + lbl + '</span>';
  }

  /* ---------- screen routing ---------- */
  function show(name) {
    var found = false;
    document.querySelectorAll('[data-screen]').forEach(function (s) {
      var on = s.getAttribute('data-screen') === name;
      s.hidden = !on; if (on) { found = true; s.scrollTop = 0; }
    });
    if (!found) return show('today');
    var tab = PARENT[name] || name;
    document.querySelectorAll('[data-tab]').forEach(function (b) {
      b.setAttribute('data-selected', b.getAttribute('data-tab') === tab ? 'true' : 'false');
    });
    document.body.setAttribute('data-screen', name);
    icons();
  }
  function sheet(open) { var s = document.getElementById('sheet'); if (s) { s.hidden = !open; icons(); } }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab]'); if (t) { show(t.getAttribute('data-tab')); return; }
    var g = e.target.closest('[data-go]'); if (g) { show(g.getAttribute('data-go')); return; }
    if (e.target.closest('[data-open-sheet]')) { sheet(true); return; }
    if (e.target.closest('[data-close-sheet]')) { sheet(false); return; }
    var seg = e.target.closest('[data-seg]');
    if (seg) {
      seg.parentNode.querySelectorAll('[data-seg]').forEach(function (x) { x.setAttribute('data-selected', x === seg ? 'true' : 'false'); });
      if (seg.hasAttribute('data-cat')) { state.cat = seg.getAttribute('data-cat'); renderMarkets(); }
      return;
    }
    var chip = e.target.closest('[data-chip], [data-sort]');
    if (chip) {
      chip.parentNode.querySelectorAll('[data-chip], [data-sort]').forEach(function (x) { x.setAttribute('data-selected', x === chip ? 'true' : 'false'); });
      if (chip.hasAttribute('data-sort')) { state.sort = chip.getAttribute('data-sort'); renderMarkets(); }
      return;
    }
    var cp = e.target.closest('.clubpick');
    if (cp && cp.parentNode.id === 'clubgrid') { cp.setAttribute('data-selected', cp.getAttribute('data-selected') === 'true' ? 'false' : 'true'); }
  });

  window.addEventListener('hashchange', function () { show((location.hash || '').replace('#', '') || 'today'); });
  window.addEventListener('message', function (e) { var d = e.data || {}; if (d.ftScreen) show(d.ftScreen); if (d.ftSheet != null) sheet(!!d.ftSheet); });

  /* ---------- charts ---------- */
  function linePath(vals, w, h, pad) {
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals), rng = (max - min) || 1;
    return vals.map(function (v, i) {
      var x = (i / (vals.length - 1)) * w;
      var y = pad + (1 - (v - min) / rng) * (h - pad * 2);
      return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ');
  }
  function yAt(v, vals, h, pad) {
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals), rng = (max - min) || 1;
    return pad + (1 - (v - min) / rng) * (h - pad * 2);
  }

  function asrChart() {
    var host = document.getElementById('asr-chart'); if (!host) return;
    var v = D.candles.closes, w = 354, h = 156, pad = 10;
    var path = linePath(v, w, h, pad);
    var area = path + ' L' + w + ' ' + h + ' L0 ' + h + ' Z';
    var marks = [{ i: 0.1, l: 'W', t: 'Lecce 0-4' }, { i: 30.7, l: 'W', t: 'Atalanta 2-1' }];
    var m = marks.map(function (k) {
      var x = (k.i / (v.length - 1)) * w;
      return '<line x1="' + x + '" y1="6" x2="' + x + '" y2="' + (h - 16) + '" stroke="rgba(237,237,237,.18)" stroke-width="1"/>' +
        '<circle cx="' + x + '" cy="' + yAt(v[Math.round(k.i)], v, h, pad) + '" r="3.5" fill="#2BE08D"/>' +
        '<text class="axis" x="' + (x + 5) + '" y="14">' + k.t + '</text>';
    }).join('');
    var last = v[v.length - 1];
    host.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="height:156px">' +
      '<defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#CF85FF" stop-opacity=".28"/><stop offset="100%" stop-color="#CF85FF" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#g1)"/>' + m +
      '<path d="' + path + '" fill="none" stroke="#CF85FF" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<line x1="' + (w - 2) + '" y1="6" x2="' + (w - 2) + '" y2="' + (h - 16) + '" stroke="#FF0051" stroke-width="1.5" stroke-dasharray="3 3"/>' +
      '<circle cx="' + (w - 2) + '" cy="' + yAt(last, v, h, pad) + '" r="3.5" fill="#FF0051"/>' +
      '<text class="axis" x="' + (w - 4) + '" y="14" text-anchor="end" fill="#FF7FA3">Kick-off</text>' +
      '</svg>' +
      '<div class="between s12 muted" style="padding:2px 2px 0"><span>31 Aug</span><span>4h candles, 10 days</span><span>today</span></div>';
  }

  function tapeChart() {
    var host = document.getElementById('tape-chart'); if (!host) return;
    var asr = [0, -.05, .1, .05, -.1, -.2, -.15, -.6, -.75, -.7, -.62, -.68, -.55, -.6, -.72, -.8, -.75, -.7, -.65,
      -.72, -.8, -.9, -.85, -.7, -.4, -.25, -.3, -.45, -.6, -.72, -.8, -.9];
    var fb = [0, .05, .15, .25, .8, 1.1, 1.25, 1.4, 1.35, 1.5, 1.45, 1.6, 1.55, 1.7, 1.75, 1.8, 1.9, 1.85, 1.95,
      2.0, 1.9, 1.75, 1.6, 1.5, 1.55, 1.7, 1.8, 1.85, 1.9, 1.85, 1.8, 1.8];
    var all = asr.concat(fb), w = 330, h = 130, pad = 8;
    function p(vals) {
      var min = Math.min.apply(null, all), max = Math.max.apply(null, all), rng = (max - min) || 1;
      return vals.map(function (v, i) {
        var x = (i / (vals.length - 1)) * w, y = pad + (1 - (v - min) / rng) * (h - pad * 2);
        return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }).join(' ');
    }
    var goals = [[4, "12' FEN"], [22, "47' ROM"]].map(function (g) {
      var x = (g[0] / (asr.length - 1)) * w;
      return '<line x1="' + x + '" y1="4" x2="' + x + '" y2="' + h + '" stroke="rgba(237,237,237,.30)" stroke-width="1" stroke-dasharray="2 3"/>' +
        '<text class="tapelabel" x="' + (x + 4) + '" y="13">' + g[1] + '</text>';
    }).join('');
    host.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="height:130px">' + goals +
      '<path d="' + p(fb) + '" fill="none" stroke="#5B86D6" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="' + p(asr) + '" fill="none" stroke="#E0566B" stroke-width="2" stroke-linejoin="round"/></svg>' +
      '<div class="between s12 muted" style="padding:4px 4px 0"><span>Kick-off</span><span>63&#39; and running</span></div>';
  }

  function spark(sym, chg) {
    var seed = 0; for (var i = 0; i < sym.length; i++) seed = (seed * 31 + sym.charCodeAt(i)) % 9973;
    var v = [], x = 0;
    for (var j = 0; j < 16; j++) {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      x += ((seed / 2147483648) - 0.5) * 2 + (chg / 30);
      v.push(x);
    }
    var w = 50, h = 22, min = Math.min.apply(null, v), max = Math.max.apply(null, v), rng = (max - min) || 1;
    var d = v.map(function (p, i) {
      return (i ? 'L' : 'M') + ((i / (v.length - 1)) * w).toFixed(1) + ' ' + (2 + (1 - (p - min) / rng) * (h - 4)).toFixed(1);
    }).join(' ');
    var c = chg > 0 ? '#2BE08D' : (chg < 0 ? '#FF4D7A' : 'rgba(237,237,237,.4)');
    return '<svg class="spark-svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '"><path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  }

  /* ---------- markets ---------- */
  var state = { cat: 'all', sort: 'health' };
  var FLOW = {}; D.rotation.forEach(function (r) { FLOW[r[0]] = r[3]; });
  var POOL = {}; D.pools.forEach(function (p) { POOL[p[0]] = p[2]; });

  function renderMarkets() {
    var host = document.getElementById('mkt-list'); if (!host) return;
    var rows = D.tokens.filter(function (t) { return state.cat === 'all' || t.c === state.cat; });
    rows.sort(function (a, b) {
      if (state.sort === 'chg') return b.ch - a.ch;
      if (state.sort === 'vol') return b.v - a.v;
      if (state.sort === 'flow') return (FLOW[b.s] || -999) - (FLOW[a.s] || -999);
      if (state.sort === 'depth') return (POOL[b.s] || 0) - (POOL[a.s] || 0);
      return b.sc - a.sc;
    });
    host.innerHTML = rows.map(function (t, i) {
      var sub = '<span class="grade g' + t.g + '">' + t.g + '</span>' + t.l;
      if (POOL[t.s]) sub += ' <span class="muted">· pool ' + money(POOL[t.s]) + '</span>';
      if (FLOW[t.s] > 100) sub += ' <span class="up">· flow ' + Math.round(FLOW[t.s]) + '%</span>';
      var right = t.fz
        ? '<span class="pill warn" style="height:20px;font-size:10px">frozen ' + t.fz + 'h</span>'
        : '<span class="ch delta ' + cls(t.ch) + '">' + pct(t.ch) + '</span>';
      return '<div class="trow"' + (t.s === 'ASR' ? ' data-go="token"' : '') + '>' + crest(t) +
        '<div><div class="nm">' + t.t + '</div><div class="sb">' + sub + '</div></div>' +
        '<div>' + (t.fz ? '' : spark(t.s, t.ch)) + '</div>' +
        '<div class="rt"><span class="px num">' + px(t.px) + '</span>' + right + '</div></div>';
    }).join('');
    icons();
  }

  function renderMovers() {
    var host = document.getElementById('movers'); if (!host) return;
    var up = D.tokens.slice().sort(function (a, b) { return b.ch - a.ch; }).slice(0, 3);
    var dn = D.tokens.slice().sort(function (a, b) { return a.ch - b.ch; }).slice(0, 3);
    host.innerHTML = up.concat(dn).map(function (t) {
      return '<button style="height:auto;padding:8px 12px;border-radius:14px;text-align:left">' +
        '<div style="display:flex;gap:7px;align-items:center">' + crest(t, 'sm') +
        '<div><div style="font-size:12px;font-weight:600;color:var(--ink)">' + t.s + '</div>' +
        '<div class="delta ' + cls(t.ch) + '" style="font-size:12.5px">' + pct(t.ch) + '</div></div></div></button>';
    }).join('');
  }

  function renderMatches() {
    var host = document.getElementById('asr-matches'); if (!host) return;
    host.innerHTML = D.matches.map(function (m) {
      var res = m[4], badge = res === 'win' ? 'up' : (res === 'loss' ? 'down' : '');
      return '<div class="card flat" style="margin-bottom:8px"><div class="between">' +
        '<div><div class="s13" style="font-weight:600">' + m[1] + ' <span class="num">' + m[3] + '</span> ' + m[2] + '</div>' +
        '<div class="s12 muted mt6">' + m[0] + ' · <span class="' + badge + '">' + res + '</span></div></div>' +
        '<div style="text-align:right"><div class="delta ' + cls(m[8]) + '">' + pct(m[8]) + '</div>' +
        '<div class="s12 muted">24h window</div></div></div></div>';
    }).join('');
  }

  function renderHoldings() {
    var host = document.getElementById('holdings'); if (!host) return;
    var pos = [['NAP', 3000], ['CHZ', 41208], ['PSG', 1120], ['SANTOS', 800], ['ASR', 199.4]];
    var by = {}; D.tokens.forEach(function (t) { by[t.s] = t; });
    host.innerHTML = '<div class="card" style="padding:4px 14px">' + pos.map(function (p, i) {
      var t = by[p[0]], val = t.px * p[1];
      return '<div class="rowx" style="padding:11px 0' + (i ? ';border-top:1px solid var(--line)' : '') + '">' + crest(t) +
        '<div class="grow"><div class="s13" style="font-weight:600">' + t.t + '</div>' +
        '<div class="s12 muted mt6">' + p[1].toLocaleString() + ' ' + t.s + '</div></div>' +
        '<div style="text-align:right"><div class="num s14">$' + val.toFixed(2) + '</div>' +
        '<div class="delta ' + cls(t.ch) + '" style="font-size:12px">' + pct(t.ch) + '</div></div></div>';
    }).join('') + '</div>';
  }

  function renderClubs() {
    var host = document.getElementById('clubgrid'); if (!host) return;
    var picks = ['ASR', 'NAP', 'PSG', 'BAR', 'CITY', 'GAL', 'FB', 'SANTOS', 'MENGO', 'JUV', 'ACM', 'OG'];
    var by = {}; D.tokens.forEach(function (t) { by[t.s] = t; });
    host.innerHTML = picks.map(function (s, i) {
      var t = by[s];
      return '<div class="clubpick"' + (i < 3 ? ' data-selected="true"' : '') + '>' + crest(t, 'sm') + t.s + '</div>';
    }).join('');
  }

  function potTicker() {
    var n = document.getElementById('pot'); if (!n) return;
    var target = 412500, cur = 402000, step = Math.ceil((target - cur) / 40);
    var id = setInterval(function () {
      cur += step; if (cur >= target) { cur = target; clearInterval(id); }
      n.textContent = cur.toLocaleString();
    }, 28);
  }

  /* ---------- boot ---------- */
  renderMarkets(); renderMovers(); renderMatches(); renderHoldings(); renderClubs();
  asrChart(); tapeChart(); potTicker();
  show((location.hash || '').replace('#', '') || 'today');
  icons();
})();
