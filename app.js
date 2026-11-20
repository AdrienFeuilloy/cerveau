/* ==========================================================
   Cerveau — second cerveau (méthode PARA)
   Les notes sont de simples fichiers Markdown dans un dépôt GitHub privé :
   lisibles et modifiables tels quels (GitHub, Obsidian, éditeur de texte).
   Synchro par l'API Git de GitHub : un commit par lot, fusion note par note.
   ========================================================== */

/* ---------- Outils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unesc = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const P = 'sc.'; // préfixe du stockage local (même domaine que les autres applis GitHub Pages)
const read = (k, d = null) => { try { const v = localStorage.getItem(P + k); return v ? JSON.parse(v) : d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) { console.warn('stockage', e); } };
const now = () => Date.now();
const todayISO = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const today = () => todayISO();
const isISO = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const frDate = (iso, opt = { day: 'numeric', month: 'short', year: 'numeric' }) => isISO(iso) ? new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', opt) : '';
const daysTo = iso => Math.round((new Date(iso + 'T12:00:00') - new Date(today() + 'T12:00:00')) / 864e5);
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return todayISO(d); };
const nextMonday = () => { const d = new Date(today() + 'T12:00:00'); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return todayISO(d); };
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const plural = (n, s, p = s + 's') => `${n} ${n > 1 ? p : s}`;
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
const dueLabel = iso => { const n = daysTo(iso); return n === 0 ? "aujourd'hui" : n === 1 ? 'demain' : n === -1 ? 'hier' : n < 0 ? `retard ${-n} j` : n < 7 ? new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long' }) : frDate(iso, { day: 'numeric', month: 'short' }); };
const plain = s => String(s || '').replace(/!\[\[[^\]]*\]\]|!\[[^\]]*\]\([^)]*\)/g, '📷').replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (m, a, b) => b || a).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[📅✅]\s*\d{4}-\d{2}-\d{2}/gu, '').replace(/[*`]/g, '').replace(/\s+/g, ' ').trim();
const cleanTitle = s => String(s || '').replace(/[\\/:*?"<>|#^[\]]/g, ' ').replace(/^[.\s]+/, '').replace(/\s+/g, ' ').trim().slice(0, 80).trim();
function ping(el) {
  const r = el.getBoundingClientRect(), x = r.left + r.width / 2 + 'px', y = r.top + r.height / 2 + 'px';
  for (const c of ['ping x', 'ping cross', 'ping', 'ping', 'ping', 'pingt']) { const d = document.createElement('div'); d.className = c; d.style.left = x; d.style.top = y; if (c === 'pingt') d.textContent = 'Validé'; document.body.appendChild(d); setTimeout(() => d.remove(), 1700); }
}
setInterval(() => { const c = document.querySelector('[data-clock]'); if (c) c.textContent = new Date().toLocaleTimeString('fr-FR'); }, 1000);
const vibrate = () => { try { navigator.vibrate?.(8); } catch { } };

const ICON = {
  today: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
  inbox: '<path d="M4 13l2.2-7.4A1.5 1.5 0 0 1 7.6 4.5h8.8a1.5 1.5 0 0 1 1.4 1.1L20 13v5.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z"/><path d="M4 13h4.5l1.5 2.5h4l1.5-2.5H20"/>',
  proj: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r=".6"/>',
  task: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8.5 12.2 2.4 2.4 4.8-5"/>',
  notes: '<path d="M6 3.5h9l3 3V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20z"/><path d="M9 10h6M9 13.5h6M9 17h3.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  set: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  journal: '<path d="M6 4h11a1 1 0 0 1 1 1v15H7a1 1 0 0 1-1-1z"/><path d="M6 17h12M10 8h5"/>',
  review: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4.5h-4.5"/>',
};
const ico = (n, size) => `<svg class="i" viewBox="0 0 24 24"${size ? ` style="width:${size}px;height:${size}px"` : ''} aria-hidden="true">${ICON[n]}</svg>`;

/* ---------- Réglages (sur cet appareil) ---------- */
const cfg = Object.assign({ owner: 'AdrienFeuilloy', repo: 'phant-studio-data', branch: 'main', token: '', root: 'Cerveau', theme: 'auto' }, read('config', {}) || {});
// Même dépôt privé que les applis de Quotidien (même domaine GitHub Pages) : on reprend son jeton, rien à ressaisir
if (!cfg.token) { try { const hub = JSON.parse(localStorage.getItem('hub.github') || '{}'); if (hub.token && (hub.repo || '').toLowerCase() === cfg.repo.toLowerCase() && (hub.owner || '').toLowerCase() === cfg.owner.toLowerCase()) { cfg.token = hub.token; cfg.branch = hub.branch || cfg.branch; } } catch { } }
const saveCfg = () => write('config', cfg);
const ghReady = () => !!(cfg.owner && cfg.repo && cfg.token);
function applyTheme() {
  const dark = cfg.theme === 'dark' || (cfg.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  $('meta[name=theme-color]')?.setAttribute('content', dark ? '#111214' : '#f3f1ec');
}
applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

/* ---------- Organisation PARA ---------- */
const KINDS = [
  { id: 'boite', dir: '0-Boite', label: 'Boîte de réception', short: 'Boîte', n: '0' },
  { id: 'projet', dir: '1-Projets', label: 'Projets', short: 'Projets', n: '1' },
  { id: 'domaine', dir: '2-Domaines', label: 'Domaines', short: 'Domaines', n: '2' },
  { id: 'ressource', dir: '3-Ressources', label: 'Ressources', short: 'Ressources', n: '3' },
  { id: 'archive', dir: '4-Archives', label: 'Archives', short: 'Archives', n: '4' },
  { id: 'journal', dir: 'Journal', label: 'Journal', short: 'Journal', n: 'J' },
];
const KIND = id => KINDS.find(k => k.id === id);
const SPHERES = [{ id: 'Perso', v: '--perso' }, { id: 'Salarié', v: '--salarie' }, { id: 'PhantStudio', v: '--phant' }];
const sc = s => { const x = SPHERES.find(y => y.id === s); return x ? `var(${x.v})` : 'var(--mut)'; };
const STATUTS = [['actif', 'En cours'], ['en pause', 'En pause'], ['terminé', 'Terminés']];
const PROJ_BODY = '## Objectif\n\n\n## Tâches\n- [ ] \n\n## Notes\n';
const TASK = /^(\s*)[-*+] \[([ xX])\] ?(.*)$/;

/* ---------- Chemins ---------- */
const R = () => cfg.root ? cfg.root.replace(/^\/+|\/+$/g, '') + '/' : '';
const isNotePath = p => p.endsWith('.md') && p.startsWith(R()) && !/(^|\/)\./.test(p) && p !== 'README.md';
const segs = p => p.slice(R().length).split('/');
const kindOf = p => { const s = segs(p); return s.length > 1 ? (KINDS.find(k => k.dir === s[0])?.id || 'autre') : 'autre'; };
const subOf = p => segs(p).slice(1, -1).join(' / ');
const titleOf = p => p.split('/').pop().replace(/\.md$/i, '');
const folderOf = p => p.split('/').slice(0, -1).join('/');
const dirOf = kind => R() + KIND(kind).dir;
function uniquePath(dir, title, except) {
  title = cleanTitle(title) || 'Sans titre';
  let p = `${dir}/${title}.md`, i = 2;
  while (notes[p] && p !== except) p = `${dir}/${title} (${i++}).md`;
  return p;
}
function firstLine(text) {
  const l = String(text || '').split('\n').map(x => x.replace(TASK, '$3').replace(/^#+\s*/, '').trim()).find(Boolean) || '';
  const p = plain(l).replace(/https?:\/\/(www\.)?/, '');
  return p.length > 60 ? p.slice(0, 60).replace(/\s+\S*$/, '') + '…' : p;
}

/* ---------- En-tête YAML (compatible Obsidian) ---------- */
const unq = s => /^"(.*)"$/.test(s) ? (() => { try { return JSON.parse(s); } catch { return s.slice(1, -1); } })() : /^'(.*)'$/.test(s) ? s.slice(1, -1) : s;
function parse(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
  if (!m) return { fm: {}, order: [], body: text.replace(/^(\r?\n)+/, '') };
  const fm = {}, order = []; let last = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([\p{L}\p{N}_-]+):\s*(.*)$/u.exec(line);
    if (kv) { last = kv[1]; order.push(last); const v = kv[2].trim(); fm[last] = /^\[.*\]$/.test(v) ? v.slice(1, -1).split(',').map(s => unq(s.trim())).filter(Boolean) : unq(v); continue; }
    const li = /^\s*-\s+(.*)$/.exec(line);
    if (li && last) { if (!Array.isArray(fm[last])) fm[last] = fm[last] ? [fm[last]] : []; fm[last].push(unq(li[1].trim())); }
  }
  return { fm, order, body: text.slice(m[0].length).replace(/^(\r?\n)+/, '') };
}
function build(fm, body, order = []) {
  const keys = [...new Set([...order, ...Object.keys(fm)])].filter(k => { const v = fm[k]; return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length); });
  const q = s => { s = String(s); return /^[\p{L}\p{N} ._+()-]*$/u.test(s) && !/^\s|\s$/.test(s) && !/^(true|false|null|yes|no|~)$/i.test(s) ? s : JSON.stringify(s); };
  const fmt = v => Array.isArray(v) ? '[' + v.map(q).join(', ') + ']' : isISO(v) ? v : q(v);
  body = String(body || '').replace(/^(\r?\n)+/, '');
  return keys.length ? `---\n${keys.map(k => `${k}: ${fmt(fm[k])}`).join('\n')}\n---\n\n${body}` : body;
}

/* ==========================================================
   Stockage local + synchro GitHub (API Git)
   notes : { chemin: { text, sha (version GitHub connue), dirty, v, at } }
   ========================================================== */
let notes = read('notes', {}) || {};
const meta = Object.assign({ head: null, tree: null, treeSha: null, last: 0, dirty: false, deleted: {}, seeded: false, files: {}, media: [] }, read('sync', {}) || {});
function persist() {
  meta.dirty = Object.values(notes).some(n => n.dirty) || Object.keys(meta.deleted).length > 0 || meta.media.length > 0;
  write('notes', notes); write('sync', meta);
}
function createNote(p, text) {
  const prev = meta.deleted[p]; delete meta.deleted[p];
  notes[p] = { text, sha: prev || null, dirty: true, v: 1, at: now() };
  persist(); schedule(); return p;
}
function saveNote(p, text) {
  const n = notes[p]; if (!n) return createNote(p, text);
  if (n.text === text) return p;
  n.text = text; n.dirty = true; n.v = (n.v || 0) + 1; n.at = now();
  persist(); schedule(); return p;
}
function deleteNote(p) {
  const n = notes[p]; if (!n) return;
  if (n.sha) meta.deleted[p] = n.sha;
  delete notes[p]; persist(); schedule();
}
function moveNote(from, to) {
  if (from === to || !notes[from]) return from;
  const text = notes[from].text;
  deleteNote(from); createNote(to, text);
  if (titleOf(from) !== titleOf(to)) relink(titleOf(from), titleOf(to));
  return to;
}
// Un renommage met à jour les [[liens]] des autres notes (comme Obsidian)
function relink(a, b) {
  const re = new RegExp('\\[\\[' + escRe(a) + '(?=\\]\\]|\\||#)', 'g');
  for (const [p, n] of Object.entries(notes)) { if (re.test(n.text)) { re.lastIndex = 0; saveNote(p, n.text.replace(re, '[[' + b)); } re.lastIndex = 0; }
}
function setFm(p, patch) {
  const n = notes[p]; if (!n) return;
  const { fm, order, body } = parse(n.text);
  saveNote(p, build({ ...fm, ...patch }, body, order));
}

/* ---------- API GitHub ---------- */
const API = () => `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}`;
async function gh(path, opt = {}) {
  const r = await fetch(API() + path, { method: opt.method || 'GET', body: opt.body ? JSON.stringify(opt.body) : undefined, cache: 'no-store',
    headers: { Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opt.body ? { 'Content-Type': 'application/json' } : {}) } });
  if (!r.ok) {
    let m = ''; try { m = (await r.json()).message || ''; } catch { }
    const e = new Error(({ 401: 'Jeton invalide ou expiré', 403: 'Accès refusé par GitHub', 404: 'Dépôt ou branche introuvable', 409: 'Le dépôt est vide' }[r.status] || 'Erreur GitHub ' + r.status) + (m ? ' (' + m + ')' : ''));
    e.status = r.status; throw e;
  }
  return r.status === 204 ? null : r.json();
}
const b64d = s => { const bin = atob(String(s).replace(/\s/g, '')); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new TextDecoder().decode(u); };
async function blobSha(text) {
  const enc = new TextEncoder(), body = enc.encode(text), head = enc.encode(`blob ${body.length}\0`);
  const all = new Uint8Array(head.length + body.length); all.set(head); all.set(body, head.length);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-1', all))].map(b => b.toString(16).padStart(2, '0')).join('');
}
/* ---------- Images : rangées dans <dossier>/Fichiers/, insérées dans les notes avec ![[nom.jpg]] (comme Obsidian) ---------- */
const isImgName = n => /\.(jpe?g|png|gif|webp|heic|avif)$/i.test(n);
const isMedia = p => isImgName(p) && p.startsWith(R());
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', heic: 'image/heic', avif: 'image/avif' };
function idb() {
  return new Promise((res, rej) => { const r = indexedDB.open('cerveau', 1); r.onupgradeneeded = () => { for (const s of ['share', 'media', 'pending']) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
const idbDo = (s, mode, f) => idb().then(d => new Promise((res, rej) => { const q = f(d.transaction(s, mode).objectStore(s)); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }));
const idbGet = (s, k) => idbDo(s, 'readonly', o => o.get(k)).catch(() => null);
const idbPut = (s, k, v) => idbDo(s, 'readwrite', o => o.put(v, k));
const idbDel = (s, k) => idbDo(s, 'readwrite', o => o.delete(k)).catch(() => { });
const blobToB64 = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(String(f.result).split(',')[1]); f.readAsDataURL(b); });
// Photo réduite (1600 px, JPEG) avant l'envoi : le dépôt reste léger
async function shrink(file) {
  const ext0 = ((file.name || '').split('.').pop() || (file.type || '').split('/')[1] || 'jpg').toLowerCase().replace('jpeg', 'jpg');
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const b = await new Promise(r => c.toBlob(r, 'image/jpeg', .82));
    return b && (b.size < file.size || !/^(jpg|png|webp)$/.test(ext0)) ? { blob: b, ext: 'jpg' } : { blob: file, ext: ext0 };
  } catch { return { blob: file, ext: ext0 }; }
}
async function addMedia(blob, ext, n = 1) {
  const d = new Date(), st = `${today()}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
  let name = `${st}-${n}.${ext}`, i = n; while (meta.files[`${R()}Fichiers/${name}`] || meta.media.includes(`${R()}Fichiers/${name}`)) name = `${st}-${++i}.${ext}`;
  const path = `${R()}Fichiers/${name}`;
  await idbPut('media', path, blob); await idbPut('pending', path, blob);
  meta.media.push(path); persist();
  return name;
}
const urls = new Map();
async function mediaURL(name) {
  if (urls.has(name)) return urls.get(name);
  const path = [...meta.media, ...Object.keys(meta.files)].find(p => p.split('/').pop() === name);
  if (!path) return null;
  let blob = await idbGet('media', path);
  if (!blob && meta.files[path] && ghReady()) {
    const j = await gh(`/git/blobs/${meta.files[path]}`), bin = atob(j.content.replace(/\s/g, '')), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    blob = new Blob([u], { type: MIME[path.split('.').pop().toLowerCase()] || 'image/jpeg' });
    idbPut('media', path, blob).catch(() => { });
  }
  if (!blob) return null;
  const url = URL.createObjectURL(blob); urls.set(name, url); return url;
}
function hydrate(root) {
  if (!root) return;
  $$('img[data-att]:not([src])', root).forEach(async im => {
    try { const u = await mediaURL(unesc(im.dataset.att)); if (u) { im.src = u; im.onclick = () => window.open(u, '_blank'); } else im.replaceWith(Object.assign(document.createElement('span'), { className: 'att-miss', textContent: '📷 ' + im.dataset.att })); }
    catch { }
  });
}

async function remoteTree(commitSha) {
  const c = await gh(`/git/commits/${commitSha}`);
  const t = await gh(`/git/trees/${c.tree.sha}?recursive=1`);
  const map = {}, files = {};
  for (const e of t.tree || []) if (e.type === 'blob') { if (isNotePath(e.path)) map[e.path] = e.sha; else if (isMedia(e.path)) files[e.path] = e.sha; }
  return { map, files, treeSha: c.tree.sha };
}
async function fetchBlobs(list) {
  const out = {}; let i = 0;
  const worker = async () => { while (i < list.length) { const [p, sha] = list[i++]; const j = await gh(`/git/blobs/${sha}`); out[p] = j.encoding === 'base64' ? b64d(j.content) : j.content; } };
  await Promise.all(Array.from({ length: Math.min(6, list.length) }, worker));
  return out;
}
// Dépôt tout neuf (sans aucun commit) : on y dépose un premier fichier pour pouvoir utiliser l'API Git
async function initEmptyRepo() {
  const content = btoa(unescape(encodeURIComponent('# Cerveau\n\nMes notes (méthode PARA). Dépôt privé.\n')));
  await gh('/contents/README.md', { method: 'PUT', body: { message: 'Cerveau : création du dépôt', content, branch: cfg.branch } });
}
let conflicts = [];
async function pull(remote) {
  const need = [];
  for (const [p, sha] of Object.entries(remote)) {
    const n = notes[p];
    if (!n) { if (meta.deleted[p] === sha) continue; delete meta.deleted[p]; need.push(p); continue; }
    if (n.sha !== sha) need.push(p);
  }
  const texts = need.length ? await fetchBlobs(need.map(p => [p, remote[p]])) : {};
  for (const p of need) {
    const t = texts[p], sha = remote[p], n = notes[p];
    if (!n) { notes[p] = { text: t, sha, dirty: false, v: 0, at: 0 }; continue; }
    if (!n.dirty) { n.text = t; n.sha = sha; continue; }
    if (n.text === t) { n.sha = sha; n.dirty = false; continue; }
    // Modifiée des deux côtés : on garde les deux versions, rien n'est perdu
    n.sha = sha;
    const cp = uniquePath(folderOf(p), `${titleOf(p)} (autre appareil ${frDate(today(), { day: 'numeric', month: 'short' })})`);
    notes[cp] = { text: t, sha: null, dirty: true, v: 1, at: now() };
    conflicts.push(titleOf(p));
  }
  for (const p of Object.keys(notes)) if (!(p in remote)) { const n = notes[p]; if (n.sha && !n.dirty) delete notes[p]; else if (n.sha) n.sha = null; }
  for (const p of Object.keys(meta.deleted)) if (!(p in remote)) delete meta.deleted[p];
}
let busy = false, again = false, timer = null, sstate = 'local', serr = '';
function paint(s, err = '') {
  sstate = s; serr = err;
  const txt = { local: 'Sur cet appareil', pending: 'En attente', busy: 'Synchro…', ok: 'À jour', err: 'Erreur' }[s];
  $$('[data-sync]').forEach(el => { el.className = 'sync ' + s; el.title = err || txt + (meta.last ? ' · ' + new Date(meta.last).toLocaleString('fr-FR') : ''); });
  $$('[data-synct]').forEach(el => el.textContent = err ? 'Erreur de synchro' : txt);
}
function schedule(ms = 1500) { clearTimeout(timer); if (!ghReady()) return paint('local'); paint('pending'); timer = setTimeout(sync, ms); }
async function sync() {
  if (!ghReady()) return paint('local');
  if (busy) { again = true; return; }
  busy = true; paint('busy'); conflicts = [];
  try {
    const branch = encodeURIComponent(cfg.branch);
    for (let attempt = 0; attempt < 4; attempt++) {
      let ref;
      try { ref = await gh(`/git/ref/heads/${branch}`); }
      catch (e) { if ((e.status === 409 || e.status === 404) && attempt === 0 && !meta.head) { await initEmptyRepo(); continue; } throw e; }
      const head = ref.object.sha;
      let remote, treeSha;
      if (head === meta.head && meta.tree && meta.treeSha) { remote = { ...meta.tree }; treeSha = meta.treeSha; }
      else { let files; ({ map: remote, files, treeSha } = await remoteTree(head)); meta.files = files; }
      await pull(remote);
      if (!meta.seeded) { if (!Object.keys(remote).length && !Object.keys(notes).some(isNotePath)) seed(); meta.seeded = true; }
      const ch = [];
      for (const [p, n] of Object.entries(notes)) if (n.dirty && isNotePath(p)) ch.push({ path: p, text: n.text, v: n.v });
      for (const p of Object.keys(meta.deleted)) if (p in remote) ch.push({ path: p, del: true });
      for (const p of meta.media) { const blob = await idbGet('pending', p); if (!blob) continue; const r = await gh('/git/blobs', { method: 'POST', body: { content: await blobToB64(blob), encoding: 'base64' } }); ch.push({ path: p, sha: r.sha, media: true }); }
      if (!ch.length) { meta.head = head; meta.tree = remote; meta.treeSha = treeSha; break; }
      const tree = await gh('/git/trees', { method: 'POST', body: { base_tree: treeSha, tree: ch.map(c => c.del ? { path: c.path, mode: '100644', type: 'blob', sha: null } : c.media ? { path: c.path, mode: '100644', type: 'blob', sha: c.sha } : { path: c.path, mode: '100644', type: 'blob', content: c.text }) } });
      const nc = await gh('/git/commits', { method: 'POST', body: { message: `Cerveau : ${plural(ch.filter(c => !c.media).length, 'note')}${ch.some(c => c.media) ? ` + ${plural(ch.filter(c => c.media).length, 'image')}` : ''} (${new Date().toLocaleString('fr-FR')})`, tree: tree.sha, parents: [head] } });
      try { await gh(`/git/refs/heads/${branch}`, { method: 'PATCH', body: { sha: nc.sha, force: false } }); }
      catch (e) { if ([409, 422].includes(e.status) && attempt < 3) continue; throw e; } // un autre appareil a écrit entre-temps : on recommence
      for (const c of ch) {
        if (c.del) { delete remote[c.path]; delete meta.deleted[c.path]; continue; }
        if (c.media) { meta.files[c.path] = c.sha; meta.media = meta.media.filter(x => x !== c.path); await idbDel('pending', c.path); continue; }
        const sha = await blobSha(c.text); remote[c.path] = sha;
        const n = notes[c.path]; if (n) { n.sha = sha; if (n.v === c.v) n.dirty = false; }
      }
      meta.head = nc.sha; meta.tree = remote; meta.treeSha = tree.sha;
      break;
    }
    meta.last = now(); persist();
    paint(meta.dirty ? 'pending' : 'ok');
    if (meta.dirty) again = true;
    if (conflicts.length) toast(`« ${conflicts[0]} » a changé sur deux appareils : les deux versions sont gardées.`);
    render();
  } catch (e) { console.error(e); persist(); paint('err', e.message); toast('Synchro GitHub : ' + e.message); render(); }
  finally { busy = false; if (again) { again = false; schedule(400); } }
}
addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sync(); else if (meta.dirty) { clearTimeout(timer); sync(); } });
addEventListener('beforeunload', e => { if (meta.dirty && ghReady()) { e.preventDefault(); e.returnValue = ''; } });
addEventListener('online', () => sync());

/* ---------- Structure de départ (une seule fois, si le dépôt n'a encore aucune note) ---------- */
function seed() {
  const d = today(), N = (p, t) => { notes[R() + p] = { text: t, sha: null, dirty: true, v: 1, at: now() }; };
  N('LISEZ-MOI.md', `# Mon second cerveau

Tout ce qui me passe par la tête atterrit ici, puis je le range selon la méthode **PARA** :

- **0-Boite** : la boîte de réception. On capture vite, sans réfléchir, et on trie plus tard.
- **1-Projets** : ce qui a un objectif et une fin (« Refaire le site », « Préparer les impôts »).
- **2-Domaines** : ce qui dure, sans date de fin : [[Perso]], [[Salarié]] et [[PhantStudio]].
- **3-Ressources** : ce que je veux garder pour plus tard (idées, tutos, références).
- **4-Archives** : les projets finis et ce qui ne sert plus, sans rien jeter.
- **Journal** : une note par jour, quand j'en ai envie.

## Les gestes
1. **Capturer** : le bouton ＋, ou « Partager → Cerveau » depuis n'importe quelle appli du téléphone.
2. **Trier** la boîte tous les jours ou deux.
3. **Agir** : « Aujourd'hui » montre ce qui est dû, tous domaines confondus.
4. **Revoir** chaque semaine : boîte vide, une prochaine tâche par projet, projets finis archivés.

## Écrire
- \`- [ ] Appeler le garage 📅 ${addDays(d, 5)}\` crée une tâche avec une échéance ;
- \`[[Nom d'une note]]\` crée un lien vers une autre note ;
- \`#idée\` ajoute une étiquette.

Ces fichiers s'ouvrent aussi tels quels dans Obsidian.
`);
  N('0-Boite/Bienvenue.md', build({ cree: d }, `Voici ta boîte de réception : tout ce que tu captures arrive ici, sans avoir à réfléchir où le ranger.

Touche « Trier » pour essayer de ranger cette note… ou supprime-la, elle a fait son travail.
`));
  N('1-Projets/Mettre en place mon second cerveau.md', build({ type: 'projet', domaine: 'Perso', statut: 'actif', echeance: addDays(d, 14), cree: d }, `## Objectif
Un seul endroit fiable pour tout ce qui compte, entre vie perso, boulot et [[PhantStudio]].

## Tâches
- [ ] Capturer une idée depuis le téléphone avec « Partager → Cerveau » 📅 ${d}
- [ ] Trier la boîte de réception 📅 ${addDays(d, 1)}
- [ ] Créer un projet pour chaque chantier en cours (perso, boulot, PhantStudio) 📅 ${addDays(d, 3)}
- [ ] Faire la première revue de la semaine 📅 ${addDays(d, 7)}
- [ ] Brancher Obsidian sur le dépôt GitHub (plus tard)

## Notes
`));
  const dom = (name, intro, items) => N(`2-Domaines/${name}.md`, build({ type: 'domaine', domaine: name, cree: d }, `${intro}\n\n## À tenir\n${items.map(i => '- ' + i).join('\n')}\n\n## Tâches\n\n## Notes\n`));
  dom('Perso', 'La vie de famille et la maison : idées, envies, choses à ne pas oublier.', ['Famille', 'Maison', 'Santé', 'Finances', 'Loisirs']);
  dom('Salarié', 'Mon travail de salarié : ce que je dois suivre, les idées à proposer, les choses à ne pas oublier.', ['Missions en cours', 'Réunions et suivis', 'Montée en compétences']);
  dom('PhantStudio', "Mon activité d'illustration et d'identité graphique : clients, site, communication.", ['Clients et devis', 'Site et portfolio', 'Réseaux sociaux', 'Idées de créations']);
  persist();
}

/* ==========================================================
   Lecture des notes
   ========================================================== */
function info(path) {
  const n = notes[path], { fm, order, body } = parse(n.text), kind = kindOf(path);
  const stamp = Math.max(n.at || 0, Date.parse(fm.modifie || fm.cree || '') || 0, kind === 'journal' && isISO(titleOf(path)) ? Date.parse(titleOf(path)) : 0);
  return { path, title: titleOf(path), kind, sub: subOf(path), fm, order, body, dom: SPHERES.some(s => s.id === fm.domaine) ? fm.domaine : '', stamp, ask: fm.assistant === 'à traiter', asked: fm.assistant === 'fait' };
}
function tasksOf(x) {
  const out = [];
  notes[x.path].text.split('\n').forEach((l, i) => {
    const m = TASK.exec(l); if (!m) return;
    const rest = m[3], due = (/📅\s*(\d{4}-\d{2}-\d{2})/u.exec(rest) || [])[1] || '', doneAt = (/✅\s*(\d{4}-\d{2}-\d{2})/u.exec(rest) || [])[1] || '';
    const text = rest.replace(/[📅✅⏳🛫]\s*\d{4}-\d{2}-\d{2}/gu, '').replace(/\s+/g, ' ').trim();
    if (text) out.push({ path: x.path, line: i, raw: l, done: m[2] !== ' ', text, due, doneAt, note: x });
  });
  return out;
}
function buildIndex() {
  const idx = Object.keys(notes).filter(isNotePath).map(info);
  return {
    idx, tasks: idx.filter(x => x.kind !== 'archive').flatMap(tasksOf),
    box: idx.filter(x => x.kind === 'boite').sort((a, b) => b.stamp - a.stamp),
    projs: idx.filter(x => x.kind === 'projet'), doms: idx.filter(x => x.kind === 'domaine'),
    asks: idx.filter(x => x.ask).sort((a, b) => (a.fm.demande || '').localeCompare(b.fm.demande || '')),
  };
}
const byTitle = (a, b) => a.title.localeCompare(b.title, 'fr');
const findByTitle = t => { const k = norm(t), ps = Object.keys(notes).filter(p => isNotePath(p) && norm(titleOf(p)) === k); return ps.find(p => kindOf(p) !== 'archive') || ps[0]; };
const backlinks = x => buildIndex().idx.filter(y => y.path !== x.path && new RegExp('\\[\\[' + escRe(x.title) + '(\\]\\]|\\||#)', 'i').test(notes[y.path].text));
function excerpt(x) {
  const l = x.body.split('\n').map(s => s.trim()).find(s => s && !/^#/.test(s) && !TASK.test(s) && !/^[-*]\s*$/.test(s));
  return l ? plain(l.replace(/^[-*+>]\s+/, '')).slice(0, 120) : '';
}
function toggleLine(path, idx, raw) {
  const n = notes[path]; if (!n) return;
  const L = n.text.split('\n'), i = L[idx] === raw ? idx : L.indexOf(raw);
  if (i < 0) { toast('La note a changé, réessaie'); return; }
  const m = TASK.exec(L[i]); if (!m) return;
  const done = m[2] !== ' ';
  L[i] = done ? L[i].replace(/\[[xX]\]/, '[ ]').replace(/\s*✅\s*\d{4}-\d{2}-\d{2}/u, '') : L[i].replace('[ ]', '[x]').replace(/\s*$/, '') + ' ✅ ' + today();
  saveNote(path, L.join('\n'));
  if (!done) vibrate();
  return !done;
}
// Ajoute un bloc sous un titre « ## … » d'une note (créé à la fin s'il n'existe pas)
function insertUnder(text, heading, block) {
  const L = text.split('\n'), re = new RegExp('^#{1,6}\\s+' + escRe(heading) + '\\s*$', 'i');
  const h = L.findIndex(l => re.test(l));
  if (h < 0) { while (L.length && !L[L.length - 1].trim()) L.pop(); L.push('', '## ' + heading, block, ''); return L.join('\n'); }
  let e = h + 1; while (e < L.length && !/^#{1,6}\s/.test(L[e])) e++;
  let at = e; while (at > h + 1 && !L[at - 1].trim()) at--;
  if (at > h + 1 && /^\s*[-*+] \[ \]\s*$/.test(L[at - 1])) L[at - 1] = block; // remplace la case vide du modèle
  else L.splice(at, 0, block);
  return L.join('\n');
}
function appendTo(path, { text, task, due }) {
  const n = notes[path]; if (!n) return;
  const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
  let block;
  if (task) { const tl = lines.filter(l => TASK.test(l)); block = (tl.length ? tl : [`- [ ] ${lines.join(' — ')}`]).map(l => due && !/📅/u.test(l) ? `${l} 📅 ${due}` : l).join('\n'); }
  else block = lines.length === 1 && !/^[-*+#>]/.test(lines[0]) ? `- ${lines[0]}` : text.trim();
  saveNote(path, insertUnder(n.text, task ? 'Tâches' : 'Notes', block));
}

/* ---------- Affichage Markdown ---------- */
function inline(s) {
  let t = esc(s); const codes = [];
  t = t.replace(/`([^`]+)`/g, (m, c) => `\u0000${codes.push(c) - 1}\u0000`)
    .replace(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, (m, a) => isImgName(unesc(a)) ? `<img class="att" data-att="${a.trim()}" alt="">` : m)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, u) => /^https?:/.test(unesc(u)) ? `<img class="att" src="${u}" alt="${alt}">` : `<img class="att" data-att="${(() => { try { return decodeURIComponent(unesc(u)); } catch { return unesc(u); } })().split('/').pop()}" alt="${alt}">`)
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (m, a, b) => `<a href="#" data-wl="${a.trim()}" class="${findByTitle(unesc(a.trim())) ? '' : 'miss'}">${b || a}</a>`)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (m, p, u) => `${p}<a href="${u}" target="_blank" rel="noopener">${u.length > 46 ? u.slice(0, 44) + '…' : u}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<i>$2</i>')
    .replace(/==([^=]+)==/g, '<mark class="mark">$1</mark>')
    .replace(/(^|\s)#([\p{L}\p{N}_/-]+)/gu, '$1<span class="tg">#$2</span>')
    .replace(/📅\s*(\d{4}-\d{2}-\d{2})/gu, (m, d) => `<span class="due ${d < today() ? 'late' : ''}">→ ${dueLabel(d)}</span>`)
    .replace(/✅\s*(\d{4}-\d{2}-\d{2})/gu, (m, d) => `<span class="due">✓ ${frDate(d, { day: 'numeric', month: 'short' })}</span>`);
  return t.replace(/\u0000(\d+)\u0000/g, (m, i) => `<code>${codes[i]}</code>`);
}
function md(src, offset = 0) {
  const L = src.split('\n'); let h = '', para = [], list = null;
  const fP = () => { if (para.length) { h += `<p>${para.map(inline).join('<br>')}</p>`; para = []; } };
  const fL = () => { if (list) { h += `</${list}>`; list = null; } };
  const oL = t => { if (list !== t) { fL(); h += `<${t}>`; list = t; } };
  for (let i = 0; i < L.length; i++) {
    const l = L[i]; let m;
    if (/^\s*```/.test(l)) { fP(); fL(); const c = []; i++; while (i < L.length && !/^\s*```/.test(L[i])) c.push(L[i++]); h += `<pre><code>${esc(c.join('\n'))}</code></pre>`; continue; }
    if ((m = TASK.exec(l))) { fP(); fL(); const done = m[2] !== ' ', ind = Math.min(4, Math.floor(m[1].replace(/\t/g, '  ').length / 2)); h += `<div class="task ${done ? 'done' : ''}" style="margin-left:${ind * 22}px"><button class="ck" data-tl="${offset + i}" aria-label="${done ? 'Rouvrir' : 'Cocher'}"></button><span class="tx">${inline(m[3]) || '&nbsp;'}</span></div>`; continue; }
    if ((m = /^(#{1,6})\s+(.*)$/.exec(l))) { fP(); fL(); const n = Math.min(5, m[1].length + 2); h += `<h${n}>${inline(m[2])}</h${n}>`; continue; }
    if ((m = /^\s*[-*+]\s+(.*)$/.exec(l))) { fP(); oL('ul'); h += `<li>${inline(m[1])}</li>`; continue; }
    if ((m = /^\s*\d+[.)]\s+(.*)$/.exec(l))) { fP(); oL('ol'); h += `<li>${inline(m[1])}</li>`; continue; }
    if ((m = /^>\s?(.*)$/.exec(l))) { fP(); fL(); h += `<blockquote>${inline(m[1])}</blockquote>`; continue; }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)) { fP(); fL(); h += '<hr>'; continue; }
    if (!l.trim()) { fP(); fL(); continue; }
    fL(); para.push(l);
  }
  fP(); fL(); return h;
}

/* ==========================================================
   Calques (page de note / feuille de formulaire) et toast
   ========================================================== */
let ov = null, ovClose = null, afterBack = null;
function layer(title, html, { page = false, onClose, actions = '' } = {}) {
  if (!ov) {
    ov = document.createElement('div'); ov.className = 'ov'; ov.hidden = true;
    ov.innerHTML = `<div class="pan" role="dialog" aria-modal="true"><div class="ph"><button class="ib" data-close>${ico('x')}</button><h2></h2><div class="pa" style="display:flex;gap:2px"></div></div><div class="pb"></div></div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('[data-close]')) closeLayer(); });
    addEventListener('popstate', () => { if (!ov.hidden) doClose(); const f = afterBack; afterBack = null; f?.(); });
  }
  const was = !ov.hidden;
  if (was && ovClose) { const f = ovClose; ovClose = null; f(); }
  ov.classList.toggle('page', page);
  $('[data-close]', ov).innerHTML = ico(page ? 'back' : 'x');
  $('h2', ov).textContent = title;
  $('.pa', ov).innerHTML = actions;
  const b = $('.pb', ov); b.innerHTML = html; b.scrollTop = 0; hydrate(b);
  ovClose = onClose || null;
  if (!was) { ov.hidden = false; document.body.style.overflow = 'hidden'; history.pushState({ ov: 1 }, ''); }
  return $('.pan', ov);
}
function doClose() { ov.hidden = true; document.body.style.overflow = ''; $('.pb', ov).innerHTML = ''; const f = ovClose; ovClose = null; f?.(); }
function closeLayer(then) {
  if (!ov || ov.hidden) { then?.(); return; }
  if (history.state?.ov) { afterBack = then || null; history.back(); } else { doClose(); then?.(); }
}
addEventListener('keydown', e => { if (e.key === 'Escape' && ov && !ov.hidden) closeLayer(); });
let toastEl, toastT;
function toast(msg) {
  if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
  toastEl.textContent = msg; toastEl.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

/* ==========================================================
   Écrans
   ========================================================== */
const UI = read('ui', {}) || {};
const VIEWS = { today: "Aujourd'hui", boite: 'Boîte de réception', projets: 'Projets', taches: 'Tâches', notes: 'Notes' };
let view = VIEWS[UI.view] ? UI.view : 'today';
let sphere = UI.sphere || '', projFilter = 'actif', showDone = false, nq = '';
const saveUI = () => { UI.view = view; UI.sphere = sphere; write('ui', UI); };
const inS = x => !sphere || x.dom === sphere;
const inS2 = t => inS(t.note);
let TK = [];
const dot = s => s ? `<span class="dot" style="--c:${sc(s)}"></span>` : '';
const lbl = (t, more = '', go = '', cls = '') => `<div class="lbl ${cls}"><b>${esc(t)}</b>${more ? `<a class="more" href="#" data-go="${go}">${esc(more)}</a>` : ''}</div>`;
const domsHTML = () => `<div class="doms" role="tablist">${[['', 'Tout'], ...SPHERES.map(s => [s.id, s.id])].map(([k, l]) => `<button class="${sphere === k ? 'on' : ''}" data-sph="${esc(k)}" style="--c:${k ? sc(k) : 'var(--ink)'}">${dot(k)}${esc(l)}</button>`).join('')}</div>`;
function taskRow(t, ctx = true) {
  const i = TK.push(t) - 1, late = !t.done && t.due && t.due < today();
  const bits = [t.due && !t.done ? `<span class="${late ? 'late' : ''}">${dueLabel(t.due)}</span>` : '', t.done && t.doneAt ? `fait ${frDate(t.doneAt, { day: 'numeric', month: 'short' })}` : '', ctx ? esc(t.note.title) : ''].filter(Boolean);
  return `<div class="row wrap ${t.done ? 'done' : ''}"><button class="ck" data-tk="${i}" aria-label="${t.done ? 'Rouvrir' : 'Cocher'}"></button><span class="m clk" data-open="${esc(t.path)}" style="cursor:pointer"><span class="t">${inline(t.text)}</span>${bits.length ? `<span class="s meta">${ctx && t.note.dom ? dot(t.note.dom) + ' ' : ''}${bits.join(' · ')}</span>` : ''}</span></div>`;
}
function projRow(p) {
  const ts = tasksOf(p), d = ts.filter(t => t.done).length, nx = ts.find(t => !t.done), pc = ts.length ? Math.round(d * 100 / ts.length) : 0;
  const late = isISO(p.fm.echeance) && p.fm.echeance < today() && p.fm.statut !== 'terminé';
  return `<button class="row" data-open="${esc(p.path)}"><span class="gl" style="color:${sc(p.dom)}">${ico('proj', 18)}</span><span class="m"><span class="t" style="font-family:var(--serif);font-size:16.5px">${esc(p.title)}</span><span class="s">${nx ? '→ ' + esc(plain(nx.text)) : ts.length ? 'Tout est fait' : 'Aucune tâche'}</span><span class="bar" style="--c:${sc(p.dom)}"><i style="width:${pc}%"></i></span></span><span class="r">${isISO(p.fm.echeance) ? `<span class="${late ? 'late' : ''}">${frDate(p.fm.echeance, { day: 'numeric', month: 'short' })}</span><br>` : ''}${ts.length ? `${d}/${ts.length}` : ''}</span></button>`;
}
// Mini bloc d'instruments en tête de chaque écran (touche HUD)
const z3 = n => String(n).padStart(3, '0');
const ring = () => `<svg class="mr" viewBox="0 0 20 20" aria-hidden="true"><circle class="a" cx="10" cy="10" r="8.5"/><circle class="b" cx="10" cy="10" r="5"/><circle class="d" cx="10" cy="10" r="1.6"/></svg>`;
const hudm = (left, right = '', cls = '') => `<div class="hudm brk ${cls}" aria-hidden="true">${ring()}<span>${left}</span>${right ? `<span class="rt">${right}</span>` : ''}</div>`;
const askRow = x => `<button class="row" data-open="${esc(x.path)}"><span class="gl ask">◆</span><span class="m"><span class="t">${esc(x.title)}</span><span class="s">${esc(plain(x.fm.consigne || '') || excerpt(x) || 'Consigne dans la note')}</span></span><span class="r">${x.fm.demande ? frDate(x.fm.demande, { day: 'numeric', month: 'short' }) : ''}</span></button>`;
const noteRow = x => `<button class="row" data-open="${esc(x.path)}"><span class="gl${x.ask ? ' ask' : ''}">${x.ask ? '◆' : dot(x.dom) || '<span class="dot" style="--c:var(--line)"></span>'}</span><span class="m"><span class="t">${esc(x.title)}</span><span class="s">${esc(excerpt(x) || x.sub || KIND(x.kind)?.label || '')}</span></span><span class="r">${x.stamp ? frDate(new Date(x.stamp).toISOString().slice(0, 10), { day: 'numeric', month: 'short' }) : ''}</span></button>`;

function shell() {
  document.body.innerHTML = `<div class="app">
    <aside class="side">
      <div class="brand">${ring()}Cerveau</div><div class="kick">Second cerveau · PARA</div>
      <button class="btn capb" data-cap>${ico('plus', 18)} Capturer <span style="margin-left:auto;font:500 11px var(--mono);opacity:.6">N</span></button>
      ${['today', 'boite', 'projets', 'taches', 'notes'].map(v => `<button class="nav" data-view="${v}">${ico({ today: 'today', boite: 'inbox', projets: 'proj', taches: 'task', notes: 'notes' }[v], 18)}${VIEWS[v]}<span class="c" data-count="${v}"></span></button>`).join('')}
      <div class="sep">Domaines</div>
      <div id="sideDoms"></div>
      <div class="sep">Outils</div>
      <button class="nav" data-act="journal">${ico('journal', 18)}Journal du jour</button>
      <button class="nav" data-act="review">${ico('review', 18)}Revue de la semaine</button>
      <button class="nav" data-act="search">${ico('search', 18)}Rechercher<span class="c">/</span></button>
      <div class="bottom"><span data-sync class="sync"></span><span data-synct style="flex:1"></span><button class="ib" data-act="settings" aria-label="Réglages">${ico('set')}</button></div>
    </aside>
    <main class="main"><div class="col">
      <header class="top"><div class="tt"><div class="kick" id="kick"></div><h1 id="ttl"></h1></div>
        <div class="acts"><button class="ib" data-act="sync" aria-label="Synchroniser"><span data-sync class="sync"></span></button><button class="ib" data-view="boite" aria-label="Boîte">${ico('inbox')}<span class="bdg" id="bdg" hidden></span></button><button class="ib" data-act="search" aria-label="Rechercher">${ico('search')}</button><button class="ib" data-act="settings" aria-label="Réglages">${ico('set')}</button></div>
      </header>
      <div id="view"></div>
      <p class="foot">Cerveau · v1.6.1</p>
    </div></main>
    <nav class="tabs">
      <button data-view="today">${ico('today')}Aujourd’hui</button><button data-view="projets">${ico('proj')}Projets</button>
      <button class="cap" data-cap aria-label="Capturer">${ico('plus')}</button>
      <button data-view="taches">${ico('task')}Tâches</button><button data-view="notes">${ico('notes')}Notes</button>
    </nav></div>`;
  const top = $('.top');
  addEventListener('scroll', () => top.classList.toggle('stuck', scrollY > 8), { passive: true });
}

function render() {
  TK = [];
  const I = buildIndex();
  const late = I.tasks.filter(t => !t.done && t.due && t.due < today());
  $('#kick').textContent = view === 'today' ? frDate(today(), { weekday: 'long', day: 'numeric', month: 'long' }) : (sphere || 'Tous les domaines');
  $('#ttl').textContent = view === 'today' ? (new Date().getHours() < 18 && new Date().getHours() >= 5 ? 'Bonjour.' : 'Bonsoir.') : VIEWS[view];
  const bdg = $('#bdg'); bdg.hidden = !I.box.length; bdg.textContent = I.box.length;
  const counts = { boite: I.box.length, projets: I.projs.filter(p => (p.fm.statut || 'actif') === 'actif' && inS(p)).length, taches: I.tasks.filter(t => !t.done && t.due && t.due <= today() && inS2(t)).length || '', notes: I.idx.filter(inS).length };
  $$('[data-count]').forEach(el => el.textContent = counts[el.dataset.count] ?? '');
  $('#sideDoms').innerHTML = [['', 'Tout'], ...SPHERES.map(s => [s.id, s.id])].map(([k, l]) => `<button class="nav ${sphere === k ? 'on' : ''}" data-sph="${esc(k)}">${k ? dot(k) : '<span class="dot" style="--c:var(--ink)"></span>'}${esc(l)}</button>`).join('');
  $$('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === view));
  $('#view').innerHTML = { today: vToday, projets: vProjets, taches: vTaches, notes: vNotes, boite: vBoite }[view](I, late);
  bindView(); hydrate($('#view'));
  if (!splashing && boot && meta.last) { boot = false; bootFX($('#view')); }
  if (!splashing && view === 'today' && !typed && meta.last) typeLead();
  paint(sstate, serr);
  document.title = (I.box.length ? `(${I.box.length}) ` : '') + 'Cerveau';
}
// La phrase du jour s'écrit lettre par lettre, une seule fois à l'ouverture
let typed = false;
function typeLead() {
  const el = $('.lead'); if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) { typed = true; el?.classList.remove('wait'); return; }
  typed = true;
  const full = el.innerHTML, pr = $('.pr', el).outerHTML, txt = el.textContent.replace(/^›/, '');
  let i = 0; el.classList.add('typing'); el.classList.remove('wait'); el.innerHTML = pr + '<span class="caret"></span>';
  const step = () => {
    if (!el.isConnected) return;
    i += 1; el.innerHTML = pr + esc(txt.slice(0, i)) + '<span class="caret"></span>';
    if (i < txt.length) setTimeout(step, txt[i - 1] === ' ' ? 55 : 32 + Math.random() * 30);
    else { el.innerHTML = full + '<span class="caret"></span>'; setTimeout(() => { el.classList.add('glx'); setTimeout(() => { el.classList.remove('typing'); }, 220); setTimeout(() => { el.classList.remove('glx'); $('.caret', el)?.classList.add('off'); }, 650); }, 1400); }
  };
  setTimeout(step, 1100); // après la séquence d’allumage du HUD
}
function go(v) { if (v !== view) boot = true; view = v; saveUI(); scrollTo({ top: 0 }); render(); }
// Séquence d'allumage du HUD (au lancement et à chaque changement d'écran) : coins qui se referment, compteurs qui défilent
let boot = true, splashing = false;
function bootFX(root) {
  if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const blocks = $$('.hud, .hudm', root); if (!blocks.length) return;
  blocks.forEach(b => { b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); });
  $$('.hud b, .hudm b', root).forEach(b => {
    const m = /^(\d+)(.*)$/.exec(b.textContent.trim()); if (!m) return;
    const end = +m[1], pad = m[1].length, rest = m[2], t0 = performance.now() + 350, d = 1300;
    const f = now => { if (!b.isConnected) return; const k = Math.max(0, Math.min(1, (now - t0) / d)); const v = k < 1 ? Math.floor(end * (1 - (1 - k) ** 3)) : end; b.textContent = String(v).padStart(pad, '0') + rest; if (k < 1) requestAnimationFrame(f); };
    b.textContent = '0'.repeat(pad) + rest; requestAnimationFrame(f);
  });
}

/* ---------- Aujourd'hui ---------- */
function vToday(I, lateAll) {
  if (!ghReady() && !Object.keys(notes).length) return `<p class="lead">Bienvenue. Pour retrouver tes notes sur le téléphone <em>et</em> l'ordinateur, relie Cerveau à ton dépôt GitHub privé (le même que Quotidien).</p><div class="btns"><button class="btn" data-act="settings">Relier mon dépôt</button></div>`;
  if (ghReady() && !meta.last && !Object.keys(notes).length) return sstate === 'err' ? `<p class="lead">Impossible d'ouvrir le dépôt : ${esc(serr)}.</p><div class="btns"><button class="btn" data-act="settings">Vérifier les réglages</button></div>` : `<div class="spin"></div><p class="hint" style="text-align:center">Chargement de tes notes…</p>`;
  const T = I.tasks.filter(t => !t.done && inS2(t));
  const late = T.filter(t => t.due && t.due < today()).sort((a, b) => a.due.localeCompare(b.due)), tod = T.filter(t => t.due === today());
  const week = T.filter(t => t.due > today() && t.due <= addDays(today(), 7)).sort((a, b) => a.due.localeCompare(b.due));
  const projs = I.projs.filter(p => (p.fm.statut || 'actif') === 'actif' && inS(p)).sort((a, b) => (a.fm.echeance || '9').localeCompare(b.fm.echeance || '9'));
  const recent = I.idx.filter(x => inS(x) && x.kind !== 'boite').sort((a, b) => b.stamp - a.stamp).slice(0, 5);
  const revDue = !UI.review || daysTo(UI.review) <= -7;
  const lead = late.length ? `Il y a <em>${plural(late.length, 'tâche')} en retard</em>. On commence par « ${esc(plain(late[0].text))} » ?`
    : I.box.length > 5 ? `<em>${I.box.length} choses</em> attendent dans la boîte. Deux minutes de tri, et la tête est plus légère.`
    : tod.length ? `<em>${plural(tod.length, 'chose')}</em> à faire aujourd'hui${week.length ? `, ${week.length} d'ici une semaine` : ''}.`
    : !projs.length ? `Aucun projet en cours${sphere ? ' ici' : ''}. Un projet, c'est un objectif avec une fin : <em>lance le premier</em>.`
    : revDue ? `Tout est calme. C'est <em>le bon moment pour la revue</em> de la semaine.`
    : `Rien d'urgent. Une idée qui passe ? <em>Capture-la</em>, ta tête n'est pas faite pour stocker.`;
  const pend = Object.values(notes).filter(n => n.dirty).length;
  const open = I.tasks.filter(t => !t.done).length, all = I.tasks.length, seg = all ? Math.round((all - open) / all * 10) : 0, z = n => String(n).padStart(3, '0');
  const st = !ghReady() ? 'Mode local' : sstate === 'err' ? 'Liaison · erreur' : pend ? `Liaison · ${pend} en attente` : 'Liaison GitHub · OK';
  const hud = `<div class="hud" aria-hidden="true"><svg class="hud-ring" viewBox="0 0 40 40"><circle class="t" cx="20" cy="20" r="19.4"/><path class="sw" d="M20 20 L20 3 A17 17 0 0 1 34.7 11.5 Z"/><circle class="a" cx="20" cy="20" r="17.2"/><circle class="b" cx="20" cy="20" r="13"/><circle class="c" cx="20" cy="20" r="8"/><circle class="d" cx="20" cy="20" r="3"/></svg>
    <div class="hud-d"><div class="hud-t"><i class="blip"></i><span>${st}</span><span class="clk" data-clock>${new Date().toLocaleTimeString('fr-FR')}</span></div>
    <div class="hud-g"><span><b>${z(I.idx.length)}</b>Notes</span><span><b>${z(I.box.length)}</b>Boîte</span><span><b>${z(open)}</b>Tâches</span><span class="${I.asks.length ? 'hot' : ''}"><b>${z(I.asks.length)}</b>Assistant</span><span class="seg" title="Tâches faites">${Array.from({ length: 10 }, (_, i) => `<i class="${i < seg ? 'on' : ''}"></i>`).join('')}</span></div></div></div>`;
  let h = domsHTML() + hud + `<p class="lead${typed ? '' : ' wait'}"><span class="pr">›</span>${lead}</p>`;
  if (late.length || tod.length) h += lbl('À faire aujourd’hui', 'Toutes les tâches', 'taches', late.length ? '' : '') + `<div class="list">${[...late, ...tod].slice(0, 8).map(t => taskRow(t)).join('')}</div>`;
  if (I.box.length) h += lbl(`Boîte de réception · ${I.box.length}`, 'Trier', 'boite') + `<div class="list">${I.box.slice(0, 3).map(noteRow).join('')}</div>`;
  if (I.asks.length) h += lbl(`Pour l’assistant · ${I.asks.length}`) + `<div class="list">${I.asks.map(askRow).join('')}</div>`;
  if (week.length) h += lbl('Cette semaine') + `<div class="list">${week.slice(0, 6).map(t => taskRow(t)).join('')}</div>`;
  h += lbl('Projets en cours', projs.length ? 'Tous' : '', 'projets') + (projs.length ? `<div class="list">${projs.slice(0, 5).map(projRow).join('')}</div>` : `<div class="list"><p class="empty">Aucun projet en cours.</p></div><div class="btns"><button class="btn line" data-act="newproj">＋ Nouveau projet</button></div>`);
  h += `<div class="duo"><button data-act="journal"><b>Journal du jour</b><small>${cap1(frDate(today(), { weekday: 'long', day: 'numeric', month: 'long' }))}</small></button><button data-act="review"><b>Revue de la semaine</b><small>${UI.review ? 'Dernière le ' + frDate(UI.review, { day: 'numeric', month: 'short' }) : 'Jamais faite'}${revDue ? ' · <span style="color:var(--acc);font-weight:700">à faire</span>' : ''}</small></button></div>`;
  if (recent.length) h += lbl('Modifiées récemment') + `<div class="list">${recent.map(noteRow).join('')}</div>`;
  return h;
}

/* ---------- Boîte ---------- */
function vBoite(I) {
  if (!I.box.length) return `<p class="lead">Boîte vide. <em>Rien ne traîne</em>, ni ici ni dans ta tête.</p><div class="btns"><button class="btn" data-cap>＋ Capturer</button></div>`;
  return hudm(`File d'attente ▸ <b>${z3(I.box.length)}</b> élément${I.box.length > 1 ? 's' : ''}`, '<span class="blink">● Tri requis</span>') + `<p class="lead">Pour chaque élément, une seule question : <em>où est-ce que ça me sera utile ?</em></p><div class="btns" style="margin-bottom:6px"><button class="btn" data-act="triall">Trier pas à pas (${I.box.length})</button></div>` +
    `<div class="list" style="margin-top:14px">${I.box.map(x => `<div class="row"><span class="gl">${dot(x.dom) || '<span class="dot" style="--c:var(--line)"></span>'}</span><span class="m"><span class="t clk" data-open="${esc(x.path)}" style="cursor:pointer;white-space:normal;font-family:var(--serif);font-size:16.5px">${esc(x.title)}</span>${x.body.trim() ? `<div class="doc" style="font-size:13.5px;color:var(--ink2);max-height:120px;overflow:hidden;margin-top:4px">${md(x.body)}</div>` : ''}<div class="btns" style="margin-top:8px"><button class="btn sm" data-classify="${esc(x.path)}" style="flex:0">Trier</button><button class="btn sm line" data-open="${esc(x.path)}" style="flex:0">Ouvrir</button></div></span><span class="r">${x.fm.cree ? frDate(x.fm.cree, { day: 'numeric', month: 'short' }) : ''}</span></div>`).join('')}</div>`;
}

/* ---------- Projets & domaines ---------- */
function vProjets(I) {
  const isP = x => x.kind === 'projet' || (x.kind === 'archive' && x.fm.type === 'projet');
  const all = I.idx.filter(x => isP(x) && inS(x)), st = x => x.fm.statut || 'actif';
  const inF = (x, k) => st(x) === k && (k === 'terminé' || x.kind === 'projet');
  const L = all.filter(x => inF(x, projFilter)).sort((a, b) => (a.fm.echeance || '9').localeCompare(b.fm.echeance || '9') || byTitle(a, b));
  const act = I.projs.filter(x => (x.fm.statut || 'actif') === 'actif' && inS(x)), at = act.flatMap(tasksOf), pc = at.length ? Math.round(at.filter(t => t.done).length * 100 / at.length) : 0;
  let h = domsHTML() + hudm(`Module projets ▸ <b>${z3(act.length)}</b> en cours · <b>${z3(I.doms.filter(inS).length)}</b> domaines`, `Avancement <b>${pc}%</b>`) + `<div class="chips">${STATUTS.map(([k, l]) => `<button class="chip ${projFilter === k ? 'on' : ''}" data-pf="${k}">${l} <span style="opacity:.6">${all.filter(x => inF(x, k)).length}</span></button>`).join('')}</div>`;
  h += `<div class="list">${L.length ? L.map(projRow).join('') : `<p class="empty">${projFilter === 'actif' ? 'Aucun projet en cours.' : 'Rien ici.'}</p>`}</div><div class="btns"><button class="btn line" data-act="newproj">＋ Nouveau projet</button></div>`;
  const D = I.doms.filter(inS).sort(byTitle);
  h += lbl('Domaines', '＋ Ajouter', 'newdom') + `<div class="list">${D.length ? D.map(x => { const o = tasksOf(x).filter(t => !t.done).length; return `<button class="row" data-open="${esc(x.path)}"><span class="gl">${dot(x.dom)}</span><span class="m"><span class="t" style="font-family:var(--serif);font-size:16.5px">${esc(x.title)}</span><span class="s">${esc(excerpt(x))}</span></span><span class="r">${o ? plural(o, 'tâche') : ''}</span></button>`; }).join('') : '<p class="empty">Aucun domaine.</p>'}</div>`;
  return h;
}

/* ---------- Tâches ---------- */
function vTaches(I) {
  const all = I.tasks.filter(inS2);
  const tgt = sphere && I.doms.find(d => d.title === sphere);
  const op = all.filter(t => !t.done), lt = op.filter(t => t.due && t.due < today()).length, wk = op.filter(t => t.due && t.due <= addDays(today(), 7)).length;
  let h = domsHTML() + hudm(`<b>${z3(op.length)}</b> ouvertes · <b class="${lt ? 'warn' : ''}">${z3(lt)}</b> en retard`, `Charge 7 j <b>${z3(wk)}</b>`) + `<div class="chips"><button class="chip ${showDone ? '' : 'on'}" data-sd="0">À faire <span style="opacity:.6">${all.filter(t => !t.done).length}</span></button><button class="chip ${showDone ? 'on' : ''}" data-sd="1">Faites</button></div>`;
  h += `<div class="qadd"><span class="ck"></span><input id="qT" placeholder="Nouvelle tâche → ${esc(tgt ? tgt.title : 'boîte de réception')}" enterkeyhint="done"><button class="btn sm" id="qOk">Ajouter</button></div>`;
  if (showDone) {
    const D = all.filter(t => t.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || '')).slice(0, 60);
    return h + `<div class="list" style="border-top:0">${D.length ? D.map(t => taskRow(t)).join('') : '<p class="empty">Aucune tâche faite pour l’instant.</p>'}</div>`;
  }
  const T = all.filter(t => !t.done), td = today();
  const G = [['En retard', T.filter(t => t.due && t.due < td), 'bad'], ["Aujourd'hui", T.filter(t => t.due === td)], ['Demain', T.filter(t => t.due === addDays(td, 1))],
    ['Cette semaine', T.filter(t => t.due > addDays(td, 1) && t.due <= addDays(td, 7))], ['Plus tard', T.filter(t => t.due > addDays(td, 7))], ['Sans date', T.filter(t => !t.due)]];
  const body = G.filter(g => g[1].length).map(([l, L, c]) => lbl(`${l} · ${L.length}`, '', '', c || '') + `<div class="list">${L.sort((a, b) => (a.due || '').localeCompare(b.due || '')).map(t => taskRow(t)).join('')}</div>`).join('');
  return h + (body || `<p class="empty">Aucune tâche à faire${sphere ? ' ici' : ''}.</p>`);
}

/* ---------- Notes (PARA) ---------- */
function vNotes(I) {
  const L = I.idx.filter(inS);
  let h = domsHTML() + hudm(`Index ▸ <b>${z3(L.length)}</b> notes · <b>${z3(Object.keys(meta.files).length + meta.media.length)}</b> images`, meta.last ? `Màj ${new Date(meta.last).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Local') + `<label class="search">${ico('search')}<input id="nq" value="${esc(nq)}" placeholder="Chercher dans toutes les notes…"></label>`;
  if (nq.trim()) { const X = hits(nq); return h + `<div class="list">${X.length ? X.map(noteRow).join('') : '<p class="empty">Rien trouvé.</p>'}</div>`; }
  UI.open ||= {};
  for (const k of [...KINDS, { id: 'autre', label: 'À la racine', n: '·' }]) {
    const X = L.filter(x => x.kind === k.id).sort(k.id === 'journal' ? (a, b) => b.title.localeCompare(a.title) : (a, b) => (a.sub || '').localeCompare(b.sub || '', 'fr') || byTitle(a, b));
    if (!X.length && ['autre', 'journal'].includes(k.id)) continue;
    let rows = '', cur = null;
    for (const x of X) { if (x.sub !== cur) { cur = x.sub; if (cur) rows += `<div class="fold">${esc(cur)}</div>`; } rows += noteRow(x); }
    h += `<details class="para" data-k="${k.id}" ${UI.open[k.id] ? 'open' : ''}><summary><span class="n">${k.n}</span><b>${k.label}</b><span class="c">${X.length}</span></summary><div class="list">${rows || '<p class="empty" style="padding:6px 2px 14px">Vide.</p>'}</div></details>`;
  }
  return h + `<div class="btns"><button class="btn line" data-act="newnote">＋ Nouvelle note</button></div>`;
}
function hits(q) {
  const k = norm(q);
  return buildIndex().idx.map(x => ({ x, t: norm(x.title).includes(k) ? 2 : norm(notes[x.path].text).includes(k) ? 1 : 0 })).filter(r => r.t).sort((a, b) => b.t - a.t || b.x.stamp - a.x.stamp).map(r => r.x).slice(0, 40);
}

function bindView() {
  $$('[data-pf]').forEach(b => b.onclick = () => { projFilter = b.dataset.pf; render(); });
  $$('[data-sd]').forEach(b => b.onclick = () => { showDone = b.dataset.sd === '1'; render(); });
  $$('details.para').forEach(d => d.ontoggle = () => { UI.open[d.dataset.k] = d.open; saveUI(); });
  const qi = $('#nq'); if (qi) qi.oninput = () => { nq = qi.value; clearTimeout(qi._t); qi._t = setTimeout(() => { const p = qi.selectionStart; render(); const n = $('#nq'); n.focus(); n.setSelectionRange(p, p); }, 250); };
  const qT = $('#qT'); if (qT) {
    const add = () => {
      const t = qT.value.trim(); if (!t) return;
      const tgt = sphere && buildIndex().doms.find(d => d.title === sphere);
      if (tgt) appendTo(tgt.path, { text: t, task: true }); else createNote(uniquePath(dirOf('boite'), firstLine(t)), build({ cree: today(), domaine: sphere || undefined }, `- [ ] ${t}\n`));
      render(); $('#qT')?.focus();
    };
    $('#qOk').onclick = add; qT.onkeydown = e => { if (e.key === 'Enter') add(); };
  }
}

/* ---------- Clics communs ---------- */
const ACTS = { settings: () => settings(), search: () => search(), journal: () => journal(), review: () => review(), newproj: () => newProject(), newnote: () => editNote(null), sync: () => ghReady() ? sync() : settings(), triall: () => { const b = buildIndex().box[0]; if (b) classify(b.path, true); } };
document.addEventListener('click', e => {
  const wl = e.target.closest('[data-wl]'); if (wl) { e.preventDefault(); return openWiki(wl.dataset.wl); }
  if (e.target.closest('a[target]')) return;
  const tk = e.target.closest('[data-tk]'); if (tk) { const t = TK[+tk.dataset.tk]; if (t) { if (toggleLine(t.path, t.line, t.raw)) ping(tk); render(); } return; }
  const sp = e.target.closest('[data-sph]'); if (sp) { sphere = sp.dataset.sph; saveUI(); return render(); }
  const vw = e.target.closest('[data-view]'); if (vw) return go(vw.dataset.view);
  if (e.target.closest('[data-cap]')) return capture();
  const ac = e.target.closest('[data-act]'); if (ac) { const f = ACTS[ac.dataset.act]; if (f) { e.preventDefault(); return f(); } }
  const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); return g.dataset.go === 'newdom' ? editNote(null, { kind: 'domaine', fm: { type: 'domaine' } }) : go(g.dataset.go); }
  const cl = e.target.closest('[data-classify]'); if (cl) return classify(cl.dataset.classify, false);
  const op = e.target.closest('[data-open]'); if (op) { e.preventDefault(); return openNote(op.dataset.open); }
});
// Raccourcis clavier (ordinateur) : N = capturer, / = rechercher
addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || (ov && !ov.hidden)) return;
  if (e.key === 'n' || e.key === 'N') { e.preventDefault(); capture(); }
  else if (e.key === '/') { e.preventDefault(); search(); }
});
function openWiki(t) {
  const p = findByTitle(t); if (p) return openNote(p);
  if (confirm(`La note « ${t} » n'existe pas encore. La créer dans les ressources ?`)) { const np = createNote(uniquePath(dirOf('ressource'), t), build({ cree: today() }, '')); render(); editNote(np); }
}

/* ==========================================================
   Formulaires
   ========================================================== */
const domChips = (id, cur) => `<div class="chips" id="${id}">${[['', 'Aucun'], ...SPHERES.map(s => [s.id, s.id])].map(([k, l]) => `<button type="button" class="chip ${(cur || '') === k ? 'on' : ''}" data-v="${esc(k)}">${dot(k)}${esc(l)}</button>`).join('')}</div>`;
function chipGroup(root, id, onChange) {
  const g = $('#' + id, root);
  g.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; $$('[data-v]', g).forEach(x => x.classList.toggle('on', x === b)); onChange?.(b.dataset.v); });
  return () => $('[data-v].on', g)?.dataset.v ?? '';
}
function targetOptions(sel = '') {
  const I = buildIndex(), o = x => `<option value="${esc(x.path)}" ${x.path === sel ? 'selected' : ''}>${esc(x.title)}${x.dom && x.kind === 'projet' ? ' · ' + esc(x.dom) : ''}</option>`;
  const Pr = I.projs.filter(p => (p.fm.statut || 'actif') !== 'terminé').sort(byTitle), D = I.doms.sort(byTitle);
  return (Pr.length ? `<optgroup label="Projets">${Pr.map(o).join('')}</optgroup>` : '') + (D.length ? `<optgroup label="Domaines">${D.map(o).join('')}</optgroup>` : '');
}
function dueChips(id, cur = '') {
  const C = [['', 'Sans date'], [today(), "Aujourd'hui"], [addDays(today(), 1), 'Demain'], [nextMonday(), 'Lundi']];
  return `<div class="chips" id="${id}">${C.map(([v, l]) => `<button type="button" class="chip ${cur === v ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}<span class="chip"><input type="date" value="${C.some(c => c[0] === cur) ? '' : esc(cur)}" aria-label="Autre date"></span></div>`;
}
function dueGroup(root, id) {
  const g = $('#' + id, root), inp = $('input', g); let v = $('[data-v].on', g)?.dataset.v || inp.value || '';
  g.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; $$('[data-v]', g).forEach(x => x.classList.toggle('on', x === b)); inp.value = ''; v = b.dataset.v; });
  inp.onchange = () => { $$('[data-v]', g).forEach(x => x.classList.remove('on')); v = inp.value; };
  return () => v;
}

/* ---------- Capturer ---------- */
function capture(pre = {}) {
  let task = !!pre.task;
  const pan = layer('Capturer', `
    <div class="capw"><textarea class="big" id="capT" placeholder="Une idée, une tâche, un lien…">${esc(pre.text || '')}</textarea><span class="tag"><i class="wv"><b></b><b></b><b></b><b></b><b></b><b></b><b></b></i>Écoute</span></div>
    <div class="thumbs" id="capI"></div>
    <div class="chips" id="capK"><button type="button" class="chip ${task ? '' : 'on'}" data-v="note">Note</button><button type="button" class="chip ${task ? 'on' : ''}" data-v="tache">Tâche</button></div>
    <div class="chips" style="margin-top:6px"><button type="button" class="chip" id="capP">📷 Photo</button></div>
    <label class="askchk"><input type="checkbox" id="capA" ${pre.ask ? 'checked' : ''}> ◆ Pour l’assistant <small>la note est la consigne</small></label>
    <div id="capD" ${task ? '' : 'hidden'}><span class="sub" style="margin-top:8px">Échéance</span>${dueChips('capDue', pre.due || '')}</div>
    <span class="sub" style="margin-top:10px">Domaine</span>${domChips('capS', pre.dom ?? sphere)}
    <div class="fld" style="margin-top:12px"><label for="capTo">Ranger dans</label><select id="capTo"><option value="">Boîte de réception (je trierai plus tard)</option>${targetOptions(pre.to || '')}</select></div>
    <button class="btn block" id="capOk">Capturer</button>
    <p class="hint" style="text-align:center;margin-top:12px">Depuis une autre appli du téléphone : <b>Partager → Cerveau</b>.</p>`);
  const getS = chipGroup(pan, 'capS'), getDue = dueGroup(pan, 'capDue');
  const imgs = [];
  const drawImgs = () => { $('#capI', pan).innerHTML = imgs.map((m, i) => `<span class="th"><img src="${m.url}" alt=""><button type="button" data-rm="${i}" aria-label="Retirer">×</button></span>`).join(''); };
  const addFiles = async files => { for (const f of files) if (/^image\//.test(f.type) || /\.(jpe?g|png|gif|webp|heic|avif)$/i.test(f.name || '')) { const r = await shrink(f); imgs.push({ ...r, url: URL.createObjectURL(r.blob) }); } drawImgs(); };
  $('#capI', pan).onclick = e => { const b = e.target.closest('[data-rm]'); if (b) { imgs.splice(+b.dataset.rm, 1); drawImgs(); } };
  $('#capP', pan).onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.multiple = true; i.onchange = () => addFiles([...i.files]); i.click(); };
  if (pre.files?.length) addFiles(pre.files);
  chipGroup(pan, 'capK', v => { task = v === 'tache'; $('#capD', pan).hidden = !task; });
  setTimeout(() => $('#capT', pan)?.focus(), 120);
  $('#capT', pan).onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('#capOk', pan).click(); };
  $('#capOk', pan).onclick = async () => {
    let text = $('#capT', pan).value.trim(); if (!text && !imgs.length) return toast('Écris quelque chose');
    const btn = $('#capOk', pan); btn.disabled = true;
    const embeds = []; for (let i = 0; i < imgs.length; i++) embeds.push(`![[${await addMedia(imgs[i].blob, imgs[i].ext, i + 1)}]]`);
    const plainText = text;
    if (!text) text = `Photo du ${frDate(today(), { day: 'numeric', month: 'short' })} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}`;
    const to = $('#capTo', pan).value, due = task ? getDue() : '', dom = getS(), ask = $('#capA', pan).checked;
    if (to && notes[to] && !ask) { if (plainText || !embeds.length) appendTo(to, { text, task, due }); if (embeds.length) appendTo(to, { text: embeds.join('\n') + '\n', task: false }); toast(`Ajouté à « ${titleOf(to)} »`); }
    else {
      let b = task ? text.split('\n').filter(l => l.trim()).map(l => TASK.test(l.trim()) ? l.trim() : `- [ ] ${l.trim()}${due ? ' 📅 ' + due : ''}`).join('\n') : text;
      if (embeds.length) b = (plainText ? b + '\n\n' : '') + embeds.join('\n');
      createNote(uniquePath(dirOf('boite'), firstLine(text) || 'Capture'), build({ cree: today(), domaine: dom || undefined, ...(ask ? { assistant: 'à traiter', demande: today(), ...(to && notes[to] ? { consigne: `Concerne [[${titleOf(to)}]]` } : {}) } : {}) }, b + '\n'));
      toast(ask ? 'Confiée à l’assistant ◆' : 'Dans la boîte');
    }
    vibrate(); closeLayer(() => render()); render();
  };
}

/* ---------- Trier un élément de la boîte ---------- */
function classify(path, chain = false) {
  if (!notes[path]) return;
  const x = info(path), single = x.body.trim().split('\n').filter(l => l.trim()).length <= 1 || x.body.split('\n').every(l => !l.trim() || TASK.test(l));
  const firstDue = (/📅\s*(\d{4}-\d{2}-\d{2})/u.exec(x.body) || [])[1] || '';
  const left = buildIndex().box.length;
  const pan = layer(chain ? `Trier · ${left} restant${left > 1 ? 's' : ''}` : 'Trier', `
    <div class="fld"><label for="cT">Titre</label><input id="cT" value="${esc(x.title)}" style="font:600 17px var(--serif)"></div>
    ${x.body.trim() ? `<div class="doc" style="font-size:14px;max-height:26dvh;overflow:auto;border-left:2px solid var(--line);padding-left:12px;margin-bottom:12px">${md(x.body)}</div>` : ''}
    <span class="sub">Domaine</span>${domChips('cS', x.dom)}
    <span class="sub" style="margin-top:14px">Où le ranger ?</span>
    <div class="dest">
      <button type="button" data-d="add"><b>Dans une note</b><small>Un projet ou un domaine existant</small></button>
      <button type="button" data-d="projet"><b>Nouveau projet</b><small>Un objectif avec une fin</small></button>
      <button type="button" data-d="ressource"><b>Ressource</b><small>À garder pour plus tard</small></button>
      <button type="button" data-d="archive"><b>Archives</b><small>Plus utile, mais on garde</small></button>
    </div>
    <div id="cMore"></div>
    <div class="btns"><button class="btn bad" id="cDel">Supprimer</button>${chain ? '<button class="btn line" id="cSkip">Passer</button>' : ''}</div>`);
  const getS = chipGroup(pan, 'cS');
  const title = () => cleanTitle($('#cT', pan).value) || x.title;
  const withDom = () => { const d = getS(); return build({ ...x.fm, domaine: d || undefined }, x.body, x.order); };
  const done = (msg, openPath) => {
    toast(msg); vibrate(); render();
    if (openPath) return openNote(openPath);
    const nb = buildIndex().box.find(b => b.path !== path && notes[b.path]);
    if (chain && nb) return classify(nb.path, true);
    closeLayer(() => render()); if (chain) toast('Boîte vide');
  };
  $$('[data-d]', pan).forEach(b => b.onclick = () => {
    $$('[data-d]', pan).forEach(y => y.classList.toggle('on', y === b));
    const d = b.dataset.d, more = $('#cMore', pan);
    if (d === 'add') {
      const opts = targetOptions();
      if (!opts) { more.innerHTML = `<p class="hint" style="margin-top:10px">Aucun projet ni domaine pour l’instant : choisis « Nouveau projet ».</p>`; return; }
      more.innerHTML = `<div style="margin-top:14px;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--sheet)"><div class="fld"><label for="cTo">Note</label><select id="cTo">${opts}</select></div>
        <label style="display:flex;align-items:center;justify-content:space-between;font-weight:600;font-size:14px;margin-bottom:8px">En faire une tâche <input type="checkbox" id="cTask" ${single ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--ink)"></label>
        <div id="cDueW" ${single ? '' : 'hidden'}><span class="sub">Échéance</span>${dueChips('cDue', firstDue)}</div>
        <button class="btn block" id="cGo" style="margin-top:6px">Ranger</button></div>`;
      const getDue = dueGroup(pan, 'cDue');
      $('#cTask', pan).onchange = e => { $('#cDueW', pan).hidden = !e.target.checked; };
      $('#cGo', pan).onclick = () => {
        const to = $('#cTo', pan).value, task = $('#cTask', pan).checked;
        const text = task && single ? (title() !== x.title || !x.body.trim() ? title() : x.body.trim()) : (x.body.trim() ? (title() !== firstLine(x.body) ? `**${title()}**\n` : '') + x.body.trim() : title());
        appendTo(to, { text, task, due: task ? getDue() : '' }); deleteNote(path);
        done(`Rangé dans « ${titleOf(to)} »`);
      };
      setTimeout(() => more.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50);
      return;
    }
    more.innerHTML = '';
    if (d === 'projet') {
      const tasks = x.body.split('\n').filter(l => TASK.test(l)).join('\n'), rest = x.body.split('\n').filter(l => !TASK.test(l)).join('\n').trim();
      const np = uniquePath(dirOf('projet'), title());
      createNote(np, build({ type: 'projet', domaine: getS() || undefined, statut: 'actif', cree: x.fm.cree || today() }, `## Objectif\n${rest}\n\n## Tâches\n${tasks || '- [ ] '}\n\n## Notes\n`));
      deleteNote(path); relink(x.title, titleOf(np));
      return done('Nouveau projet créé', np);
    }
    saveNote(path, withDom()); moveNote(path, uniquePath(dirOf(d), title()));
    done(d === 'ressource' ? 'Rangé dans les ressources' : 'Archivé');
  });
  $('#cDel', pan).onclick = () => { if (!confirm(`Supprimer « ${x.title} » ?`)) return; deleteNote(path); done('Supprimé'); };
  if (chain) $('#cSkip', pan).onclick = () => { const L = buildIndex().box, i = L.findIndex(b => b.path === path), nb = L[(i + 1) % L.length]; if (nb && nb.path !== path) classify(nb.path, true); else closeLayer(); };
}

/* ---------- Lire une note ---------- */
function openNote(path) {
  if (!notes[path]) return toast('Note introuvable');
  const x = info(path), offset = notes[path].text.split('\n').length - x.body.split('\n').length;
  const ts = tasksOf(x), back = backlinks(x), isProj = x.kind === 'projet';
  const metaBits = [`<span>${esc(KIND(x.kind)?.label || 'Note')}${x.sub ? ' / ' + esc(x.sub) : ''}</span>`,
    x.dom ? `<span>${dot(x.dom)}${esc(x.dom)}</span>` : '',
    x.fm.type === 'projet' ? `<span>${esc(x.fm.statut || 'actif')}</span>` : '',
    isISO(x.fm.echeance) ? `<span class="${x.fm.echeance < today() && x.fm.statut !== 'terminé' ? 'late' : ''}">échéance ${frDate(x.fm.echeance)}</span>` : '',
    ts.length ? `<span>${ts.filter(t => t.done).length}/${ts.length} faites</span>` : '',
    x.ask ? '<span class="askb">◆ Assistant · à traiter</span>' : x.asked ? `<span class="askb done">◆ Traité${isISO(x.fm.traite) ? ' le ' + frDate(x.fm.traite, { day: 'numeric', month: 'short' }) : ''}</span>` : '',
    ...[].concat(x.fm.tags || []).map(t => `<span>#${esc(t)}</span>`)].filter(Boolean).join('');
  const pan = layer('', `
    ${hudm(`Fichier ▸ ${esc(KIND(x.kind)?.short || 'Note')}`, `${z3(notes[path].text.split('\n').length)} lignes · ${(new Blob([notes[path].text]).size / 1024).toFixed(1).replace('.', ',')} Ko`)}
    <div class="ntitle">${esc(x.title)}</div>
    <div class="nmeta">${metaBits}</div>
    ${x.ask && x.fm.consigne ? `<div class="askbox"><span>◆ Consigne pour l’assistant</span>${esc(x.fm.consigne)}</div>` : ''}
    <div class="doc scan" id="nMd">${md(x.body, offset) || '<p class="empty">Note vide. Touche le crayon pour écrire.</p>'}</div>
    ${back.length ? lbl('Mentionnée dans') + `<div class="list">${back.map(noteRow).join('')}</div>` : ''}
    <div class="btns" style="margin-top:26px">${x.kind === 'boite' ? '<button class="btn" id="nCl">Trier</button>' : ''}<button class="btn line" id="nMv">Déplacer</button><button class="btn line askbtn" id="nAsk">◆ ${x.ask ? 'Consigne' : 'Confier à l’assistant'}</button>
      ${isProj && x.fm.statut !== 'terminé' ? '<button class="btn line" id="nEnd">Projet terminé</button>' : ''}
      ${x.kind === 'archive' ? '<button class="btn line" id="nUn">Sortir des archives</button>' : x.kind !== 'boite' && !isProj ? '<button class="btn line" id="nArc">Archiver</button>' : ''}
      <button class="btn bad" id="nDel">Supprimer</button></div>
    <p class="path">${esc(path)}</p>`, { page: true, actions: `<button class="ib" id="nEd" aria-label="Modifier">${ico('edit')}</button>` });
  scanDoc($('#nMd', pan));
  $('#nMd', pan).addEventListener('click', e => {
    const b = e.target.closest('[data-tl]'); if (!b) return;
    const i = +b.dataset.tl;
    if (toggleLine(path, i, notes[path].text.split('\n')[i])) ping(b);
    const y = info(path); $('#nMd', pan).innerHTML = md(y.body, notes[path].text.split('\n').length - y.body.split('\n').length); hydrate($('#nMd', pan)); render();
  });
  const on = (s, f) => { const el = $(s, pan); if (el) el.onclick = f; };
  on('#nEd', () => editNote(path));
  on('#nCl', () => classify(path, false));
  on('#nMv', () => moveSheet(path));
  on('#nAsk', () => askSheet(path));
  on('#nEnd', () => { setFm(path, { statut: 'terminé', fini: today() }); const np = moveNote(path, uniquePath(dirOf('archive'), x.title)); vibrate(); toast('Bravo ! Projet rangé dans les archives'); render(); openNote(np); });
  on('#nArc', () => { const np = moveNote(path, uniquePath(dirOf('archive'), x.title)); toast('Archivé'); render(); openNote(np); });
  on('#nUn', () => { const k = x.fm.type === 'projet' ? 'projet' : x.fm.type === 'domaine' ? 'domaine' : 'ressource'; if (k === 'projet') setFm(path, { statut: 'actif', fini: undefined }); const np = moveNote(path, uniquePath(dirOf(k), x.title)); toast('Sorti des archives'); render(); openNote(np); });
  on('#nDel', () => { if (!confirm(`Supprimer « ${x.title} » ? (l'historique GitHub en garde une copie)`)) return; deleteNote(path); closeLayer(() => render()); render(); toast('Supprimée'); });
}

/* ---------- Confier une note à l'assistant ----------
   En-tête : assistant: à traiter | fait ; consigne ; demande (date) ; traite (date).
   L'assistant répond dans la note, sous « ## Réponse de l'assistant », puis passe la note à « fait ». */
function askSheet(path) {
  const x = info(path);
  const pan = layer('Confier à l’assistant', `<p class="hint" style="margin-top:0">« ${esc(x.title)} »</p>
    <div class="capw"><textarea class="big" id="aC" placeholder="Que dois-je en faire ? Ex. « Développe cette idée », « Fais-en un plan », « Cherche des exemples »…">${esc(x.fm.consigne || '')}</textarea><span class="tag">◆ Consigne</span></div>
    <p class="hint">La note et sa consigne seront traitées à ta prochaine demande. La réponse s'ajoutera en bas de la note.</p>
    <div class="btns">${x.ask ? '<button class="btn line" id="aOff">Retirer</button>' : ''}<button class="btn" id="aOk">${x.ask ? 'Mettre à jour' : 'Confier'}</button></div>`);
  setTimeout(() => $('#aC', pan).focus(), 120);
  $('#aOk', pan).onclick = () => { setFm(path, { assistant: 'à traiter', consigne: $('#aC', pan).value.trim().replace(/\s+/g, ' ') || undefined, demande: today(), traite: undefined }); toast('Confiée à l’assistant ◆'); vibrate(); render(); openNote(path); };
  if ($('#aOff', pan)) $('#aOff', pan).onclick = () => { setFm(path, { assistant: undefined, consigne: undefined, demande: undefined }); toast('Retirée'); render(); openNote(path); };
}

/* Le scanner : une ligne lumineuse descend la note ; chaque bloc passe du digital à sa police normale à son passage */
function scanDoc(el) {
  if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const blocks = $$('p, li, h3, h4, h5, blockquote, .task, pre, img, hr', el);
  if (!blocks.length) return;
  el.classList.add('digi');
  const line = document.createElement('div'); line.className = 'scanl'; line.innerHTML = '<span class="scant">Scan 000%</span>'; el.appendChild(line); const tag = line.firstChild;
  // La ligne avance à vitesse constante dans la mise en page réelle : chaque bloc change de police
  // à l'instant où elle le touche, et ce qui est en dessous se recale avant d'être atteint (pas de décalage).
  const v = Math.max(.2, el.offsetHeight / 3200); let y = 0, last = performance.now() + 500;
  const tick = now => {
    if (!el.isConnected) return;
    if (now > last) { y += (now - last) * v; last = now; }
    for (const b of blocks) if (!b.classList.contains('std') && b.offsetTop <= y) { b.classList.add('std', 'glx'); setTimeout(() => b.classList.remove('glx'), 280); }
    const end = el.offsetHeight;
    tag.textContent = `Scan ${String(Math.min(100, Math.round(y / end * 100))).padStart(3, '0')}%`;
    line.style.top = Math.min(y, end) + 'px';
    if (y < end) requestAnimationFrame(tick);
    else { el.classList.remove('digi'); blocks.forEach(b => b.classList.remove('std')); line.animate([{ opacity: 1 }, { opacity: 0 }], 300).onfinish = () => line.remove(); }
  };
  requestAnimationFrame(tick);
}

/* ---------- Déplacer ---------- */
function moveSheet(path) {
  const x = info(path);
  const pan = layer('Déplacer', `<p class="hint" style="margin-top:0">« ${esc(x.title)} »</p>
    <span class="sub">Ranger dans</span><div class="chips" id="mK">${KINDS.filter(k => k.id !== 'journal').map(k => `<button type="button" class="chip ${k.id === x.kind ? 'on' : ''}" data-v="${k.id}">${k.label}</button>`).join('')}</div>
    <span class="sub" style="margin-top:10px">Domaine</span>${domChips('mS', x.dom)}
    <div class="fld" style="margin-top:12px"><label for="mSub">Sous-dossier (facultatif)</label><input id="mSub" value="${esc(x.sub.replace(/ \/ /g, '/'))}" placeholder="Ex. Recettes, Clients/2026…"></div>
    <button class="btn block" id="mOk">Déplacer</button>`);
  const getK = chipGroup(pan, 'mK'), getS = chipGroup(pan, 'mS');
  $('#mOk', pan).onclick = () => {
    const k = getK() || x.kind, sub = $('#mSub', pan).value.split('/').map(cleanTitle).filter(Boolean).join('/');
    const patch = { domaine: getS() || undefined };
    if (k === 'projet' && x.fm.type !== 'projet') Object.assign(patch, { type: 'projet', statut: 'actif' });
    if (k === 'domaine' && !x.fm.type) patch.type = 'domaine';
    setFm(path, patch);
    const dir = dirOf(k) + (sub ? '/' + sub : ''), np = folderOf(path) === dir ? path : moveNote(path, uniquePath(dir, x.title));
    toast('Déplacée'); render(); openNote(np);
  };
}

/* ---------- Écrire / modifier ---------- */
function newProject() { editNote(null, { kind: 'projet', fm: { type: 'projet', statut: 'actif', domaine: sphere || undefined }, body: PROJ_BODY }); }
function editNote(path, preset = {}) {
  const isNew = !path || !notes[path];
  const x = isNew ? { path: null, title: preset.title || '', kind: preset.kind || 'ressource', fm: { cree: today(), ...(preset.fm || {}) }, order: [], body: preset.body || '' } : info(path);
  let kind = x.kind, saved = false;
  const projFields = () => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div class="fld"><label for="eSt">Statut</label><select id="eSt">${STATUTS.map(([k]) => `<option ${(x.fm.statut || 'actif') === k ? 'selected' : ''}>${k}</option>`).join('')}</select></div><div class="fld"><label for="eEch">Échéance</label><input type="date" id="eEch" value="${esc(isISO(x.fm.echeance) ? x.fm.echeance : '')}"></div></div>`;
  const pan = layer(isNew ? (kind === 'projet' ? 'Nouveau projet' : kind === 'domaine' ? 'Nouveau domaine' : 'Nouvelle note') : 'Modifier', `
    <textarea id="eT" class="ntitle" rows="1" placeholder="${kind === 'projet' ? 'Nom du projet' : 'Titre'}" style="width:100%;border:0;background:none;outline:none;padding:0;resize:none;overflow:hidden;color:inherit">${esc(x.title)}</textarea>
    ${isNew && !preset.kind ? `<div class="chips" id="eK">${['ressource', 'projet', 'domaine', 'boite'].map(k => `<button type="button" class="chip ${k === kind ? 'on' : ''}" data-v="${k}">${KIND(k).short}</button>`).join('')}</div>` : ''}
    ${domChips('eS', x.fm.domaine || '')}
    <div id="eP" style="margin-top:8px">${kind === 'projet' ? projFields() : ''}</div>
    <div class="tool"><button type="button" data-t="task">[ ] tâche</button><button type="button" data-t="due">date</button><button type="button" data-t="h">## titre</button><button type="button" data-t="li">- liste</button><button type="button" data-t="link">[[lien]]</button><button type="button" data-t="b">**gras**</button><button type="button" data-t="mk">==surligner==</button></div>
    <textarea class="ed" id="eB" placeholder="Écris ici. « - [ ] » crée une tâche, « [[Titre]] » un lien vers une autre note.">${esc(x.body)}</textarea>
    <div class="btns"><button class="btn" id="eOk">Enregistrer</button></div>`, { page: true, onClose: () => { if (!saved && changed()) { commit(); toast('Enregistrée'); render(); } } });
  const ta = $('#eB', pan), tIn = $('#eT', pan), pBox = $('#eP', pan), getS = chipGroup(pan, 'eS'); // références gardées : le calque est vidé avant onClose
  const st = () => $('#eSt', pBox)?.value, ech = () => $('#eEch', pBox)?.value;
  const fit = () => { tIn.style.height = 'auto'; tIn.style.height = tIn.scrollHeight + 'px'; }; // titre sur plusieurs lignes si besoin
  tIn.oninput = () => { if (/\n/.test(tIn.value)) tIn.value = tIn.value.replace(/\n/g, ' '); fit(); }; tIn.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); ta.focus(); } }; requestAnimationFrame(fit);
  const snap = () => JSON.stringify([tIn.value.trim(), getS(), ta.value, st() ?? '', ech() ?? '']), initial = snap();
  const changed = () => { const t = tIn.value.trim(), b = ta.value; if (isNew && !t && !b.trim()) return false; if (isNew && kind === 'projet' && !t && b === PROJ_BODY) return false; return snap() !== initial; };
  if ($('#eK', pan)) chipGroup(pan, 'eK', v => { kind = v; pBox.innerHTML = v === 'projet' ? projFields() : ''; if (v === 'projet' && !ta.value.trim()) ta.value = PROJ_BODY; if (v !== 'projet' && ta.value === PROJ_BODY) ta.value = ''; });
  function commit() {
    const title = cleanTitle(tIn.value) || firstLine(ta.value) || 'Sans titre';
    const fm = { ...x.fm, domaine: getS() || undefined };
    if (kind === 'projet') Object.assign(fm, { type: 'projet', statut: st() || 'actif', echeance: ech() || undefined });
    if (kind === 'domaine') fm.type = 'domaine';
    if (!isNew) fm.modifie = today();
    const text = build(fm, ta.value.replace(/\s+$/, '') + '\n', x.order);
    saved = true;
    if (isNew) return createNote(uniquePath(dirOf(kind), title), text);
    let p = path;
    if (title !== x.title) p = moveNote(path, uniquePath(folderOf(path), title, path));
    return saveNote(p, text);
  }
  const linePre = pre => { const s = ta.selectionStart, v = ta.value, ls = v.lastIndexOf('\n', s - 1) + 1; ta.value = v.slice(0, ls) + pre + v.slice(ls); ta.selectionStart = ta.selectionEnd = s + pre.length; ta.focus(); };
  const wrap = (a, b) => { const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value; ta.value = v.slice(0, s) + a + v.slice(s, e) + b + v.slice(e); ta.selectionStart = s + a.length; ta.selectionEnd = e + a.length; ta.focus(); };
  $$('[data-t]', pan).forEach(b => b.onclick = () => ({ task: () => linePre('- [ ] '), li: () => linePre('- '), h: () => linePre('## '), link: () => wrap('[[', ']]'), b: () => wrap('**', '**'), mk: () => wrap('==', '=='), due: () => wrap(` 📅 ${addDays(today(), 1)}`, '') })[b.dataset.t]());
  // Entrée dans une liste : la ligne suivante reprend la puce ou la case
  ta.addEventListener('beforeinput', e => {
    if (!['insertLineBreak', 'insertParagraph'].includes(e.inputType) || ta.selectionStart !== ta.selectionEnd) return;
    const s = ta.selectionStart, v = ta.value, ls = v.lastIndexOf('\n', s - 1) + 1, line = v.slice(ls, s);
    const m = /^(\s*)([-*+] \[[ xX]\] |[-*+] |(\d+)\. )(.*)$/.exec(line); if (!m) return;
    e.preventDefault();
    if (!m[4].trim()) { ta.value = v.slice(0, ls) + v.slice(s); ta.selectionStart = ta.selectionEnd = ls; return; }
    const next = m[1] + (m[3] ? `${+m[3] + 1}. ` : m[2].replace(/\[[xX]\]/, '[ ]'));
    ta.value = v.slice(0, s) + '\n' + next + v.slice(s); ta.selectionStart = ta.selectionEnd = s + 1 + next.length;
  });
  ta.onkeydown = e => { if (e.key === 's' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $('#eOk', pan).click(); } };
  $('#eOk', pan).onclick = () => { const p = commit(); render(); closeLayer(() => { render(); if (p) openNote(p); }); };
  if (isNew) setTimeout(() => tIn.focus(), 120);
}

/* ---------- Journal ---------- */
function journal() {
  const p = `${dirOf('journal')}/${today()}.md`;
  if (!notes[p]) createNote(p, build({ cree: today() }, `## Notes du jour\n\n\n## Fait aujourd'hui\n`));
  render(); editNote(p);
}

/* ---------- Revue de la semaine ---------- */
function review() {
  const I = buildIndex(), T = I.tasks.filter(t => !t.done);
  const late = T.filter(t => t.due && t.due < today());
  const act = I.projs.filter(p => (p.fm.statut || 'actif') === 'actif');
  const stuck = act.filter(p => !tasksOf(p).some(t => !t.done));
  const fin = I.projs.filter(p => p.fm.statut === 'terminé' || (tasksOf(p).length && tasksOf(p).every(t => t.done)));
  const row = (i, n, t, sub, btn, id) => `<div class="row"><span class="gl" style="font:600 12px var(--mono)">${i}</span><span class="m"><span class="t" style="white-space:normal">${t}${n ? ` <span class="meta">· ${n}</span>` : ' <span class="meta" style="color:var(--ok)">✓</span>'}</span><span class="s" style="white-space:normal">${sub}</span></span>${n && btn ? `<button class="btn sm line" id="${id}">${btn}</button>` : ''}</div>`;
  const pan = layer('Revue de la semaine', `
    <p class="lead" style="margin-top:0">Dix minutes, dans l'ordre. <em>Et tout reste sous contrôle.</em></p>
    <div class="list">
      ${row(1, I.box.length, 'Vider la boîte de réception', 'Chaque élément trouve sa place, ou part à la corbeille.', 'Trier', 'r1')}
      ${row(2, late.length, 'Tâches en retard', 'Les faire, les replanifier ou les supprimer.', 'Voir', 'r2')}
      ${row(3, stuck.length, 'Projets sans prochaine tâche', stuck.length ? stuck.map(p => esc(p.title)).join(', ') : 'Chaque projet sait quoi faire ensuite.', 'Ouvrir', 'r3')}
      ${row(4, fin.length, 'Projets finis à archiver', fin.length ? fin.map(p => esc(p.title)).join(', ') : 'Rien à archiver.', 'Archiver', 'r4')}
      ${row(5, 0, 'Vider sa tête', 'Ce qui traîne encore dans un coin ? Capture-le.', '', '')}
    </div>
    <div class="btns"><button class="btn line" id="r5">＋ Capturer</button><button class="btn" id="rOk">Revue faite</button></div>`);
  const on = (s, f) => { const el = $(s, pan); if (el) el.onclick = f; };
  on('#r1', () => { const b = buildIndex().box[0]; if (b) classify(b.path, true); });
  on('#r2', () => closeLayer(() => { showDone = false; go('taches'); }));
  on('#r3', () => openNote(stuck[0].path));
  on('#r4', () => { if (!confirm(`Archiver ${plural(fin.length, 'projet')} ?`)) return; fin.forEach(p => { setFm(p.path, { statut: 'terminé', fini: p.fm.fini || today() }); moveNote(p.path, uniquePath(dirOf('archive'), p.title)); }); toast('Archivés'); render(); review(); });
  on('#r5', () => capture());
  on('#rOk', () => { UI.review = today(); saveUI(); vibrate(); toast('Revue faite. À la semaine prochaine !'); closeLayer(() => render()); });
}

/* ---------- Recherche ---------- */
function search() {
  const pan = layer('Rechercher', `<label class="search">${ico('search')}<input id="sQ" placeholder="Titre, mot, #étiquette…" autocomplete="off"></label><div id="sR"></div>`);
  const q = $('#sQ', pan), out = $('#sR', pan);
  const draw = () => { const v = q.value.trim(); if (!v) { out.innerHTML = '<p class="empty">Tape quelques lettres.</p>'; return; } const L = hits(v); out.innerHTML = hudm(`Recherche ▸ « ${esc(v)} »`, `<b>${z3(L.length)}</b> résultat${L.length > 1 ? 's' : ''}`) + `<div class="list">${L.length ? L.map(noteRow).join('') : '<p class="empty">Rien trouvé.</p>'}</div>`; };
  q.oninput = draw; draw(); setTimeout(() => q.focus(), 120);
  q.onkeydown = e => { if (e.key === 'Enter') { const f = $('[data-open]', out); if (f) openNote(f.dataset.open); } };
}

/* ---------- Réglages ---------- */
function settings() {
  const hubTok = (() => { try { return JSON.parse(localStorage.getItem('hub.github') || '{}').token || ''; } catch { return ''; } })();
  const f = (id, l, v, at = '') => `<div class="fld"><label for="${id}">${l}</label><input id="${id}" value="${esc(v)}" ${at}></div>`;
  const pan = layer('Réglages', `
    <span class="sub">Apparence</span>
    <div class="chips" id="sTh">${[['auto', 'Comme le téléphone'], ['light', 'Clair'], ['dark', 'Sombre']].map(([k, l]) => `<button type="button" class="chip ${cfg.theme === k ? 'on' : ''}" data-v="${k}">${l}</button>`).join('')}</div>
    <span class="sub" style="margin-top:16px">Dépôt GitHub privé des notes</span>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${f('sO', 'Propriétaire', cfg.owner, 'autocapitalize="off"')}${f('sR', 'Dépôt', cfg.repo, 'autocapitalize="off"')}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${f('sB', 'Branche', cfg.branch, 'autocapitalize="off"')}${f('sD', 'Dossier (facultatif)', cfg.root, 'autocapitalize="off" placeholder="racine"')}</div>
    ${f('sK', 'Jeton (Contents : lecture et écriture)', cfg.token, 'type="password" autocomplete="off"')}
    ${hubTok && hubTok !== cfg.token ? `<button type="button" class="btn sm line" id="sHub" style="margin:-6px 0 12px">Reprendre le jeton de Quotidien</button>` : ''}
    <p class="hint" id="sMsg">Le jeton reste sur cet appareil. Tes notes sont de simples fichiers Markdown : tu peux aussi les ouvrir sur GitHub ou dans Obsidian.</p>
    <div class="btns"><button class="btn line" id="sTest">Tester</button><button class="btn" id="sOk">Enregistrer</button></div>
    <span class="sub" style="margin-top:22px">Avancé</span>
    <div class="btns" style="margin-top:4px"><button class="btn line" id="sReload">Tout recharger depuis GitHub</button><button class="btn bad" id="sOut">Se déconnecter de cet appareil</button></div>`);
  const getTh = chipGroup(pan, 'sTh');
  const val = id => $('#' + id, pan).value.trim();
  const collect = () => {
    const changedRepo = val('sO') !== cfg.owner || val('sR') !== cfg.repo || (val('sB') || 'main') !== cfg.branch || val('sD') !== cfg.root;
    Object.assign(cfg, { owner: val('sO'), repo: val('sR'), branch: val('sB') || 'main', root: val('sD').replace(/^\/+|\/+$/g, ''), token: val('sK'), theme: getTh() || 'auto' });
    saveCfg(); applyTheme();
    if (changedRepo) { notes = {}; Object.assign(meta, { head: null, tree: null, treeSha: null, last: 0, deleted: {}, seeded: false }); persist(); }
  };
  if ($('#sHub', pan)) $('#sHub', pan).onclick = () => { $('#sK', pan).value = hubTok; toast('Jeton repris. Vérifie qu’il donne accès au dépôt des notes.'); };
  $('#sTest', pan).onclick = async () => {
    const m = $('#sMsg', pan), keep = { ...cfg };
    Object.assign(cfg, { owner: val('sO'), repo: val('sR'), token: val('sK') });
    m.textContent = 'Test…';
    try { const j = await gh(''); m.textContent = `✓ ${j.full_name}${j.private ? ' (privé)' : ' — attention : dépôt PUBLIC'}${j.permissions?.push === false ? ' — jeton en lecture seule' : ''}`; }
    catch (e) { m.textContent = '✗ ' + e.message; }
    Object.assign(cfg, keep);
  };
  $('#sOk', pan).onclick = () => {
    if (meta.dirty && (val('sR') !== cfg.repo || val('sO') !== cfg.owner) && !confirm('Des notes ne sont pas encore envoyées sur l’ancien dépôt. Changer quand même ?')) return;
    collect(); closeLayer(() => { render(); sync(); }); toast('Réglages enregistrés');
  };
  $('#sReload', pan).onclick = () => {
    if (meta.dirty && !confirm('Des modifications ne sont pas encore envoyées. Elles seront gardées puis envoyées. Continuer ?')) return;
    for (const p of Object.keys(notes)) if (!notes[p].dirty) delete notes[p];
    Object.assign(meta, { head: null, tree: null, treeSha: null }); persist();
    closeLayer(() => { render(); sync(); });
  };
  $('#sOut', pan).onclick = () => {
    if (!confirm(meta.dirty ? 'Des notes ne sont pas encore envoyées sur GitHub et seront perdues. Effacer quand même ?' : 'Effacer de cet appareil le jeton et toutes les notes ? Rien n’est effacé sur GitHub.')) return;
    Object.keys(localStorage).filter(k => k.startsWith(P)).forEach(k => localStorage.removeItem(k));
    location.reload();
  };
}

/* ---------- Démarrage ---------- */
/* ==========================================================
   Démarrage façon assistant : le logo s'assemble, le système « s'initialise », puis l'écran se dévoile
   (2,6 s au plus ; un toucher passe directement à l'appli)
   ========================================================== */
function splash() {
  splashing = true;
  const P = (a, r) => [100 + r * Math.cos(a * Math.PI / 180), 100 + r * Math.sin(a * Math.PI / 180)].map(n => n.toFixed(2)).join(' ');
  const arc = (a, r, w = 38) => `M${P(a - w, r)} A${r} ${r} 0 0 1 ${P(a + w, r)}`;
  const nodes = [-120, 0, 120].map(a => P(a, 58).split(' '));
  const nNotes = Object.keys(notes).filter(isNotePath).length, nBox = Object.keys(notes).filter(p => isNotePath(p) && kindOf(p) === 'boite').length;
  const log = [`Initialisation du noyau`, `Liaison GitHub ${'.'.repeat(8)} ${ghReady() ? 'OK' : 'LOCAL'}`, `${String(nNotes).padStart(3, '0')} notes indexées · ${String(nBox).padStart(3, '0')} en boîte`, `Perso · Salarié · PhantStudio : en ligne`, `Systèmes prêts. Bonjour.`];
  const el = document.createElement('div'); el.className = 'splash'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<svg class="sp-logo" viewBox="0 0 200 200">
      <defs><radialGradient id="spg"><stop class="sp-stop0" offset="0"/><stop class="sp-stop1" offset=".35"/><stop class="sp-stop2" offset="1"/></radialGradient></defs>
      <circle class="sp-glow" cx="100" cy="100" r="70" fill="url(#spg)"/>
      <circle class="sp-ticks" cx="100" cy="100" r="82"/>
      <circle class="sp-thin" cx="100" cy="100" r="70" pathLength="100"/>
      ${[-60, 60, 180].map((a, i) => `<path class="sp-arc" style="--i:${i}" d="${arc(a, 58)}" pathLength="100"/>`).join('')}
      <g class="sp-radar"><path d="M100 100 L${P(-90, 48)} A48 48 0 0 1 ${P(-30, 48)} Z"/></g>
      <circle class="sp-dash" cx="100" cy="100" r="48"/>
      <polygon class="sp-tri" points="${nodes.map(n => n.join(',')).join(' ')}" pathLength="100"/>
      ${nodes.map(([x, y], i) => `<g class="sp-node" style="--i:${i};transform-origin:${x}px ${y}px"><circle cx="${x}" cy="${y}" r="13"/><circle cx="${x}" cy="${y}" r="9.5" style="fill:${['#79b88b', '#7fa3e0', '#e8865c'][i]}"/></g>`).join('')}
      <circle class="sp-core" cx="100" cy="100" r="9"/>
    </svg>
    <div class="sp-name" data-txt="CERVEAU">&nbsp;</div>
    <div class="sp-log"></div>
    <div class="sp-bar">${'<i></i>'.repeat(24)}</div>
    <div class="sp-scan"></div>`;
  document.body.appendChild(el);
  document.body.classList.add('booting');
  const timers = [], at = (ms, f) => timers.push(setTimeout(f, ms));
  // Le nom se « décode »
  const nm = $('.sp-name', el), target = nm.dataset.txt, glyphs = '█▓▒░<>/\\#01ΔΣ';
  const t0 = performance.now() + 450;
  const dec = now => { if (!el.isConnected) return; const k = (now - t0) / 750; nm.textContent = [...target].map((c, i) => k * target.length > i + 1 ? c : k < 0 ? ' ' : glyphs[Math.floor(Math.random() * glyphs.length)]).join(''); if (k < target.length / target.length + .3) requestAnimationFrame(dec); else nm.textContent = target; };
  requestAnimationFrame(dec);
  // Journal de démarrage tapé ligne à ligne
  const lg = $('.sp-log', el);
  log.forEach((l, i) => at(650 + i * 290, () => { const d = document.createElement('div'); d.textContent = '› '; lg.appendChild(d); let j = 0; const ty = () => { d.textContent = '› ' + l.slice(0, j); if (j < l.length) { j = Math.min(l.length, j + 2); setTimeout(ty, 11); } }; ty(); }));
  // Barre segmentée
  const segs = $$('.sp-bar i', el); segs.forEach((g, i) => at(600 + i * 58, () => g.classList.add('on')));
  let done = false;
  const finish = () => {
    if (done) return; done = true; timers.forEach(clearTimeout);
    el.classList.add('out');
    splashing = false; boot = true; render(); // l'allumage du HUD démarre pendant que l'écran se dévoile
    setTimeout(() => { el.remove(); document.body.classList.remove('booting'); }, 620);
    document.body.classList.add('reveal'); setTimeout(() => document.body.classList.remove('reveal'), 1400);
  };
  at(2050, finish);
  el.addEventListener('pointerdown', finish);
}

shell();
const coldSplash = !['share', 'capture', 'text', 'url', 'title'].some(k => new URLSearchParams(location.search).has(k)) && !matchMedia('(prefers-reduced-motion: reduce)').matches && !sessionStorage.getItem('sc.splash');
if (coldSplash) { try { sessionStorage.setItem('sc.splash', '1'); } catch { } splash(); }
render();
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('./sw.js').then(r => r.update()).catch(() => { });
// Partage depuis une autre appli (Android : « Partager → Cerveau ») ou raccourci « Capturer »
const sp = new URLSearchParams(location.search);
if (sp.has('share')) {
  history.replaceState(null, '', location.pathname);
  idbGet('share', 'last').then(d => { idbDel('share', 'last'); if (!d) return; const text = [d.title && !(d.text || '').includes(d.title) ? d.title : '', d.text, d.url && !(d.text || '').includes(d.url) ? d.url : ''].filter(Boolean).join('\n'); capture({ text, files: d.files || [] }); });
} else if (['capture', 'text', 'url', 'title'].some(k => sp.has(k))) {
  const url = sp.get('url') || '', txt = sp.get('text') || '', ttl = sp.get('title') || '';
  const text = [ttl && !txt.includes(ttl) ? ttl : '', txt, url && !txt.includes(url) ? url : ''].filter(Boolean).join('\n');
  history.replaceState(null, '', location.pathname);
  capture({ text });
}
sync();
