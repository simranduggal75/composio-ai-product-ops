#!/usr/bin/env node
// Regenerates site/index.html from data/apps.json + analysis/patterns.json + analysis/verification.json.
// Run: node scripts/build_site.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const apps = JSON.parse(fs.readFileSync(path.join(root, 'data/apps.json'), 'utf8'));
const patterns = JSON.parse(fs.readFileSync(path.join(root, 'analysis/patterns.json'), 'utf8'));
const verification = JSON.parse(fs.readFileSync(path.join(root, 'analysis/verification.json'), 'utf8'));

const CATEGORY_ORDER = [
  'CRM and Sales', 'Support and Helpdesk', 'Communications and Messaging',
  'Marketing, Ads, Email and Social', 'Ecommerce', 'Data, SEO and Scraping',
  'Developer, Infra and Data platforms', 'Productivity and Project Management',
  'Finance and Fintech', 'AI, Research and Media-native'
];

const html = `<!doctype html>
<title>The Buildability Map</title>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{
  --bg:#F2F5F3; --surface:#FFFFFF; --surface-sunken:#E7EDEA;
  --ink:#16211D; --ink-soft:#48564F; --ink-faint:#7C8B83;
  --line:#D7DFDA;
  --accent:#1E7566; --accent-ink:#FFFFFF; --accent-soft:#E1F1EC;
  --gold:#9C6B1E;
  --good:#2F8F5B; --good-soft:#E4F3EA;
  --warn:#B8862E; --warn-soft:#F8EFDC;
  --bad:#B0473F; --bad-soft:#F8E6E3;
  --shadow:0 1px 2px rgba(20,30,26,.06), 0 8px 24px -12px rgba(20,30,26,.18);
  --font-display:"Iowan Old Style","Palatino Linotype",Palatino,"URW Palladio L",Georgia,serif;
  --font-body:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --font-mono:ui-monospace,"SFMono-Regular",Menlo,Consolas,"Liberation Mono",monospace;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#0F1815; --surface:#15201B; --surface-sunken:#0F1815;
    --ink:#E9F1EC; --ink-soft:#AEC1B8; --ink-faint:#7C9089;
    --line:#26352E;
    --accent:#49BBA4; --accent-ink:#06251F; --accent-soft:rgba(73,187,164,.14);
    --gold:#D7A94B;
    --good:#57B87F; --good-soft:rgba(87,184,127,.14);
    --warn:#D7A94B; --warn-soft:rgba(215,169,75,.14);
    --bad:#DD7A70; --bad-soft:rgba(221,122,112,.14);
    --shadow:0 1px 2px rgba(0,0,0,.3), 0 12px 32px -16px rgba(0,0,0,.55);
  }
}
:root[data-theme="dark"]{
  --bg:#0F1815; --surface:#15201B; --surface-sunken:#0F1815;
  --ink:#E9F1EC; --ink-soft:#AEC1B8; --ink-faint:#7C9089;
  --line:#26352E;
  --accent:#49BBA4; --accent-ink:#06251F; --accent-soft:rgba(73,187,164,.14);
  --gold:#D7A94B;
  --good:#57B87F; --good-soft:rgba(87,184,127,.14);
  --warn:#D7A94B; --warn-soft:rgba(215,169,75,.14);
  --bad:#DD7A70; --bad-soft:rgba(221,122,112,.14);
  --shadow:0 1px 2px rgba(0,0,0,.3), 0 12px 32px -16px rgba(0,0,0,.55);
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0; background:var(--bg); color:var(--ink); font-family:var(--font-body);
  font-size:16px; line-height:1.5; -webkit-font-smoothing:antialiased;
}
::selection{background:var(--accent-soft)}
a{color:var(--accent)}
.wrap{max-width:1180px; margin:0 auto; padding:0 28px}
.eyebrow{
  font-family:var(--font-mono); font-size:12px; letter-spacing:.09em; text-transform:uppercase;
  color:var(--accent); font-weight:600;
}
h1,h2,h3{font-family:var(--font-display); font-weight:600; text-wrap:balance; margin:0}
h1{font-size:clamp(2.1rem,4.2vw,3.4rem); line-height:1.06; letter-spacing:-.01em}
h2{font-size:clamp(1.5rem,2.6vw,2.1rem); line-height:1.15}
h3{font-size:1.15rem}
p{margin:0}
.lede{font-size:1.15rem; color:var(--ink-soft); max-width:62ch; text-wrap:pretty}

/* ===== HERO ===== */
.hero{
  padding:64px 0 44px; border-bottom:1px solid var(--line);
  background:
    radial-gradient(1100px 420px at 82% -10%, var(--accent-soft), transparent 60%),
    var(--bg);
}
.hero-top{display:flex; justify-content:space-between; align-items:baseline; gap:16px; flex-wrap:wrap; margin-bottom:22px}
.hero h1{margin:14px 0 16px}
.hero-links{display:flex; gap:18px; font-family:var(--font-mono); font-size:13px}
.hero-links a{text-decoration:none; border-bottom:1px solid currentColor; padding-bottom:1px}
.stat-row{display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:var(--line); border:1px solid var(--line); border-radius:12px; overflow:hidden; margin-top:36px}
.stat{background:var(--surface); padding:20px 22px}
.stat b{display:block; font-family:var(--font-display); font-size:2.1rem; font-variant-numeric:tabular-nums; letter-spacing:-.01em}
.stat span{display:block; margin-top:4px; font-size:.82rem; color:var(--ink-faint)}

/* ===== SECTION SHELL ===== */
section{padding:56px 0}
section + section{border-top:1px solid var(--line)}
.section-head{display:flex; justify-content:space-between; align-items:flex-end; gap:24px; margin-bottom:28px; flex-wrap:wrap}
.section-num{font-family:var(--font-mono); font-size:12px; color:var(--ink-faint)}

/* ===== PATTERN CARDS ===== */
.pattern-grid{display:grid; grid-template-columns:1.15fr .85fr; gap:20px}
@media (max-width:860px){.pattern-grid{grid-template-columns:1fr}}
.card{background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:24px 26px; box-shadow:var(--shadow)}
.headline-finding{font-family:var(--font-display); font-size:1.3rem; line-height:1.4; margin-bottom:10px}
.headline-finding em{color:var(--accent); font-style:normal; font-weight:600}
.bars{display:flex; flex-direction:column; gap:14px; margin-top:18px}
.bar-row{display:grid; grid-template-columns:190px 1fr 90px; align-items:center; gap:12px; font-size:.86rem}
.bar-label{color:var(--ink-soft); white-space:nowrap; overflow:hidden; text-overflow:ellipsis}
.bar-track{height:22px; border-radius:6px; background:var(--surface-sunken); display:flex; overflow:hidden}
.bar-seg{height:100%}
.bar-seg.self{background:var(--good)}
.bar-seg.mixed{background:var(--warn)}
.bar-seg.gated{background:var(--bad)}
.bar-count{font-family:var(--font-mono); font-size:.78rem; color:var(--ink-faint); text-align:right}
.legend{display:flex; gap:18px; margin-top:16px; font-size:.8rem; color:var(--ink-soft)}
.legend i{display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:6px; vertical-align:-1px}
.legend .self i{background:var(--good)} .legend .mixed i{background:var(--warn)} .legend .gated i{background:var(--bad)}

.donut-card{display:flex; flex-direction:column; gap:18px}
.mini-stat-list{display:flex; flex-direction:column; gap:12px}
.mini-stat{display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px dashed var(--line)}
.mini-stat:last-child{border-bottom:none}
.mini-stat .k{color:var(--ink-soft); font-size:.9rem}
.mini-stat .v{font-family:var(--font-mono); font-weight:600; font-variant-numeric:tabular-nums}

.blocker-list{list-style:none; margin:18px 0 0; padding:0; display:flex; flex-direction:column; gap:10px}
.blocker-list li{display:flex; justify-content:space-between; gap:14px; font-size:.88rem; padding:9px 0; border-bottom:1px dashed var(--line)}
.blocker-list li:last-child{border-bottom:none}
.blocker-list .theme{color:var(--ink)}
.blocker-list .n{font-family:var(--font-mono); color:var(--gold); font-weight:600}

/* ===== TABLE / MATRIX ===== */
.controls{display:flex; gap:10px; flex-wrap:wrap; margin-bottom:18px; align-items:center}
.controls input[type=search]{
  flex:1; min-width:200px; padding:10px 14px; border-radius:8px; border:1px solid var(--line);
  background:var(--surface); color:var(--ink); font-family:var(--font-body); font-size:.92rem;
}
.controls input[type=search]:focus{outline:2px solid var(--accent); outline-offset:1px}
select{
  padding:10px 12px; border-radius:8px; border:1px solid var(--line); background:var(--surface); color:var(--ink);
  font-family:var(--font-body); font-size:.85rem;
}
.count-note{font-family:var(--font-mono); font-size:.78rem; color:var(--ink-faint); margin-left:auto}
.table-scroll{overflow-x:auto; border:1px solid var(--line); border-radius:14px; background:var(--surface)}
table{border-collapse:collapse; width:100%; min-width:980px; font-size:.87rem}
thead th{
  position:sticky; top:0; background:var(--surface-sunken); text-align:left; padding:11px 14px;
  font-family:var(--font-mono); font-size:.72rem; text-transform:uppercase; letter-spacing:.06em; color:var(--ink-faint);
  border-bottom:1px solid var(--line); cursor:pointer; user-select:none; white-space:nowrap;
}
thead th:hover{color:var(--accent)}
tbody td{padding:11px 14px; border-bottom:1px solid var(--line); vertical-align:top}
tbody tr:last-child td{border-bottom:none}
tbody tr:hover{background:var(--surface-sunken)}
.app-name{font-weight:600}
.app-cat{display:block; font-size:.75rem; color:var(--ink-faint); margin-top:1px}
.chip{
  display:inline-block; padding:2px 9px; border-radius:99px; font-size:.72rem; font-weight:600;
  font-family:var(--font-mono); white-space:nowrap;
}
.chip.buildable{background:var(--good-soft); color:var(--good)}
.chip.partial{background:var(--warn-soft); color:var(--warn)}
.chip.blocked{background:var(--bad-soft); color:var(--bad)}
.chip.self-serve{background:var(--good-soft); color:var(--good)}
.chip.gated{background:var(--bad-soft); color:var(--bad)}
.chip.mixed{background:var(--warn-soft); color:var(--warn)}
.mcp-tag{font-family:var(--font-mono); font-size:.76rem}
.mcp-tag.official{color:var(--accent); font-weight:600}
.mcp-tag.community{color:var(--ink-soft)}
.mcp-tag.no{color:var(--ink-faint)}
.evidence-link{font-family:var(--font-mono); font-size:.76rem; text-decoration:none; white-space:nowrap}
.evidence-link:after{content:" ↗"}
.conf{font-size:.72rem; color:var(--ink-faint); display:block; margin-top:2px; font-family:var(--font-mono)}

/* ===== AGENT / PROCESS ===== */
.process{display:flex; flex-direction:column; gap:0; counter-reset:step}
.step{display:grid; grid-template-columns:52px 1fr; gap:20px; padding:22px 0; border-bottom:1px solid var(--line)}
.step:last-child{border-bottom:none}
.step-num{
  font-family:var(--font-display); font-size:1.5rem; color:var(--accent); font-weight:600;
}
.step h3{margin-bottom:6px}
.step p{color:var(--ink-soft); font-size:.94rem; max-width:70ch}
.human-tag{
  display:inline-flex; align-items:center; gap:6px; margin-top:10px; padding:4px 10px; border-radius:99px;
  background:var(--warn-soft); color:var(--warn); font-family:var(--font-mono); font-size:.74rem; font-weight:600;
}

/* ===== VERIFICATION ===== */
.verify-summary{display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:24px}
@media (max-width:700px){.verify-summary{grid-template-columns:1fr}}
.verify-stat{background:var(--surface); border:1px solid var(--line); border-radius:12px; padding:18px 20px}
.verify-stat b{font-family:var(--font-display); font-size:1.8rem; display:block}
.verify-stat.before b{color:var(--warn)}
.verify-stat.after b{color:var(--good)}
.verify-stat span{font-size:.82rem; color:var(--ink-faint)}
.check-table{width:100%; border-collapse:collapse; font-size:.87rem}
.check-table th{text-align:left; font-family:var(--font-mono); font-size:.72rem; text-transform:uppercase; letter-spacing:.05em; color:var(--ink-faint); padding:8px 12px; border-bottom:1px solid var(--line)}
.check-table td{padding:10px 12px; border-bottom:1px solid var(--line); vertical-align:top}
.check-table tr:last-child td{border-bottom:none}
.result-tag{font-family:var(--font-mono); font-size:.76rem; font-weight:600; padding:2px 8px; border-radius:99px}
.result-tag.match{background:var(--good-soft); color:var(--good)}
.result-tag.miss{background:var(--bad-soft); color:var(--bad)}
.caveat{margin-top:22px; padding:16px 18px; border-left:3px solid var(--gold); background:var(--surface); border-radius:0 8px 8px 0; font-size:.9rem; color:var(--ink-soft)}

footer{padding:44px 0 60px; border-top:1px solid var(--line)}
.foot-grid{display:flex; justify-content:space-between; gap:24px; flex-wrap:wrap; align-items:flex-start}
.foot-grid .col{font-size:.85rem; color:var(--ink-soft); max-width:44ch}
.foot-grid .col a{display:block; margin-top:6px}

@media (max-width:700px){
  .stat-row{grid-template-columns:1fr 1fr}
  .bar-row{grid-template-columns:110px 1fr 60px}
}
</style>

<header class="hero">
  <div class="wrap">
    <div class="hero-top">
      <span class="eyebrow">Composio · AI Product Ops Take-Home</span>
      <nav class="hero-links">
        <a href="#the-hundred">The 100</a>
        <a href="#the-agent">The Agent</a>
        <a href="#verification">Verification</a>
      </nav>
    </div>
    <h1>Most of the internet is buildable&nbsp;today.<br>The blockers cluster in three predictable places.</h1>
    <p class="lede">100 apps, researched for AI-agent buildability: auth, self-serve access, API surface, and whether an agent could call them today. Built by a 10-way parallel research pipeline, then hand-verified.</p>
    <div class="stat-row">
      <div class="stat"><b>${patterns.headline.buildableTodayPct}%</b><span>buildable today, no blocker</span></div>
      <div class="stat"><b>${patterns.headline.selfServePct}%</b><span>self-serve dev credentials</span></div>
      <div class="stat"><b>${patterns.headline.anyMcpPct}%</b><span>have some MCP server (official or community)</span></div>
      <div class="stat"><b>${patterns.headline.composioExistingCount}</b><span>of 100 already have a Composio toolkit</span></div>
    </div>
  </div>
</header>

<section id="patterns">
  <div class="wrap">
    <div class="section-head">
      <div><span class="section-num">01 · The Patterns</span><h2>What actually determines buildability</h2></div>
    </div>
    <div class="pattern-grid">
      <div class="card">
        <p class="headline-finding">Self-serve access tracks <em>whether the vendor was built API-first</em>, not company size or fame. Developer-infra tools (GitHub, Cloudflare, Supabase…) are ${patterns.byCategory['Developer, Infra and Data platforms'].self}/10 self-serve; ad platforms and enterprise CRM/finance tools are the most gated categories.</p>
        <div class="bars">
          ${CATEGORY_ORDER.map(cat=>{
            const c = patterns.byCategory[cat];
            const selfPct = 100*c.self/c.total, mixedPct = 100*c.mixed/c.total, gatedPct = 100*c.gated/c.total;
            return `<div class="bar-row">
              <span class="bar-label">${cat}</span>
              <span class="bar-track">
                <span class="bar-seg self" style="width:${selfPct}%"></span>
                <span class="bar-seg mixed" style="width:${mixedPct}%"></span>
                <span class="bar-seg gated" style="width:${gatedPct}%"></span>
              </span>
              <span class="bar-count">${c.self}/${c.total} self-serve</span>
            </div>`;
          }).join('')}
        </div>
        <div class="legend">
          <span class="self"><i></i>Self-serve</span>
          <span class="mixed"><i></i>Mixed</span>
          <span class="gated"><i></i>Gated</span>
        </div>
      </div>
      <div class="card donut-card">
        <h3>Where the blockers actually are</h3>
        <ul class="blocker-list">
          ${Object.entries(patterns.blockerThemes).sort((a,b)=>b[1]-a[1]).map(([theme,n])=>`<li><span class="theme">${theme}</span><span class="n">${n}</span></li>`).join('')}
        </ul>
        <h3 style="margin-top:8px">Auth, at a glance</h3>
        <div class="mini-stat-list">
          <div class="mini-stat"><span class="k">Apps offering OAuth2 (alone or combined)</span><span class="v">${patterns.headline.anyOAuthPct}%</span></div>
          <div class="mini-stat"><span class="k">Apps offering a plain API key</span><span class="v">${patterns.headline.anyApiKeyPct}%</span></div>
          <div class="mini-stat"><span class="k">Official, vendor-hosted MCP server</span><span class="v">${patterns.headline.officialMcpPct}%</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="the-hundred">
  <div class="wrap">
    <div class="section-head">
      <div><span class="section-num">02 · The Findings</span><h2>All 100 apps, one matrix</h2></div>
    </div>
    <div class="controls">
      <input type="search" id="search" placeholder="Search app name…" aria-label="Search apps">
      <select id="catFilter" aria-label="Filter by category"><option value="">All categories</option></select>
      <select id="verdictFilter" aria-label="Filter by verdict">
        <option value="">All verdicts</option>
        <option value="buildable today">Buildable today</option>
        <option value="partial">Partial</option>
        <option value="blocked">Blocked</option>
      </select>
      <span class="count-note" id="countNote"></span>
    </div>
    <div class="table-scroll">
      <table id="appsTable">
        <thead>
          <tr>
            <th data-key="id">#</th>
            <th data-key="name">App</th>
            <th data-key="auth_methods">Auth</th>
            <th data-key="self_serve">Access</th>
            <th data-key="api_surface">API surface</th>
            <th data-key="mcp_exists">MCP</th>
            <th data-key="buildability_verdict">Verdict</th>
            <th data-key="evidence">Evidence</th>
          </tr>
        </thead>
        <tbody id="appsBody"></tbody>
      </table>
    </div>
  </div>
</section>

<section id="the-agent">
  <div class="wrap">
    <div class="section-head">
      <div><span class="section-num">03 · The Agent</span><h2>How this dataset actually got made</h2></div>
    </div>
    <div class="process">
      <div class="step">
        <span class="step-num">01</span>
        <div><h3>Fan out: 10 parallel research agents</h3>
        <p>The 100 apps were split by the assignment's own 10 categories. Each agent got a self-contained brief: a fixed schema (auth, self-serve status, API surface, MCP existence, buildability verdict, evidence URL, confidence), the 10 apps in its category, and a hard rule: no claim without a URL actually seen. Each agent used live web search and page fetches against current vendor docs, then wrote its findings straight to a structured JSON file.</p></div>
      </div>
      <div class="step">
        <span class="step-num">02</span>
        <div><h3>Merge and compute</h3>
        <p>A small script merges the 10 JSON files into one dataset and computes the category breakdowns, auth distribution, and blocker clustering shown above, mechanically, not by prose summary, so the patterns section can't drift from the underlying data.</p>
        <span class="human-tag">⚠ Human step: two of the ten agent runs failed mid-flight on a session limit; a human noticed the JSON files were missing, re-ran just those two categories, and re-merged.</span>
        </div>
      </div>
      <div class="step">
        <span class="step-num">03</span>
        <div><h3>Verify: independent re-check against primary sources</h3>
        <p>A separate pass re-searched a cross-category sample of the highest-leverage claims (MCP existence, self-serve status, primary auth) from scratch, independent of the first pass's findings, and diffed the two. See the verification section below for what it caught.</p>
        <span class="human-tag">⚠ Human step: the two disagreements found were corrected by hand directly in the dataset, with the correction and its source logged in the notes field rather than silently overwritten.</span>
        </div>
      </div>
      <div class="step">
        <span class="step-num">04</span>
        <div><h3>Render</h3>
        <p>This page is generated from the same <code>data/apps.json</code> file by <code>scripts/build_site.js</code>: the table, the bar charts, and the headline stats are all computed from it at build time, not hand-typed. Re-running the script after any correction regenerates the whole page.</p></div>
      </div>
    </div>
    <div class="card" style="margin-top:28px">
      <h3>Where Composio's own SDK/MCP fits</h3>
      <p style="color:var(--ink-soft); font-size:.92rem; max-width:75ch">Composio's SDK/MCP is built for <em>calling</em> an already-integrated app, not for researching whether one is OAuth vs. API-key or self-serve vs. gated; there's no "research this app" endpoint to call. The on-spirit use of it here was as a cross-check signal: for each app, the pipeline also checked whether Composio already lists a toolkit for it (${patterns.headline.composioExistingCount}/100 do) as a second, independent buildability signal alongside the primary research. The natural production version of this pipeline swaps the WebSearch/WebFetch calls for Composio's own MCP-based browsing tools once verified access is available; the schema and verification loop stay identical.</p>
    </div>
  </div>
</section>

<section id="verification">
  <div class="wrap">
    <div class="section-head">
      <div><span class="section-num">04 · The Verification</span><h2>Where the first pass was wrong, shown honestly</h2></div>
    </div>
    <div class="verify-summary">
      <div class="verify-stat before"><b>${verification.first_pass_accuracy}</b><span>first-pass accuracy on the sample checked</span></div>
      <div class="verify-stat after"><b>${verification.post_verification_accuracy}</b><span>after independent re-verification and correction</span></div>
      <div class="verify-stat"><b>${verification.sample_size}</b><span>apps hand-checked against primary sources (${verification.sample.join(', ')})</span></div>
    </div>
    <div class="table-scroll">
      <table class="check-table">
        <thead><tr><th>App</th><th>Claim checked</th><th>First pass said</th><th>Result</th><th>Note</th></tr></thead>
        <tbody>
          ${verification.checks.map(c=>`<tr>
            <td class="app-name">${c.app}</td>
            <td>${c.claim_checked}</td>
            <td style="font-family:var(--font-mono); font-size:.82rem; color:var(--ink-soft)">${c.first_pass}</td>
            <td><span class="result-tag ${c.verified.startsWith('match')?'match':'miss'}">${c.verified.startsWith('match')?'MATCH':'CORRECTED'}</span></td>
            <td style="font-size:.84rem; color:var(--ink-soft)">${c.note}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="caveat">${verification.honest_caveat}</p>
  </div>
</section>

<footer>
  <div class="wrap foot-grid">
    <div class="col">
      <strong style="color:var(--ink); font-family:var(--font-display); font-size:1.05rem">The Buildability Map</strong><br>
      Composio AI Product Ops Intern take-home. This page, the dataset, and the research pipeline are all in the source repo.
    </div>
    <div class="col">
      <span class="eyebrow" style="display:block; margin-bottom:6px">Source</span>
      <a href="https://github.com/simranduggal75/composio-ai-product-ops" target="_blank" rel="noopener">github.com/simranduggal75/composio-ai-product-ops</a>
      <a href="https://github.com/simranduggal75/composio-ai-product-ops#readme" target="_blank" rel="noopener">README: how to run the research agent</a>
    </div>
  </div>
</footer>

<script>
const APPS = ${JSON.stringify(apps)};
const CATS = ${JSON.stringify(CATEGORY_ORDER)};

const catSel = document.getElementById('catFilter');
CATS.forEach(c=>{ const o=document.createElement('option'); o.value=c; o.textContent=c; catSel.appendChild(o); });

const tbody = document.getElementById('appsBody');
const countNote = document.getElementById('countNote');
let sortKey='id', sortDir=1;

function verdictClass(v){ return v==='buildable today'?'buildable':(v==='partial'?'partial':'blocked'); }
function accessClass(v){ return v==='self-serve'?'self-serve':(v==='gated'?'gated':'mixed'); }
function mcpLabel(v){ return v==='yes-official'?'official':(v==='yes-community'?'community':'none'); }
function mcpClass(v){ return v==='yes-official'?'official':(v==='yes-community'?'community':'no'); }

function render(){
  const q = document.getElementById('search').value.trim().toLowerCase();
  const cat = catSel.value;
  const verdict = document.getElementById('verdictFilter').value;
  let rows = APPS.filter(a=>{
    if(q && !a.name.toLowerCase().includes(q)) return false;
    if(cat && a.category!==cat) return false;
    if(verdict && a.buildability_verdict!==verdict) return false;
    return true;
  });
  rows.sort((a,b)=>{
    let av=a[sortKey], bv=b[sortKey];
    if(Array.isArray(av)) av=av.join(',');
    if(Array.isArray(bv)) bv=bv.join(',');
    if(typeof av==='object') av=JSON.stringify(av);
    if(typeof bv==='object') bv=JSON.stringify(bv);
    if(av<bv) return -1*sortDir;
    if(av>bv) return 1*sortDir;
    return 0;
  });
  countNote.textContent = rows.length + ' / ' + APPS.length + ' apps';
  tbody.innerHTML = rows.map(a=>{
    const ev = (a.evidence_urls&&a.evidence_urls[0]) ? a.evidence_urls[0] : '';
    const auth = Array.isArray(a.auth_methods)? a.auth_methods.join(' + '):a.auth_methods;
    const surf = a.api_surface ? (a.api_surface.type + (a.api_surface.breadth? ' · '+a.api_surface.breadth:'')) : '';
    return '<tr>'
      + '<td style="font-family:var(--font-mono); color:var(--ink-faint)">'+a.id+'</td>'
      + '<td><span class="app-name">'+a.name+'</span><span class="app-cat">'+a.category+'</span></td>'
      + '<td style="font-family:var(--font-mono); font-size:.82rem">'+auth+'</td>'
      + '<td><span class="chip '+accessClass(a.self_serve)+'">'+a.self_serve+'</span></td>'
      + '<td style="font-size:.84rem; color:var(--ink-soft)">'+surf+'</td>'
      + '<td><span class="mcp-tag '+mcpClass(a.mcp_exists)+'">'+mcpLabel(a.mcp_exists)+'</span></td>'
      + '<td><span class="chip '+verdictClass(a.buildability_verdict)+'">'+a.buildability_verdict+'</span><span class="conf">'+(a.confidence||'')+' confidence</span></td>'
      + '<td>'+(ev? '<a class="evidence-link" href="'+ev+'" target="_blank" rel="noopener">source</a>':'-')+'</td>'
      + '</tr>';
  }).join('');
}

document.getElementById('search').addEventListener('input', render);
catSel.addEventListener('change', render);
document.getElementById('verdictFilter').addEventListener('change', render);
document.querySelectorAll('#appsTable thead th').forEach(th=>{
  th.addEventListener('click', ()=>{
    const key = th.dataset.key;
    if(key==='evidence') return;
    if(sortKey===key) sortDir*=-1; else { sortKey=key; sortDir=1; }
    render();
  });
});
render();
</script>
`;

fs.writeFileSync(path.join(root, 'site/index.html'), html);
fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs/index.html'), html);
console.log('Built site/index.html and docs/index.html —', apps.length, 'apps,', (html.length/1024).toFixed(0)+'KB');
