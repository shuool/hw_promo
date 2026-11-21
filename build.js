/* 由 content.json 生成 index.html / sponsor.html / join.html
   运行：node build.js  （或双击 更新页面.cmd）
   页面本身不读取任何本地存储 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;

/* 读取配置：允许 // 行注释与块注释，方便直接写说明 */
function readConfig(file) {
  const raw = fs.readFileSync(file, 'utf8');
  let out = '';
  let inStr = false, escaped = false, lineC = false, blockC = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i], n = raw[i + 1];
    if (lineC) { if (c === '\n') { lineC = false; out += c; } continue; }
    if (blockC) { if (c === '*' && n === '/') { blockC = false; i++; } continue; }
    if (inStr) {
      out += c;
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === '/' && n === '/') { lineC = true; i++; continue; }
    if (c === '/' && n === '*') { blockC = true; i++; continue; }
    out += c;
  }
  return JSON.parse(out);
}

const DATA = readConfig(path.join(ROOT, 'content.json'));
const L = DATA.labels || {};

/* 资源版本号：改完自动换新地址，避免浏览器用旧缓存 */
function assetVer(rel) {
  try {
    return crypto.createHash('md5').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex').slice(0, 8);
  } catch (e) {
    return 'v1';
  }
}
const CSS_VER = assetVer('assets/site.css');
const JS_VER = assetVer('assets/site.js');
/* 背景图在 CSS 里被引用，相对路径要以 assets/ 为基准 */
const bgPath = (p) => String(p || '').replace(/^\.\//, '../');

const ICONS = {  dot: '<circle cx="12" cy="12" r="3"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.2"/><path d="M15.4 15.4l4.4 4.4"/>',
  tool: '<path d="M14.6 5.8a4 4 0 0 0 5.2 5.2l-8.6 8.6a2.9 2.9 0 0 1-4.1-4.1l8.6-8.6z"/><path d="M5.4 4.2l3.2 3.2"/>',
  pin: '<path d="M12 21s7-6.4 7-11.2A7 7 0 0 0 5 9.8C5 14.6 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/>',
  user: '<circle cx="12" cy="8.4" r="3.4"/><path d="M5.2 20c.9-3.9 3.6-6 6.8-6s5.9 2.1 6.8 6"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
  star: '<path d="M12 3.6l2.5 5.1 5.6.8-4 4 1 5.6-5-2.7-5 2.7 1-5.6-4-4 5.6-.8z"/>',
  arrow: '<path d="M5 12h13"/><path d="M13 6l6 6-6 6"/>',
  play: '<path d="M8 5.2l10 6.8-10 6.8z"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  code: '<path d="M9 7L4 12l5 5"/><path d="M15 7l5 5-5 5"/>',
  wechat: '<path d="M4 11.2c0-3 2.8-5.2 6-5.2s6 2.2 6 5.2-2.8 5.2-6 5.2c-.6 0-1.2-.1-1.7-.2L6 17.6l.6-2.3A5.6 5.6 0 0 1 4 11.2z"/><path d="M14 16c0-2.2 2.1-3.8 4.5-3.8S23 13.8 23 16s-2.1 3.8-4.5 3.8c-.5 0-.9-.1-1.3-.2L15.6 20l.4-1.6A4.4 4.4 0 0 1 14 16z"/>'
};

const esc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const lines = (v) => String(v).split('\n').map(esc).join('<br>');

const ico = (name) => {
  const body = ICONS[name] || ICONS.dot;
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
};

const isNum = (v) => /^\d+$/.test(String(v).trim());
const navLinks = (items) => (items || []).map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join('');
const view = (src, title) => `data-view="${esc(src)}" data-title="${esc(title || '')}"`;

/* 点击「打开小小会玩」时的未发布 / 赞助提示 */
function appModal() {
  const a = DATA.app || {};
  return `<div class="app-modal" id="appModal" aria-hidden="true">
  <div class="app-modal-card" role="dialog" aria-modal="true" aria-labelledby="appModalTitle">
    <button class="app-modal-x" type="button" data-app-close aria-label="关闭提示">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>
    </button>
    <p class="app-badge"><i></i>${esc(a.badge || '')}</p>
    <h3 id="appModalTitle">${esc(a.title || '')}</h3>
    <p class="app-desc">${esc(a.desc || '')}</p>
    <div class="app-modal-actions">
      <a class="btn btn-primary" href="${esc((a.primary || {}).href || './sponsor.html')}">${esc((a.primary || {}).label || '成为赞助伙伴')}${ico('arrow')}</a>
      <button class="btn btn-ghost" type="button" data-copy="${esc(a.copyValue || '')}" data-label="${esc(a.copyLabel || '加微信')}">${esc(a.copyLabel || '加微信')}</button>
    </div>
    <p class="app-note">${esc(a.note || '')}</p>
  </div>
</div>`;
}

function head(page) {
  const site = DATA.site;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title || site.title)}</title>
<meta name="description" content="${esc(page.description || site.description)}">
<meta name="theme-color" content="${esc(site.themeColor)}">
<meta property="og:title" content="${esc(page.title || site.title)}">
<meta property="og:description" content="${esc(page.description || site.description)}">
<meta property="og:type" content="website">
<link rel="icon" href="${esc(site.logo)}">
<link rel="apple-touch-icon" href="${esc(site.logo)}">
<style>:root{--bg-portrait:url("${esc(bgPath(DATA.backgrounds.portrait))}");--bg-wide:url("${esc(bgPath(DATA.backgrounds.wide))}");}</style>
<link rel="stylesheet" href="./assets/site.css?v=${CSS_VER}">
</head>
<body${page.bodyClass ? ' class="' + page.bodyClass + '"' : ''}>
<div class="progress" aria-hidden="true"></div>
<div class="bg" aria-hidden="true"></div>
<div class="veil" aria-hidden="true"></div>
<canvas id="stars" aria-hidden="true"></canvas>
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="./index.html">
      <img src="${esc(site.logo)}" alt="${esc(site.name)}图标" width="33" height="33">
      <span><b>${esc(site.name)}</b><small>${esc(site.sub)}</small></span>
    </a>
    ${page.nav ? `<nav class="nav">${page.nav}</nav>` : ''}
    ${page.app ? `<a class="head-app" href="${esc(DATA.app.href)}" data-app="open" aria-label="${esc(DATA.app.button)}">${ico('play')}<span class="ha-short">${esc(DATA.app.short)}</span><span class="ha-long">${esc(DATA.app.button)}</span></a>` : ''}
    <a class="head-cta" href="${esc(page.headerHref || './sponsor.html')}">${esc(page.headerLabel || DATA.headerCta.label)} ${ico(page.headerIcon || 'star')}</a>
  </div>
</header>
<main>`;
}

function foot(page) {
  return `</main>
<footer class="foot">
  <div class="wrap">
    <b>${esc(page.footer || DATA.footer.line1)}</b>
    <span class="dot">·</span>${esc(DATA.footer.line2)}
  </div>
</footer>
<nav class="dock" aria-label="快捷导航">
  ${DATA.dock.map((d) => `<a href="./index.html${esc(d.href)}">${ico(d.icon)}${esc(d.label)}</a>`).join('')}
</nav>
<button class="to-top" type="button" aria-label="返回顶部" title="返回顶部">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg>
</button>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
${page.app ? appModal() : ''}
<script src="./assets/site.js?v=${JS_VER}" defer></script>
</body>
</html>`;
}

/* ---------------- 首页 ---------------- */
function buildIndex() {
  const h = DATA.hero;
  const nav = DATA.nav.map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join('');

  const phones = h.phones;
  const phone = (p, cls) => (p && p.src
    ? `<article class="phone ${cls}"><img src="${esc(p.src)}" alt="${esc(p.alt || '')}" ${cls === 'phone--main' ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" ${view(p.src, p.alt || '页面预览')}></article>`
    : '');

  const stats = h.stats.map((s) => `<div class="stat"><b${isNum(s.value) ? ` data-count="${Number(s.value)}"` : ''}>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('');

  const chips = h.chips.map((c) => `<div class="float-chip chip-${esc(c.pos)}"><i></i>${esc(c.text)}</div>`).join('');

  const features = DATA.features.items.map((f, i) => `
        <article class="feature reveal">
          <div class="feature-head"><span class="f-ico">${ico(f.icon)}</span><span class="f-num">${String(i + 1).padStart(2, '0')}</span></div>
          <h3>${esc(f.title)}</h3>
          <p>${esc(f.desc)}</p>
        </article>`).join('');

  const tools = DATA.tools.items.map((t, i) => `
        <article class="tool reveal">
          <div class="tool-thumb"><img src="${esc(t.image)}" alt="${esc(t.alt || t.name)}" loading="lazy" decoding="async" ${view(t.image, t.alt || t.name)}><span class="zoom-mark">${ico('search')}</span></div>
          <span class="tool-idx">${String(i + 1).padStart(2, '0')}</span>
          <div class="tool-body">
            <h3>${esc(t.name)}</h3>
            <p>${esc(t.desc)}</p>
          </div>
        </article>`).join('');

  const more = `<article class="tool tool--more reveal">
          <div class="tool-thumb tool-thumb--more">${ico('plus')}</div>
          <div class="tool-body">
            <h3>${esc(DATA.tools.more.title)}</h3>
            <p>${esc(DATA.tools.more.desc)}</p>
          </div>
        </article>`;

  const shots = DATA.admin.shots.map((s) => `
        <article class="shot reveal">
          <div class="shot-bar" aria-hidden="true"><i></i><i></i><i></i></div>
          <img src="${esc(s.image)}" alt="${esc(s.alt)}" loading="lazy" decoding="async" ${view(s.image, s.alt)}>
          <span class="zoom-mark">${ico('search')}</span>
          <p class="shot-cap">${esc(s.caption)}</p>
        </article>`).join('');

  const joinCards = DATA.join.cards.map((c) => `
        <article class="join-card ${c.kind === 'dev' ? 'dev' : ''} reveal">
          <h3>${esc(c.title)}</h3>
          <p class="join-sub">${esc(c.sub)}</p>
          <ul class="points">${c.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
          <div class="cta-row">
            <a class="line-btn ${c.kind === 'dev' ? '' : 'solid-line'}" href="${esc(c.cta.href)}">${esc(c.cta.label)}${ico('arrow')}</a>
          </div>
        </article>`).join('');

  const authorFields = DATA.author.fields.map((f) => `
          <div class="id-row">
            <dt>${esc(f.label)}</dt>
            <dd>${esc(f.value)}</dd>
            <button class="copy" type="button" data-copy="${esc(f.value)}" data-label="${esc(L.copy || '复制')}">${esc(L.copy || '复制')}</button>
          </div>`).join('');

  const authorActions = DATA.author.actions.map((a) => a.copy
    ? `<button class="line-btn" type="button" data-copy="${esc(a.copy)}" data-label="${esc(a.label)}">${ico('wechat')}${esc(a.label)}</button>`
    : `<a class="line-btn" href="${esc(a.href)}">${ico('arrow')}${esc(a.label)}</a>`).join('');

  const body = `
<section class="hero wrap" id="top">
  <div class="hero-inner">
    <div class="hero-copy reveal">
      <span class="eyebrow"><i></i>${esc(h.badge)}</span>
      <h1><span class="line">${esc(h.title[0])}</span><span class="line grad">${esc(h.title[1])}</span></h1>
      <p class="hero-lead">${esc(h.lead)}</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="${esc(h.primary.href)}">${esc(h.primary.label)}${ico('arrow')}</a>
        <a class="btn btn-toy" href="${esc(DATA.toy.href)}" data-todo="toy" data-tip="${esc(DATA.toy.tip || '')}"><span class="btn-toy-dot" aria-hidden="true"></span>${esc(DATA.toy.button)}${ico('play')}</a>
        <a class="btn btn-ghost" href="${esc(h.secondary.href)}">${ico('play')}${esc(h.secondary.label)}</a>
      </div>
      <div class="stats">${stats}</div>
    </div>
    <div class="hero-visual reveal">
      <div class="halo" aria-hidden="true"></div>
      ${phone(phones.left, 'phone--left')}
      ${phone(phones.right, 'phone--right')}
      ${phone(phones.main, 'phone--main')}
      ${chips}
    </div>
  </div>
</section>

<section class="sec wrap" id="features">
  <div class="sec-head reveal">
    <p class="kicker">${esc(DATA.features.kicker)}</p>
    <h2 class="sec-title">${esc(DATA.features.title)}</h2>
  </div>
  <div class="features">${features}
  </div>
</section>

<section class="sec wrap" id="tools">
  <div class="sec-head reveal">
    <p class="kicker">${esc(DATA.tools.kicker)}</p>
    <h2 class="sec-title">${esc(DATA.tools.title)}</h2>
  </div>
  <div class="tools">${tools}${more}
  </div>
</section>

<section class="sec wrap" id="admin">
  <div class="sec-head reveal">
    <p class="kicker">${esc(DATA.admin.kicker)}</p>
    <h2 class="sec-title">${esc(DATA.admin.title)}</h2>
    <p class="sec-sub">${esc(DATA.admin.desc)}</p>
  </div>
  <div class="shots">${shots}
  </div>
</section>

<section class="sec wrap" id="join">
  <div class="sec-head reveal">
    <p class="kicker">${esc(DATA.join.kicker)}</p>
    <h2 class="sec-title">${esc(DATA.join.title)}</h2>
    <p class="sec-sub">${esc(DATA.join.desc)}</p>
  </div>
  <div class="join">${joinCards}
  </div>
</section>

<section class="sec wrap" id="author">
  <div class="author reveal">
    <div class="author-main">
      <div class="ava"><img src="${esc(DATA.author.avatar)}" alt="${esc(DATA.author.name)}头像" loading="lazy" decoding="async"></div>
      <div class="author-intro">
        <p class="kicker">${esc(DATA.author.kicker)}</p>
        <h2 class="author-name">${esc(DATA.author.name)}</h2>
        <p class="author-role">${esc(DATA.author.role)}</p>
        <p class="author-bio">${esc(DATA.author.bio)}</p>
      </div>
    </div>
    <dl class="id-list">${authorFields}
    </dl>
    <div class="author-actions">${authorActions}</div>
  </div>
</section>`;

  return head({ nav, app: true, title: DATA.site.title, description: DATA.site.description }) + body + foot({ app: true, footer: DATA.footer.line1 });
}

/* ---------------- 赞助页 ---------------- */
function buildSponsor() {
  const p = DATA.sponsor;
  const nav = navLinks(p.nav);
  const points = p.points.map((x) => `<li>${esc(x)}</li>`).join('');
  const contacts = p.contacts.map((c) => `
          <div class="contact-row"><span>${esc(c.label)}</span><strong>${esc(c.value)}</strong><button class="copy" type="button" data-copy="${esc(c.value)}" data-label="${esc(L.copy || '复制')}">${esc(L.copy || '复制')}</button></div>`).join('');

  const body = `
<section class="page-hero wrap">
  <p class="kicker">${esc(p.kicker)}</p>
  <h1>${lines(p.title)}</h1>
  <p class="page-lead">${esc(p.lead)}</p>
  <p class="page-badge"><i></i>${esc(p.badge)}</p>
</section>

<section class="wrap">
  <div class="page-grid">
    <article class="page-card reveal">
      <h2>${esc(p.sectionTitle)}</h2>
      <ul class="page-list">${points}</ul>
    </article>
    <article class="page-card reveal">
      <h2>${esc(p.contactTitle || '直接联系')}</h2>
      <div class="contacts">${contacts}</div>
      <p class="page-note">${esc(p.note)}</p>
      <div class="page-actions">
        <button class="btn btn-primary" type="button" data-copy="${esc(p.contacts[0].value)}" data-label="${esc(p.cta)}">${esc(p.cta)}${ico('wechat')}</button>
        <a class="btn btn-ghost" href="${esc(p.backHref)}">${esc(p.back)}${ico('arrow')}</a>
      </div>
    </article>
  </div>
</section>`;

  return head({
    nav,
    title: p.title.replace(/\n/g, '') + ' · ' + DATA.site.name,
    description: p.lead,
    headerHref: './index.html',
    headerLabel: L.backHome || '回首页',
    headerIcon: 'arrow'
  }) + body + foot({ footer: p.footer });
}

/* ---------------- 共建页 ---------------- */
function buildJoin() {
  const p = DATA.joinPage;
  const nav = navLinks(p.nav);
  const cards = p.cards.map((c) => `
        <article class="page-card reveal">
          <p class="kicker">${esc(c.tag)}</p>
          <h2>${esc(c.title)}</h2>
          <ul class="page-list">${c.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        </article>`).join('');

  const contacts = p.contacts.map((c) => `
          <div class="contact-row"><span>${esc(c.label)}</span><strong>${esc(c.value)}</strong><button class="copy" type="button" data-copy="${esc(c.value)}" data-label="${esc(L.copy || '复制')}">${esc(L.copy || '复制')}</button></div>`).join('');

  const body = `
<section class="page-hero wrap">
  <p class="kicker">${esc(p.kicker)}</p>
  <h1>${lines(p.title)}</h1>
  <p class="page-lead">${esc(p.lead)}</p>
  <p class="page-badge cyan"><i></i>${esc(p.badge)}</p>
</section>

<section class="wrap">
  <div class="page-grid">${cards}
    <article class="page-card wide reveal">
      <h2>${esc(p.sectionTitle)}</h2>
      <p class="page-lead">${esc(p.text)}</p>
      <div class="contacts">${contacts}</div>
      <p class="page-note">${esc(p.note)}</p>
      <div class="page-actions">
        <button class="btn btn-primary" type="button" data-copy="${esc(p.contacts[0].value)}" data-label="${esc(p.cta)}">${esc(p.cta)}${ico('wechat')}</button>
        <a class="btn btn-ghost" href="${esc(p.backHref)}">${esc(p.back)}${ico('arrow')}</a>
      </div>
    </article>
  </div>
</section>`;

  return head({
    nav,
    title: p.title.replace(/\n/g, '') + ' · ' + DATA.site.name,
    description: p.lead,
    headerHref: './index.html',
    headerLabel: L.backHome || '回首页',
    headerIcon: 'arrow'
  }) + body + foot({ footer: p.footer });
}

const files = [
  ['index.html', buildIndex()],
  ['sponsor.html', buildSponsor()],
  ['join.html', buildJoin()]
];

files.forEach(([name, html]) => {
  fs.writeFileSync(path.join(ROOT, name), html, 'utf8');
  console.log('✓ ' + name + '  ' + (Buffer.byteLength(html) / 1024).toFixed(1) + ' KB');
});
