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
const plain = s => String(s || '').replace(/\s*🆔\s*[\w-]+/gu, '').replace(/⏰\s*\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/gu, '').replace(/!\[\[[^\]]*\]\]|!\[[^\]]*\]\([^)]*\)/g, '📷').replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (m, a, b) => b || a).replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[📅✅]\s*\d{4}-\d{2}-\d{2}/gu, '').replace(/[*`]/g, '').replace(/\s+/g, ' ').trim();
const cleanTitle = s => String(s || '').replace(/[\\/:*?"<>|#^[\]]/g, ' ').replace(/^[.\s]+/, '').replace(/\s+/g, ' ').trim().slice(0, 80).trim();
function ping(el) {
  const r = el.getBoundingClientRect(), x = r.left + r.width / 2 + 'px', y = r.top + r.height / 2 + 'px';
  for (const c of ['ping x', 'ping cross', 'ping', 'ping', 'ping', 'pingt']) { const d = document.createElement('div'); d.className = c; d.style.left = x; d.style.top = y; if (c === 'pingt') d.textContent = 'Validé'; document.body.appendChild(d); setTimeout(() => d.remove(), 1700); }
}
setInterval(() => { const c = document.querySelector('[data-clock]'); if (c) c.textContent = new Date().toLocaleTimeString('fr-FR'); }, 1000);
const vibrate = () => { try { navigator.vibrate?.(8); } catch { } };

const ICON = {
  cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
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
  net: '<circle cx="6" cy="7" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="17.5" r="2.5"/><path d="M7.2 8.7 10.6 15.4M16.9 7.7 13.3 15.3M8 6.8l8-.6"/>',
  review: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4.5h-4.5"/>',
  chat: '<path d="M5 5.5h14a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1h-7l-4.5 3.5V17H5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z"/><path d="M9 11.2h.01M12 11.2h.01M15 11.2h.01"/>',
};
const ico = (n, size) => `<svg class="i" viewBox="0 0 24 24"${size ? ` style="width:${size}px;height:${size}px"` : ''} aria-hidden="true">${ICON[n]}</svg>`;

/* ---------- Réglages (sur cet appareil) ---------- */
const cfg = Object.assign({ owner: 'AdrienFeuilloy', repo: 'phant-studio-data', branch: 'main', token: '', root: 'Cerveau', theme: 'auto' }, read('config', {}) || {});
// Connexion propre à Cerveau : rien n'est lu ni écrit dans le stockage des autres applis du même domaine.
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
  { id: 'fil', dir: 'Fils', label: 'Fils de discussion', short: 'Fil', n: 'F', hidden: true },
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

/* ---------- Ce que les autres applis rangent dans le même dépôt : lu, jamais modifié ----------
   JSON_VIOLETTE.json : menu de la semaine · data.json : projets PhantStudio · JSON_AGENDA.json : agenda (titres chiffrés)
   Seul le strict nécessaire est gardé sur l'appareil (pas d'adresses, pas de montants). */
const EXT_FILES = ['JSON_VIOLETTE.json', 'data.json', 'JSON_AGENDA.json'];
const VIOLETTE_URL = 'https://adrienfeuilloy.github.io/Violette-app/violette.html', PHANT_URL = 'https://adrienfeuilloy.github.io/phant-studio-app/';
const HUB = 'https://adrienfeuilloy.github.io/Violette-app/';
const APPS = [['Hub Gestion quotidien', '🏠', HUB], ['Suivi Phant', '🎨', PHANT_URL], ['Accueil Phant', '🖌️', 'https://adrienfeuilloy.github.io/phant-studio-app/accueil/'], ['Site PhantStudio', '🌐', 'https://adrienfeuilloy.github.io/Phant-site/'], ['Ponctuel', '🧩', 'https://adrienfeuilloy.github.io/ponctuel/']];
let ext = read('ext', {}) || {};
function slimExt(f, d) {
  if (f === 'JSON_VIOLETTE.json') return { plans: d.weeklyMealPlans || {}, meals: d.settings?.meals || {} };
  if (f === 'data.json') return {
    clients: (d.clients || []).map(c => ({ id: c.id, n: [c.firstname, c.lastname].filter(Boolean).join(' '), co: c.company || '' })),
    projects: (d.projects || []).map(p => ({ id: p.id, name: p.name, clientId: p.clientId, status: p.status || '', deadline: p.deadline || '' })),
    sessions: (d.sessions || []).filter(x => x.date >= addDays(today(), -40)).map(x => ({ p: x.projectId, d: x.date, s: x.durationSeconds || 0 })),
  };
  if (f === 'JSON_AGENDA.json') return { salt: d.salt, iter: d.iter, events: d.events || [], at: d.updatedAt || '' };
  return null;
}
async function pullExt(shas) {
  let changed = false;
  for (const f of EXT_FILES) {
    const sha = shas[f];
    if (!sha) { if (ext[f]) { delete ext[f]; changed = true; } continue; }
    if (ext[f]?.sha === sha) continue;
    try { const j = await gh(`/git/blobs/${sha}`); ext[f] = { sha, d: slimExt(f, JSON.parse(b64d(j.content))) }; changed = true; if (f === 'JSON_AGENDA.json') calPlain = {}; }
    catch (e) { console.warn('lecture', f, e); }
  }
  if (changed) write('ext', ext);
}

async function remoteTree(commitSha) {
  const c = await gh(`/git/commits/${commitSha}`);
  const t = await gh(`/git/trees/${c.tree.sha}?recursive=1`);
  const map = {}, files = {}, ext = {};
  for (const e of t.tree || []) if (e.type === 'blob') { if (isNotePath(e.path)) map[e.path] = e.sha; else if (isMedia(e.path)) files[e.path] = e.sha; else if (EXT_FILES.includes(e.path)) ext[e.path] = e.sha; }
  return { map, files, ext, treeSha: c.tree.sha };
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
      else { let files, extShas; ({ map: remote, files, ext: extShas, treeSha } = await remoteTree(head)); meta.files = files; await pullExt(extShas); }
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
    const rem = (/⏰\s*(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2})/u.exec(rest) || [])[1] || '';
    const text = rest.replace(/⏰\s*\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/gu, '').replace(/[📅✅⏳🛫]\s*\d{4}-\d{2}-\d{2}/gu, '').replace(/🆔\s*[\w-]+/gu, '').replace(/\s+/g, ' ').trim();
    const id = (/🆔\s*([\w-]+)/u.exec(rest) || [])[1] || '';
    if (text) out.push({ path: x.path, line: i, raw: l, done: m[2] !== ' ', text, due, doneAt, note: x, id, rem });
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
const backlinks = x => buildIndex().idx.filter(y => y.path !== x.path && y.kind !== 'fil' && new RegExp('\\[\\[' + escRe(x.title) + '(\\]\\]|\\||#)', 'i').test(notes[y.path].text));
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
  // Images, liens et bouts de code sont mis de côté dès qu'ils sont fabriqués : les règles suivantes ne peuvent plus toucher leurs attributs.
  const keep = [], put = h => `\u0000${keep.push(h) - 1}\u0000`, plain = a => a.replace(/\u0000(\d+)\u0000/g, (m, i) => plain(keep[i]).replace(/<[^>]*>/g, ''));
  let t = esc(s).replace(/\u0000/g, '');
  t = t.replace(/`([^`]+)`/g, (m, c) => put(`<code>${c}</code>`))
    .replace(/\s*🆔\s*[\w-]+/gu, '')
    .replace(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, (m, a) => isImgName(unesc(a)) ? put(`<img class="att" data-att="${a.trim()}" alt="">`) : m)
    .replace(/!\[([^\]]*)\]\(([^)\s\u0000]+)\)/g, (m, alt, u) => { alt = plain(alt); return put(/^https?:/.test(unesc(u)) ? `<a href="#" class="ximg" data-ximg="${u}" data-alt="${alt}">🖼️ ${alt || 'Image web'} · toucher pour l’afficher</a>` : `<img class="att" data-att="${esc((() => { try { return decodeURIComponent(unesc(u)); } catch { return unesc(u); } })().split('/').pop())}" alt="${alt}">`); })
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (m, a, b) => put(`<a href="#" data-wl="${a.trim()}" class="${findByTitle(unesc(a.trim())) ? '' : 'miss'}">${b || a}</a>`))
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s\u0000]+)\)/g, (m, x, u) => put(`<a href="${u}" target="_blank" rel="noopener">${x}</a>`))
    .replace(/(^|[\s(])(https?:\/\/[^\s<)\u0000]+)/g, (m, p, u) => p + put(`<a href="${u}" target="_blank" rel="noopener">${u.length > 46 ? u.slice(0, 44) + '…' : u}</a>`))
    .replace(/⏰\s*(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/gu, (m, d, h, mi) => `<span class="due rem">⏰ ${d === today() ? '' : frDate(d, { day: 'numeric', month: 'short' }) + ' '}${h}h${mi}</span>`)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<i>$2</i>')
    .replace(/==([^=]+)==/g, '<mark class="mark">$1</mark>')
    .replace(/(^|\s)#([\p{L}\p{N}_/-]+)/gu, '$1<span class="tg">#$2</span>')
    .replace(/📅\s*(\d{4}-\d{2}-\d{2})/gu, (m, d) => `<span class="due ${d < today() ? 'late' : ''}">→ ${dueLabel(d)}</span>`)
    .replace(/✅\s*(\d{4}-\d{2}-\d{2})/gu, (m, d) => `<span class="due">✓ ${frDate(d, { day: 'numeric', month: 'short' })}</span>`);
  const back = x => x.replace(/\u0000(\d+)\u0000/g, (m, i) => back(keep[i]));
  return back(t);
}
function md(src, offset = 0) {
  const L = src.split('\n'); let h = '', para = [], list = null, inQ = false;
  const fP = () => { if (para.length) { h += `<p>${para.map(inline).join('<br>')}</p>`; para = []; } };
  const fL = () => { if (list) { h += `</${list}>`; list = null; } };
  const oL = t => { if (list !== t) { fL(); h += `<${t}>`; list = t; } };
  for (let i = 0; i < L.length; i++) {
    const l = L[i]; let m;
    if (/^\s*```/.test(l)) { fP(); fL(); const c = []; i++; while (i < L.length && !/^\s*```/.test(L[i])) c.push(L[i++]); h += `<pre><code>${esc(c.join('\n'))}</code></pre>`; continue; }
    if ((m = QQ.exec(l))) { fP(); fL(); const a = ANS.exec(L[i + 1] || ''); h += qzHTML(m, a ? a[1] : null, offset + i); inQ = true; if (a) i++; if (!QQ.test(L[i + 1] || '')) { h += qzEnd(); inQ = false; } continue; }
    if ((m = TASK.exec(l))) { fP(); fL(); const done = m[2] !== ' ', ind = Math.min(4, Math.floor(m[1].replace(/\t/g, '  ').length / 2)), id = (/🆔\s*([\w-]+)/u.exec(m[3]) || [])[1], n = id ? threadCount(id) : 0; h += `<div class="task ${done ? 'done' : ''}" style="margin-left:${ind * 22}px"><button class="ck" data-tl="${offset + i}" aria-label="${done ? 'Rouvrir' : 'Cocher'}"></button><span class="tx" data-thr="${offset + i}">${inline(m[3]) || '&nbsp;'}${m[3].trim() ? `<span class="thb${n ? ' on' : ''}">${n ? `🧵 ${n}` : '🧵'}</span>` : ''}</span></div>`; continue; }
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
// Trois mondes bien séparés : ce qui est à FAIRE (cases à cocher), ce qui est à TRIER (boîte), ce qui est à GARDER (notes)
const VIEWS = { today: "Aujourd'hui", agenda: 'Agenda', afaire: 'À faire', boite: 'Boîte', notes: 'Notes' };
const ALIAS = { taches: ['afaire', 'date'], projets: ['afaire', 'projet'] };
let view = VIEWS[UI.view] ? UI.view : 'today', todoMode = UI.todoMode || 'date';
let sphere = UI.sphere || '', projFilter = 'actif', showDone = false, nq = '';
const saveUI = () => { UI.view = view; UI.sphere = sphere; UI.todoMode = todoMode; write('ui', UI); };
const inS = x => !sphere || x.dom === sphere;
const inS2 = t => inS(t.note);
let TK = [];
const dot = s => s ? `<span class="dot" style="--c:${sc(s)}"></span>` : '';
const lbl = (t, more = '', go = '', cls = '') => `<div class="lbl ${cls}"><b>${esc(t)}</b>${more ? `<a class="more" href="#" data-go="${go}">${esc(more)}</a>` : ''}</div>`;
const domsHTML = () => `<div class="doms" role="tablist">${[['', 'Tout'], ...SPHERES.map(s => [s.id, s.id])].map(([k, l]) => `<button class="${sphere === k ? 'on' : ''}" data-sph="${esc(k)}" style="--c:${k ? sc(k) : 'var(--ink)'}">${dot(k)}${esc(l)}</button>`).join('')}</div>`;
function taskRow(t, ctx = true) {
  const i = TK.push(t) - 1, late = !t.done && t.due && t.due < today();
  const bits = [t.due && !t.done ? `<span class="${late ? 'late' : ''} tdate" data-tmenu="${i}">${dueLabel(t.due)}</span>` : '', t.rem && !t.done ? `<span class="rem">⏰ ${t.rem.slice(11, 16).replace(':', 'h')}</span>` : '', t.done && t.doneAt ? `fait ${frDate(t.doneAt, { day: 'numeric', month: 'short' })}` : '', ctx ? esc(t.note.title) : ''].filter(Boolean);
  return `<div class="row wrap ${t.done ? 'done' : ''}"><button class="ck" data-tk="${i}" aria-label="${t.done ? 'Rouvrir' : 'Cocher'}"></button><span class="m clk" data-th="${i}" style="cursor:pointer"><span class="t">${inline(t.text)}${t.id && threadCount(t.id) ? ` <span class="thb on">🧵 ${threadCount(t.id)}</span>` : ''}</span>${bits.length ? `<span class="s meta">${ctx && t.note.dom ? dot(t.note.dom) + ' ' : ''}${bits.join(' · ')}</span>` : ''}</span><button class="tmore" data-tmenu="${i}" aria-label="Modifier la tâche">${ico('edit', 15)}</button></div>`;
}
// Modifier une tâche : texte, échéance, ou la supprimer (avec son fil)
function taskSheet(t) {
  const pan = layer('Tâche', `<div class="fld"><label for="tsT">Tâche</label><input id="tsT" value="${esc(t.text)}"></div>
    <span class="sub">Échéance</span>${dueChips('tsDue', t.due)}
    <div class="fld" style="margin-top:12px"><label for="tsR">Rappel ⏰ (heure, le jour de l’échéance ou aujourd’hui)</label><input id="tsR" type="time" value="${t.rem ? t.rem.slice(11, 16) : ''}"></div>
    <p class="hint">Dans « ${esc(t.note.title)} »</p>
    <div class="btns"><button class="btn" id="tsOk">Enregistrer</button><button class="btn line" id="tsTh">🧵 Ouvrir le fil</button></div>
    <div class="btns" style="margin-top:4px"><button class="btn bad" id="tsDel">Supprimer la tâche</button></div>`);
  const getDue = dueGroup(pan, 'tsDue');
  const locate = () => { const L = notes[t.path]?.text.split('\n') || [], i = L[t.line] === t.raw ? t.line : L.indexOf(t.raw); if (i < 0) toast('La tâche a changé, réessaie'); return [L, i]; };
  $('#tsOk', pan).onclick = () => {
    const [L, i] = locate(); if (i < 0) return;
    const m = TASK.exec(L[i]), rest = m[3], txt = $('#tsT', pan).value.replace(/\s+/g, ' ').trim() || t.text, due = getDue();
    const hr = $('#tsR', pan).value, keep = [...rest.matchAll(/([✅⏳🛫]\s*\d{4}-\d{2}-\d{2}|🆔\s*[\w-]+)/gu)].map(x => x[0]);
    if (hr) keep.unshift(`⏰ ${due || t.rem.slice(0, 10) || today()} ${hr}`);
    L[i] = `${m[1]}- [${m[2]}] ${txt}${due ? ' 📅 ' + due : ''}${keep.length ? ' ' + keep.join(' ') : ''}`;
    saveNote(t.path, L.join('\n')); vibrate(); toast('Tâche modifiée'); closeLayer(() => render()); render();
  };
  $('#tsTh', pan).onclick = () => openThread(t.path, t.line, t.raw);
  $('#tsDel', pan).onclick = () => {
    const tp = t.id && threadPath(t.id);
    if (!confirm(`Supprimer « ${plain(t.text)} »${tp ? ' et son fil' : ''} ?`)) return;
    const [L, i] = locate(); if (i < 0) return;
    L.splice(i, 1); saveNote(t.path, L.join('\n')); if (tp) deleteNote(tp);
    toast('Tâche supprimée'); closeLayer(() => render()); render();
  };
}
function projRow(p) {
  const ts = tasksOf(p), d = ts.filter(t => t.done).length, nx = ts.find(t => !t.done), pc = ts.length ? Math.round(d * 100 / ts.length) : 0;
  const late = isISO(p.fm.echeance) && p.fm.echeance < today() && p.fm.statut !== 'terminé';
  return `<button class="row" data-open="${esc(p.path)}"><span class="gl" style="color:${sc(p.dom)}">${ico('proj', 18)}</span><span class="m"><span class="t" style="font-family:var(--serif);font-size:16.5px">${esc(p.title)}</span><span class="s">${nx ? '→ ' + esc(plain(nx.text)) : ts.length ? 'Tout est fait' : 'Aucune tâche'}</span><span class="bar" style="--c:${sc(p.dom)}"><i style="width:${pc}%"></i></span></span><span class="r">${isISO(p.fm.echeance) ? `<span class="${late ? 'late' : ''}">${frDate(p.fm.echeance, { day: 'numeric', month: 'short' })}</span><br>` : ''}${ts.length ? `${d}/${ts.length}` : ''}</span></button>`;
}
// Ligne basse du bloc d'instruments : une jauge par domaine (avancement + tâches ouvertes) et un bandeau des prochaines échéances
function hudX(I) {
  const g = SPHERES.map(sp => { const ts = I.tasks.filter(t => t.note.dom === sp.id), op = ts.filter(t => !t.done).length; return { id: sp.id, op, pc: ts.length ? Math.round((ts.length - op) * 100 / ts.length) : 0 }; });
  const up = I.tasks.filter(t => !t.done && t.due).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6);
  const txt = up.length ? up.map(t => `◆ ${dueLabel(t.due)} › ${plain(t.text)}`).join('     ') : '◆ Aucune échéance › systèmes nominaux';
  return `<div class="hud-x">${g.map(d => `<div class="gg" style="--c:${sc(d.id)}"><svg viewBox="0 0 36 36"><circle class="tr" cx="18" cy="18" r="14"/><circle class="v" cx="18" cy="18" r="14" pathLength="100" style="stroke-dasharray:${d.pc} 100"/></svg><span><b>${String(d.op).padStart(3, '0')}</b>${esc(d.id)}</span></div>`).join('')}
    <div class="tick"><span style="animation-duration:${Math.max(14, txt.length * .22).toFixed(1)}s">${esc(txt)}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${esc(txt)}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span></div></div>`;
}
// Pastilles « Aujourd'hui chez toi » : le menu de Violette et l'activité PhantStudio, lus dans les autres applis
function todayPills() {
  const out = [], wd = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
  const v = ext['JSON_VIOLETTE.json']?.d;
  if (v && (!sphere || sphere === 'Perso')) {
    const p = v.plans[wd] || {}, LB = { breakfast: 'Matin', lunch: 'Midi', snack: 'Goûter', dinner: 'Soir', fresh: 'Frais' };
    const parts = Object.keys(LB).filter(k => (p[k] || []).length).map(k => `<span class="vm"><i>${LB[k]}</i>${esc(p[k].map(x => x.name).join(', '))}</span>`);
    out.push(`<a class="pill vio" href="${VIOLETTE_URL}" target="_blank" rel="noopener"><span class="pl-h"><span class="pl-dot"></span>Violette mange aujourd’hui<span class="pl-go">›</span></span><span class="pl-b">${parts.join('') || '<span class="vm">Pas de menu prévu</span>'}</span></a>`);
  }
  const ph = ext['data.json']?.d;
  if (ph && (!sphere || sphere === 'PhantStudio')) {
    const cur = ph.projects.filter(p => /cours/i.test(p.status)), cl = id => ph.clients.find(c => c.id === id);
    const wk0 = addDays(today(), -((new Date().getDay() + 6) % 7)), hrs = ph.sessions.filter(x => x.d >= wk0).reduce((a, x) => a + x.s, 0) / 3600;
    out.push(`<a class="pill pha" href="${PHANT_URL}" target="_blank" rel="noopener"><span class="pl-h"><span class="pl-dot"></span>PhantStudio · ${plural(cur.length, 'projet')} en cours<span class="pl-go">›</span></span><span class="pl-b">${cur.slice(0, 4).map(p => { const c = cl(p.clientId); return `<span class="vm"><i>${esc(c?.co || c?.n || 'Client')}</i>${esc(p.name)}${isISO(p.deadline) ? ` · ${frDate(p.deadline, { day: 'numeric', month: 'short' })}` : ''}</span>`; }).join('') || '<span class="vm">Aucun projet en cours</span>'}<span class="vm"><i>Cette semaine</i>${hrs.toFixed(1).replace('.', ',').replace(',0', '')} h</span></span></a>`);
  }
  return out.length ? `<div class="pills">${out.join('')}</div>` : '';
}

/* ---------- Agenda Google : titres chiffrés dans le dépôt, déchiffrés seulement sur tes appareils ---------- */
let calPlain = {}, calBusy = false;
async function calKeyFor(salt, iter) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(cfg.calKey), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: Uint8Array.from(atob(salt), c => c.charCodeAt(0)), iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
}
async function decryptAgenda() {
  const a = ext['JSON_AGENDA.json']?.d; if (!a || !cfg.calKey || calBusy) return;
  const todo = a.events.filter(e => !(e.id in calPlain) && e.s.slice(0, 10) >= addDays(today(), -1) && e.s.slice(0, 10) <= addDays(today(), 22)); if (!todo.length) return;
  calBusy = true;
  try {
    const key = await calKeyFor(a.salt, a.iter);
    for (const e of todo) {
      try { const raw = Uint8Array.from(atob(e.t), c => c.charCodeAt(0)); calPlain[e.id] = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(0, 12) }, key, raw.slice(12))); }
      catch { calPlain[e.id] = null; }
    }
  } finally { calBusy = false; }
  render();
}
const evTime = e => e.ad ? '<span class="evad">Journée</span>' : e.s.slice(11, 16).replace(':', 'h');
function agendaHTML() {
  const a = ext['JSON_AGENDA.json']?.d;
  if (!a) return UI.noCal ? '' : `<div class="calset"><span>${ico('today', 16)} Relie ton agenda Google : tes rendez-vous du jour apparaîtront ici, titres chiffrés.</span><button class="btn sm line" data-act="calguide">Voir comment</button><button class="ib" data-act="calhide" aria-label="Masquer">${ico('x')}</button></div>`;
  const evs = a.events.filter(e => e.s.slice(0, 10) === today() || (e.ad && e.s <= today() && (e.e || e.s) > today())).sort((x, y) => (x.ad ? '0' : x.s).localeCompare(y.ad ? '0' : y.s));
  const tomorrow = a.events.filter(e => e.s.slice(0, 10) === addDays(today(), 1)).length;
  if (cfg.calKey) decryptAgenda();
  return lbl(`Agenda du jour${evs.length ? ' · ' + evs.length : ''}`, cfg.calKey ? '' : 'Saisir la clé', 'calkey') + `<div class="list">${evs.length ? evs.map(e => evRow(e)).join('') : '<p class="empty">Aucun rendez-vous aujourd’hui.</p>'}</div>${tomorrow ? `<p class="hint cal-tm">Demain : ${plural(tomorrow, 'rendez-vous', 'rendez-vous')}</p>` : ''}`;
}
const calEvents = () => ext['JSON_AGENDA.json']?.d.events || [];
const evOn = (e, d) => e.s.slice(0, 10) === d || (e.ad && e.s.slice(0, 10) <= d && (e.e || e.s).slice(0, 10) > d);
const evSort = (x, y) => (x.ad ? '0' : x.s).localeCompare(y.ad ? '0' : y.s);
function evRow(e, day = today(), ask = true) {
  const t = cfg.calKey ? calPlain[e.id] : undefined, past = day === today() && !e.ad && (e.e || e.s).slice(11, 16) < new Date().toTimeString().slice(0, 5);
    return `<div class="row ev ${past ? 'past' : ''}${e.c ? ' fam' : ''}"><span class="evt">${evTime(e)}${!e.ad && e.e ? `<small>${e.e.slice(11, 16).replace(':', 'h')}</small>` : ''}</span><span class="m"><span class="t">${t ? esc(t) : t === null ? '<span class="lock">🔒 Clé de l’agenda incorrecte</span>' : `<span class="lock">🔒 ${cfg.calKey ? 'déchiffrement…' : 'Titre chiffré'}</span>`}</span>${e.c ? '<span class="evfam">Famille</span>' : ''}</span>${t && ask && cfg.aiKey ? `<button class="btn sm line askbtn" data-cal="${esc(e.id)}">◆ Analyser</button>` : ''}</div>`;
}
// Vue Agenda : 3 semaines, jour par jour : rendez-vous Google et échéances de projets (pas les tâches)
function vAgenda(I) {
  if (cfg.calKey) decryptAgenda();
  const P = I.projs.filter(p => (p.fm.statut || 'actif') === 'actif' && isISO(p.fm.echeance) && inS(p));
  let h = domsHTML() + (ext['JSON_AGENDA.json'] ? '' : agendaHTML()), any = false;
  for (let i = 0; i <= 21; i++) {
    const d = addDays(today(), i), E = calEvents().filter(e => evOn(e, d)).sort(evSort), Pd = P.filter(p => p.fm.echeance === d);
    if (!E.length && !Pd.length) continue;
    any = true;
    h += lbl(i === 0 ? 'Aujourd’hui' : i === 1 ? 'Demain' : cap1(frDate(d, { weekday: 'long', day: 'numeric', month: 'long' }))) + `<div class="list">${E.map(e => evRow(e, d, false)).join('')}${Pd.map(projRow).join('')}</div>`;
  }
  if (!any) h += `<p class="empty">Rien de prévu dans les 3 prochaines semaines.</p>`;
  if (ext['JSON_AGENDA.json'] && !cfg.calKey) h += `<div class="btns"><button class="btn line" data-act="calkey">Saisir la clé de l’agenda</button></div>`;
  return h;
}
// « Récap day » : popup HUD condensée, qui s'allume à l'ouverture
function recapDay() {
  const I = buildIndex(), d = today(), now = new Date().toTimeString().slice(0, 5), E = calEvents().filter(e => evOn(e, d)).sort(evSort);
  const T = I.tasks.filter(t => !t.done && t.due && t.due <= d && inS2(t)).sort((a, b) => a.due.localeCompare(b.due)), late = T.filter(t => t.due < d).length;
  const P = I.projs.filter(p => (p.fm.statut || 'actif') === 'actif' && isISO(p.fm.echeance) && p.fm.echeance <= addDays(d, 7) && inS(p)).sort((a, b) => a.fm.echeance.localeCompare(b.fm.echeance));
  const hm = s => s.slice(11, 16).replace(':', 'h'), ttl = e => calPlain[e.id] || '🔒 titre chiffré';
  const nxt = E.find(e => !e.ad && e.s.slice(11, 16) >= now);
  const gauge = (n, l, hot) => `<span class="rc-g${hot && n ? ' hot' : ''}"><b>${String(n).padStart(2, '0')}</b>${l}</span>`;
  const row = (a, b, cls = '') => `<li class="${cls}"><i>${a}</i><span>${esc(b)}</span></li>`;
  const html = `<div class="rc-in brk" role="dialog" aria-modal="true" aria-label="Récap du jour">
    <div class="rc-top">${ring()}<span class="rc-t">RÉCAP // ${esc(frDate(d, { weekday: 'short', day: '2-digit', month: '2-digit' }).toUpperCase())}</span><button class="rc-x" aria-label="Fermer">${ico('x')}</button></div>
    <div class="rc-gs">${gauge(E.length, 'RDV')}${gauge(T.length, 'À faire')}${gauge(late, 'Retard', true)}${gauge(P.length, 'Projets 7j')}</div>
    ${nxt ? `<p class="rc-next">▸ Prochain : <b>${esc(ttl(nxt))}</b> à ${hm(nxt.s)}</p>` : ''}
    ${E.length ? `<ul class="rc-l">${E.map(e => row(e.ad ? 'JOUR' : hm(e.s), ttl(e), !e.ad && (e.e || e.s).slice(11, 16) < now ? 'past' : '')).join('')}</ul>` : '<p class="rc-e">Aucun rendez-vous</p>'}
    ${T.length ? `<ul class="rc-l">${T.slice(0, 4).map(t => row(t.due < d ? '⚠' : '□', plain(t.text), t.due < d ? 'bad' : '')).join('')}${T.length > 4 ? `<li class="more"><i></i><span>+ ${T.length - 4} autres</span></li>` : ''}</ul>` : ''}
    ${P.length ? `<ul class="rc-l">${P.map(p => row(frDate(p.fm.echeance, { day: '2-digit', month: '2-digit' }), '📁 ' + p.title)).join('')}</ul>` : ''}
    <div class="rc-scan"></div></div>`;
  const box = document.createElement('div'); box.className = 'rc'; box.innerHTML = html; document.body.appendChild(box);
  const onKey = e => { if (e.key === 'Escape') close(); };
  const close = () => { box.classList.add('out'); removeEventListener('keydown', onKey); setTimeout(() => box.remove(), 220); };
  box.onclick = e => { if (e.target === box || e.target.closest('.rc-x')) close(); };
  addEventListener('keydown', onKey);
  vibrate(); decode($('.rc-t', box), 600, 150); $$('.rc-g b', box).forEach((b, i) => decode(b, 500, 250 + i * 90));
}

function calGuide() {
  layer('Relier Google Agenda', `<p class="lead" style="margin-top:0">Tes rendez-vous arrivent dans Cerveau <em>titre et heure seulement</em> : ni lieu, ni description, ni invités.</p>
    <ol class="guide">
      <li><b>Copie l’adresse secrète de ton agenda.</b> Sur ordinateur : Google Agenda → ⚙ Paramètres → ton agenda à gauche → « Intégrer l’agenda » → <b>Adresse secrète au format iCal</b> → copier.</li>
      <li><b>Choisis une clé</b> : une phrase que toi seul connais (ex. trois mots). Elle sert à chiffrer les titres.</li>
      <li><b>Range les deux dans GitHub</b> (dépôt privé → Settings → Secrets and variables → Actions → New repository secret) : <code>CAL_ICS_URL</code> = l’adresse, <code>CAL_KEY</code> = la clé.</li>
      <li><b>Saisis la même clé ici</b>, dans les réglages de Cerveau, sur chaque appareil.</li>
    </ol>
    <p class="hint">4 fois par jour (vers 7 h 45, 12 h 15, 17 h 15 et 21 h 15), GitHub lit ton agenda, garde titre et heure, chiffre les titres et les range dans ton dépôt. Sans la clé, personne ne peut les lire, moi compris. Tu choisis ce que tu me montres avec « Analyser ».</p>
    <div class="btns"><button class="btn" data-act="calkey">Saisir la clé</button></div>`);
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
      ${['today', 'agenda', 'afaire', 'boite', 'notes'].map(v => `<button class="nav" data-view="${v}">${ico({ today: 'today', agenda: 'cal', boite: 'inbox', afaire: 'task', notes: 'notes' }[v], 18)}${VIEWS[v]}<span class="c" data-count="${v}"></span></button>`).join('')}
      <div class="sep">Domaines</div>
      <div id="sideDoms"></div>
      <div class="sep">Outils</div>
      <button class="nav" data-act="journal">${ico('journal', 18)}Journal du jour</button>
      <button class="nav" data-act="review">${ico('review', 18)}Revue de la semaine</button>
      <button class="nav" data-act="search">${ico('search', 18)}Aller à<span class="c">/</span></button>
      <button class="nav" data-act="chat">${ico('chat', 18)}Discuter avec l’IA</button>
      <div class="bottom"><span data-sync class="sync"></span><span data-synct style="flex:1"></span><button class="ib" data-act="settings" aria-label="Réglages">${ico('set')}</button></div>
    </aside>
    <main class="main"><div class="col">
      <header class="top"><div class="tt"><div class="kick" id="kick"></div><h1 id="ttl"></h1></div>
        <div class="acts"><button class="ib" data-act="chat" aria-label="Discuter avec l’IA" title="Discuter avec l’IA">${ico('chat')}</button><button class="ib net-b" data-act="reseau" aria-label="Vue réseau" title="Vue réseau">${ico('net')}</button><button class="ib" data-act="sync" aria-label="Synchroniser"><span data-sync class="sync"></span></button><button class="ib" data-act="search" aria-label="Aller à une note">${ico('search')}</button><button class="ib" data-act="settings" aria-label="Réglages">${ico('set')}</button></div>
      </header>
      <div id="view"></div>
      <nav class="apps" aria-label="Mes applis">${APPS.map(([n, e, u]) => `<a href="${u}" target="_blank" rel="noopener" title="${n}" aria-label="${n}">${e}</a>`).join('')}<a href="#" data-act="work" title="Lancer ma session de travail" aria-label="Lancer ma session de travail">🛠️</a></nav>
      <p class="foot">Cerveau · v2.10.0</p>
    </div></main>
    <nav class="tabs">
      <button data-view="today">${ico('today')}Aujourd’hui</button><button data-view="agenda">${ico('cal')}Agenda</button><button data-view="afaire">${ico('task')}À faire</button>
      <button data-view="boite">${ico('inbox')}Boîte<span class="bdg" id="bdg" hidden></span></button><button data-view="notes">${ico('notes')}Notes</button>
    </nav>
    <button class="fab" data-cap aria-label="Capturer">${ico('plus')}</button></div>`;
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
  const counts = { boite: I.box.length || '', afaire: I.tasks.filter(t => !t.done && t.due && t.due <= today() && inS2(t)).length || '', notes: notesOf(I).n };
  $$('[data-count]').forEach(el => el.textContent = counts[el.dataset.count] ?? '');
  $('#sideDoms').innerHTML = [['', 'Tout'], ...SPHERES.map(s => [s.id, s.id])].map(([k, l]) => `<button class="nav ${sphere === k ? 'on' : ''}" data-sph="${esc(k)}">${k ? dot(k) : '<span class="dot" style="--c:var(--ink)"></span>'}${esc(l)}</button>`).join('');
  $$('[data-view]').forEach(b => b.classList.toggle('on', b.dataset.view === view));
  const html = { today: vToday, agenda: vAgenda, afaire: vAFaire, notes: vNotes, boite: vBoite }[view](I, late), vw = $('#view');
  if (html !== lastHTML) { vw.innerHTML = html; lastHTML = html; bindView(); hydrate(vw); }
  const clk = new Date().toLocaleTimeString('fr-FR'); $$('[data-clock]').forEach(c => c.textContent = clk);
  if (!splashing && boot && meta.last) { boot = false; bootFX($('#view')); }
  if (!splashing && view === 'today' && !typingDone && meta.last && !$('.lead')?.dataset.t) typeLead(); // relance si l'écran a été redessiné en pleine frappe
  paint(sstate, serr);
  $$('[data-act=chat]').forEach(b => b.hidden = !cfg.aiKey); // sans clé API, seul 🛠️ reste
  net?.refresh(I);
  document.title = (I.box.length ? `(${I.box.length}) ` : '') + 'Cerveau';
}
// La phrase du jour s'écrit lettre par lettre, une seule fois à l'ouverture
let typed = false;
function typeLead() {
  const el = $('.lead'); if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) { typed = typingDone = true; el?.classList.remove('wait'); return; }
  const again = typed; typed = true; el.dataset.t = '1';
  const full = el.innerHTML, pr = $('.pr', el).outerHTML, txt = el.textContent.replace(/^›/, '');
  let i = 0; el.classList.add('typing'); el.classList.remove('wait'); el.innerHTML = pr + '<span class="caret"></span>';
  const step = () => {
    if (!el.isConnected) return;
    i += 1; el.innerHTML = pr + esc(txt.slice(0, i)) + '<span class="caret"></span>';
    if (i < txt.length) setTimeout(step, txt[i - 1] === ' ' ? 55 : 32 + Math.random() * 30);
    else { el.innerHTML = full + '<span class="caret"></span>'; setTimeout(() => { el.classList.add('glx'); setTimeout(() => { el.classList.remove('typing'); }, 220); setTimeout(() => { el.classList.remove('glx'); $('.caret', el)?.classList.add('off'); typingDone = true; }, 650); }, 1400); }
  };
  setTimeout(step, again ? 0 : 1100); // après la séquence d’allumage du HUD
}
function go(v) { if (ALIAS[v]) { todoMode = ALIAS[v][1]; v = ALIAS[v][0]; } if (v !== view) boot = true; view = v; saveUI(); scrollTo({ top: 0 }); render(); }
// Texte qui se « décode » : caractères aléatoires qui se figent un à un
function decode(el, dur = 700, delay = 0) {
  if (!el) return; const target = el.textContent, glyphs = '█▓▒░<>/\\#01ΔΣ', t0 = performance.now() + delay;
  const f = now => { if (!el.isConnected) return; const k = (now - t0) / dur; el.textContent = [...target].map((c, i) => c === ' ' || k * target.length > i ? c : k < 0 ? ' ' : glyphs[Math.floor(Math.random() * glyphs.length)]).join(''); if (k < 1) requestAnimationFrame(f); else el.textContent = target; };
  requestAnimationFrame(f);
}
// Séquence d'allumage du HUD (au lancement et à chaque changement d'écran) : coins qui se referment, compteurs qui défilent
let boot = true, splashing = false, lastHTML = '', typingDone = false;
function bootFX(root) {
  if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const blocks = $$('.hud, .hudm', root);
  blocks.forEach(b => { b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); });
  $$('.lbl, .list > .row, .duo > button, .chips, .qadd, details.para, .btns', root).forEach((n, i) => { n.classList.remove('rin'); void n.offsetWidth; n.style.setProperty('--d', (250 + Math.min(i, 16) * 60) + 'ms'); n.classList.add('rin'); });
  decode($('#ttl'), 700);
  $$('.hud b, .hudm b', root).forEach(b => {
    const m = /^(\d+)(.*)$/.exec(b.textContent.trim()); if (!m) return;
    const end = +m[1], pad = m[1].length, rest = m[2], t0 = performance.now() + 350, d = 1300;
    const f = now => { if (!b.isConnected) return; const k = Math.max(0, Math.min(1, (now - t0) / d)); const v = k < 1 ? Math.floor(end * (1 - (1 - k) ** 3)) : end; b.textContent = String(v).padStart(pad, '0') + rest; if (k < 1) requestAnimationFrame(f); };
    b.textContent = '0'.repeat(pad) + rest; requestAnimationFrame(f);
  });
}

/* ---------- Aujourd'hui ---------- */
function vToday(I, lateAll) {
  if (!ghReady() && !Object.keys(notes).length) return `<p class="lead">Bienvenue. Pour retrouver tes notes sur le téléphone <em>et</em> l'ordinateur, connecte-toi.</p><div class="btns"><button class="btn" data-act="login">Se connecter</button><button class="btn line" data-act="settings">Réglages</button></div>`;
  if (ghReady() && !meta.last && !Object.keys(notes).length) return sstate === 'err' ? `<p class="lead">Impossible d'ouvrir le dépôt : ${esc(serr)}.</p><div class="btns"><button class="btn" data-act="settings">Vérifier les réglages</button></div>` : `<div class="spin"></div><p class="hint" style="text-align:center">Chargement de tes notes…</p>`;
  const T = I.tasks.filter(t => !t.done && inS2(t));
  const late = T.filter(t => t.due && t.due < today()).sort((a, b) => a.due.localeCompare(b.due)), tod = T.filter(t => t.due === today());
  const week = T.filter(t => t.due > today() && t.due <= addDays(today(), 7)).sort((a, b) => a.due.localeCompare(b.due));
  const projs = I.projs.filter(p => (p.fm.statut || 'actif') === 'actif' && inS(p)).sort((a, b) => (a.fm.echeance || '9').localeCompare(b.fm.echeance || '9'));
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
    <div class="hud-d"><div class="hud-t"><i class="blip"></i><span>${st}</span><span class="clk" data-clock></span></div>
    <div class="hud-g"><span><b>${z(notesOf(I).n)}</b>Notes</span><span><b>${z(I.box.length)}</b>Boîte</span><span><b>${z(open)}</b>Tâches</span><span class="${I.asks.length ? 'hot' : ''}"><b>${z(I.asks.length)}</b>Assistant</span><span class="seg" title="Tâches faites">${Array.from({ length: 10 }, (_, i) => `<i class="${i < seg ? 'on' : ''}"></i>`).join('')}</span></div></div>${hudX(I)}</div>`;
  let h = domsHTML() + hud + `<p class="lead${typingDone ? '' : ' wait'}"><span class="pr">›</span>${lead}</p>`;
  h += todayPills(); // Violette, PhantStudio
  h += agendaHTML(); // rendez-vous du jour
  h += `<div class="btns"><button class="btn line" data-act="recap">${ico('review', 16)} Récap day</button></div>`;
  const next = T.filter(t => t.due > today()).sort((a, b) => a.due.localeCompare(b.due))[0];
  h += lbl(`À faire aujourd’hui${late.length + tod.length ? ' · ' + (late.length + tod.length) : ''}`, 'Tout voir', 'taches') + (late.length || tod.length
    ? `<div class="list">${[...late, ...tod].slice(0, 6).map(t => taskRow(t)).join('')}</div>${late.length + tod.length > 6 ? `<button class="morebtn" data-go="taches">+ ${late.length + tod.length - 6} autres</button>` : ''}`
    : `<div class="list"><p class="empty">Rien de prévu aujourd’hui.${next ? ` Prochaine : « ${esc(plain(next.text))} », ${dueLabel(next.due)}.` : ''}</p></div>`);
  if (I.box.length) h += `<button class="boxbar" data-view="boite"><span class="bb-n">${I.box.length}</span><span><b>${I.box.length > 1 ? 'éléments' : 'élément'} à trier dans la boîte</b><small>${esc(I.box.slice(0, 3).map(x => x.title).join(' · '))}</small></span><span class="bb-go">Trier ›</span></button>`;
  if (I.asks.length) h += lbl(`Pour l’assistant · ${I.asks.length}`) + `<div class="list">${I.asks.map(askRow).join('')}</div>`;
  h += lbl('Projets en cours', projs.length ? 'Tous' : '', 'projets') + (projs.length ? `<div class="list">${projs.slice(0, 3).map(projRow).join('')}</div>` : `<div class="list"><p class="empty">Aucun projet en cours.</p></div><div class="btns"><button class="btn line" data-act="newproj">＋ Nouveau projet</button></div>`);
  h += `<div class="duo"><button data-act="journal"><b>Journal du jour</b><small>${cap1(frDate(today(), { weekday: 'long', day: 'numeric', month: 'long' }))}</small></button><button data-act="review"><b>Revue de la semaine</b><small>${UI.review ? 'Dernière le ' + frDate(UI.review, { day: 'numeric', month: 'short' }) : 'Jamais faite'}${revDue ? ' · <span style="color:var(--acc);font-weight:700">à faire</span>' : ''}</small></button></div>`;
  return h;
}

/* ---------- Boîte ---------- */
function vBoite(I) {
  if (!I.box.length) return `<p class="lead">Boîte vide. <em>Rien ne traîne</em>, ni ici ni dans ta tête.</p><div class="btns"><button class="btn" data-cap>＋ Capturer</button></div>`;
  return hudm(`File d'attente ▸ <b>${z3(I.box.length)}</b> élément${I.box.length > 1 ? 's' : ''}`, '<span class="blink">● Tri requis</span>') + `<p class="lead">Pour chaque élément, une seule question : <em>c’est une tâche, une note ou un projet ?</em></p><div class="btns" style="margin-bottom:6px"><button class="btn" data-act="triall">Trier pas à pas (${I.box.length})</button></div>` +
    `<div class="list" style="margin-top:14px">${I.box.map(x => `<div class="row"><span class="gl">${dot(x.dom) || '<span class="dot" style="--c:var(--line)"></span>'}</span><span class="m"><span class="t clk" data-open="${esc(x.path)}" style="cursor:pointer;white-space:normal;font-family:var(--serif);font-size:16.5px">${esc(x.title)}</span>${x.body.trim() ? `<div class="doc" style="font-size:13.5px;color:var(--ink2);max-height:120px;overflow:hidden;margin-top:4px">${md(x.body)}</div>` : ''}<div class="btns" style="margin-top:8px"><button class="btn sm" data-classify="${esc(x.path)}" style="flex:0">Trier</button><button class="btn sm line" data-open="${esc(x.path)}" style="flex:0">Ouvrir</button></div></span><span class="r">${x.fm.cree ? frDate(x.fm.cree, { day: 'numeric', month: 'short' }) : ''}</span></div>`).join('')}</div>`;
}

/* ---------- À faire : uniquement des actions (par date ou par projet) ---------- */
function vAFaire(I) {
  const all = I.tasks.filter(inS2), op = all.filter(t => !t.done), td = today();
  const lt = op.filter(t => t.due && t.due < td).length, wk = op.filter(t => t.due && t.due <= addDays(td, 7)).length;
  const tgt = sphere && I.doms.find(d => d.title === sphere);
  let h = domsHTML() + hudm(`<b>${z3(op.length)}</b> à faire · <b class="${lt ? 'warn' : ''}">${z3(lt)}</b> en retard`, `Charge 7 j <b>${z3(wk)}</b>`);
  h += `<div class="seg3">${[['date', 'Par date'], ['projet', 'Par projet'], ['faites', 'Faites']].map(([k, l]) => `<button class="${todoMode === k ? 'on' : ''}" data-tm="${k}">${l}</button>`).join('')}</div>`;
  if (todoMode !== 'faites') h += `<div class="qadd"><span class="ck"></span><input id="qT" placeholder="Nouvelle tâche → ${esc(tgt ? tgt.title : 'boîte de réception')}" enterkeyhint="done"><button class="btn sm" id="qOk">Ajouter</button></div>`;
  if (todoMode === 'faites') {
    const D = all.filter(t => t.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || '')).slice(0, 60);
    return h + `<div class="list">${D.length ? D.map(t => taskRow(t)).join('') : '<p class="empty">Aucune tâche faite pour l’instant.</p>'}</div>`;
  }
  if (todoMode === 'projet') {
    const act = I.projs.filter(p => (p.fm.statut || 'actif') === 'actif' && inS(p)).sort((a, b) => (a.fm.echeance || '9').localeCompare(b.fm.echeance || '9') || byTitle(a, b));
    const block = (x, kind) => {
      const ts = tasksOf(x), o = ts.filter(t => !t.done), d = ts.length - o.length, pc = ts.length ? Math.round(d * 100 / ts.length) : 0;
      const late = isISO(x.fm.echeance) && x.fm.echeance < td;
      return `<div class="pblock" style="--c:${sc(x.dom)}"><button class="pb-h" data-open="${esc(x.path)}"><span class="pb-t">${kind === 'projet' ? ico('proj', 16) : dot(x.dom)}<b>${esc(x.title)}</b></span><span class="pb-m">${isISO(x.fm.echeance) ? `<span class="${late ? 'late' : ''}">${frDate(x.fm.echeance, { day: 'numeric', month: 'short' })}</span> · ` : ''}${ts.length ? `${d}/${ts.length}` : 'aucune tâche'}</span></button>${kind === 'projet' ? `<span class="bar"><i style="width:${pc}%"></i></span>` : ''}
        <div class="list">${o.length ? o.sort((a, b) => (a.due || '9').localeCompare(b.due || '9')).map(t => taskRow(t, false)).join('') : `<p class="empty sm">${kind === 'projet' ? 'Plus rien à faire : projet terminé ?' : 'Rien en cours.'}</p>`}</div></div>`;
    };
    h += act.length ? act.map(p => block(p, 'projet')).join('') : `<p class="empty">Aucun projet en cours.</p>`;
    h += `<div class="btns"><button class="btn line" data-act="newproj">＋ Nouveau projet</button><button class="btn line" data-act="oldproj">Projets en pause / terminés</button></div>`;
    const D = I.doms.filter(x => inS(x) && tasksOf(x).some(t => !t.done)).sort(byTitle);
    if (D.length) h += lbl('Domaines · ce qui revient') + D.map(x => block(x, 'domaine')).join('');
    const loose = op.filter(t => !['projet', 'domaine'].includes(t.note.kind));
    if (loose.length) h += lbl(`Sans projet · ${loose.length}`) + `<div class="list">${loose.map(t => taskRow(t)).join('')}</div>`;
    return h;
  }
  const G = [['En retard', op.filter(t => t.due && t.due < td), 'bad'], ["Aujourd'hui", op.filter(t => t.due === td)], ['Demain', op.filter(t => t.due === addDays(td, 1))],
    ['Cette semaine', op.filter(t => t.due > addDays(td, 1) && t.due <= addDays(td, 7))], ['Plus tard', op.filter(t => t.due > addDays(td, 7))], ['Sans date', op.filter(t => !t.due)]];
  const body = G.filter(g => g[1].length).map(([l, L, c]) => lbl(`${l} · ${L.length}`, '', '', c || '') + `<div class="list">${L.sort((a, b) => (a.due || '').localeCompare(b.due || '')).map(t => taskRow(t)).join('')}</div>`).join('');
  return h + (body || `<p class="empty">Aucune tâche à faire${sphere ? ' ici' : ''}.</p>`);
}
// Projets en pause ou terminés (rarement utiles : rangés dans un panneau à part)
function oldProjects() {
  const I = buildIndex(), L = I.idx.filter(x => (x.kind === 'projet' || (x.kind === 'archive' && x.fm.type === 'projet')) && (x.fm.statut === 'en pause' || x.fm.statut === 'terminé'));
  const g = st => L.filter(x => x.fm.statut === st);
  layer('Projets en pause / terminés', lbl(`En pause · ${g('en pause').length}`) + `<div class="list">${g('en pause').map(projRow).join('') || '<p class="empty">Aucun.</p>'}</div>` + lbl(`Terminés · ${g('terminé').length}`) + `<div class="list">${g('terminé').map(projRow).join('') || '<p class="empty">Aucun.</p>'}</div>`);
}

/* ---------- Notes (PARA) ---------- */
// Ce que montre l'écran Notes : notes à garder, journal et archives (les compteurs comptent exactement ça)
function notesOf(I) {
  const keep = I.idx.filter(x => inS(x) && (x.kind === 'ressource' || x.kind === 'autre')).sort((a, b) => b.stamp - a.stamp);
  const J = I.idx.filter(x => x.kind === 'journal').sort((a, b) => b.title.localeCompare(a.title));
  const A = I.idx.filter(x => x.kind === 'archive' && inS(x)).sort((a, b) => b.stamp - a.stamp);
  return { keep, J, A, n: keep.length + J.length + A.length };
}
function vNotes(I) {
  const { keep, J, A } = notesOf(I);
  let h = domsHTML() + hudm(`Carnet ▸ <b>${z3(keep.length)}</b> notes à garder`, meta.last ? `Màj ${new Date(meta.last).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Local') + `<label class="search">${ico('search')}<input id="nq" value="${esc(nq)}" placeholder="Chercher partout (notes, projets, tâches)…"></label>`;
  if (nq.trim()) { const X = hits(nq).filter(x => x.kind !== 'fil'); return h + `<div class="list">${X.length ? X.map(noteRow).join('') : '<p class="empty">Rien trouvé.</p>'}</div>`; }
  h += `<p class="hint notes-hint">Ce que tu veux <b>garder</b> : idées, recettes, liens, infos. Ce qui est à <b>faire</b> vit dans « À faire ».</p>`;
  h += `<div class="list">${keep.length ? keep.map(noteRow).join('') : `<p class="empty">${sphere ? 'Aucune note ici.' : 'Aucune note pour l’instant.'}</p>`}</div>`;
  UI.open ||= {};
  const fold = (k, label, X) => X.length ? `<details class="para" data-k="${k}" ${UI.open[k] ? 'open' : ''}><summary><span class="n">${k === 'journal' ? 'J' : '4'}</span><b>${label}</b><span class="c">${X.length}</span></summary><div class="list">${X.map(noteRow).join('')}</div></details>` : '';
  h += `<div style="margin-top:18px">${fold('journal', 'Journal', J)}${fold('archive', 'Archives', A)}</div>`;
  return h + `<div class="btns"><button class="btn line" data-act="newnote">＋ Nouvelle note</button></div>`;
}
function hits(q) {
  const k = norm(q);
  return buildIndex().idx.map(x => ({ x, t: norm(x.title).includes(k) ? 2 : norm(notes[x.path].text).includes(k) ? 1 : 0 })).filter(r => r.t).sort((a, b) => b.t - a.t || b.x.stamp - a.x.stamp).map(r => r.x).slice(0, 40);
}

function bindView() {
  $$('[data-tm]').forEach(b => b.onclick = () => { todoMode = b.dataset.tm; saveUI(); boot = true; render(); });
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

/* ==========================================================
   Vue réseau : chaque note est un neurone, les [[liens]] (et donc les fils) sont les synapses.
   De loin les domaines, au milieu les notes, de près les tâches. Les notes nouvelles naissent en direct.
   ========================================================== */
let net = null;
function openNet() {
  if (net) return;
  const el = document.createElement('div'); el.className = 'net';
  el.innerHTML = `<canvas aria-label="Réseau des notes"></canvas>
    <div class="net-top"><div class="net-st"><span><b data-nn>0</b>neurones</span><span><b data-nl>0</b>synapses</span><span><b data-nt>0</b>tâches</span></div>
      <button class="ib" data-netx aria-label="Fermer la vue réseau">${ico('x')}</button></div>
    <div class="net-bot"><span class="net-lv">Vue : <b data-nv>notes</b> · zoome pour voir les tâches</span>
      <div class="net-btns"><button class="btn sm" data-cap>${ico('plus', 16)} Capturer</button><button class="btn sm line" data-netr>Rejouer</button><button class="btn sm line" data-netf>Recentrer</button></div></div>
    <div class="net-card" hidden></div>`;
  document.body.appendChild(el); document.body.style.overflow = 'hidden';
  history.pushState({ net: 1 }, '');
  const cv = $('canvas', el), ctx = cv.getContext('2d'), card = $('.net-card', el), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ANCH = { Perso: [-1, .55], Salarié: [1, .55], PhantStudio: [0, -1], '': [0, .15] };
  const DAY = 864e5;
  let N = [], L = [], C = {}, W = 0, H = 0, DPR = 1, cam = { x: 0, y: 0, k: 1 }, sel = null, hover = null, alive = true, fc = 0, first = true;
  const pulses = [], pings = [];
  const colors = () => {
    const s = getComputedStyle(document.documentElement), g = v => s.getPropertyValue(v).trim();
    C = { paper: g('--paper'), ink: g('--ink'), ink2: g('--ink2'), mut: g('--mut'), hud: g('--hud'), glow: g('--hud-glow'), Perso: g('--perso'), Salarié: g('--salarie'), PhantStudio: g('--phant'), '': g('--mut') };
    C.kind = { boite: '#d9a300', projet: C.hud, domaine: C.ink, ressource: C.Salarié, fil: C.Perso, journal: C.PhantStudio, archive: C.mut };
  };
  const rgba = (c, a) => { const m = /^#([0-9a-f]{6})$/i.exec(c); if (!m) return c; const v = parseInt(m[1], 16); return `rgba(${v >> 16},${v >> 8 & 255},${v & 255},${a})`; };
  const open = n => n.tasks.filter(t => !t.done).length;
  const rad = n => n.hub ? 15 : 5 + Math.min(open(n), 5) * 1.6;
  const level = () => cam.k < .55 ? 'domaines' : cam.k < 1.7 ? 'notes' : 'tâches';
  const pos = d => { const a = ANCH[d] || ANCH['']; return [a[0] * 260 + (Math.random() - .5) * 120, a[1] * 230 + (Math.random() - .5) * 120]; };

  // Reconstruit le réseau depuis les notes ; garde la place des neurones connus, fait naître les nouveaux
  function refresh(I = buildIndex(), born = performance.now()) {
    const old = new Map(N.map(n => [n.path, n])), oldL = new Set(L.map(l => l.key));
    N = I.idx.map(x => {
      let n = old.get(x.path);
      if (!n) { const [px, py] = pos(x.dom); n = { path: x.path, x: px, y: py, vx: 0, vy: 0, born: first ? born - 9999 : born }; if (!first) pings.push({ n, t: born }); }
      return Object.assign(n, { title: x.title, kind: x.kind, dom: x.dom, hub: x.kind === 'domaine', tasks: tasksOf(x), stamp: x.stamp, cree: Date.parse(x.fm.cree || '') || x.stamp });
    });
    const by = new Map(N.map(n => [n.path, n])), seen = new Set(); L = [];
    const add = (a, b, weak) => { if (!a || !b || a === b) return; const key = [a.path, b.path].sort().join('|'); if (seen.has(key)) return; seen.add(key); L.push({ a, b, weak, key, born: oldL.has(key) || first ? born - 9999 : born }); };
    for (const n of N) for (const m of notes[n.path].text.matchAll(/(?<!!)\[\[([^\]|#]+)/g)) add(n, by.get(findByTitle(m[1].trim())), false);
    const hubs = Object.fromEntries(N.filter(n => n.hub).map(n => [n.title, n]));
    for (const n of N) if (n.dom && !n.hub) add(n, hubs[n.dom], true);
    first = false;
  }
  function step() {
    for (const n of N) { const a = ANCH[n.dom] || ANCH['']; n.vx += (a[0] * 260 - n.x) * .0016; n.vy += (a[1] * 230 - n.y) * .0016; }
    for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) {
      const a = N[i], b = N[j]; let dx = b.x - a.x, dy = b.y - a.y; const q = dx * dx + dy * dy || 1; if (q > 90000) continue;
      const min = (rad(a) + rad(b)) * 3.2 + 26, f = Math.min(1600 / q, 2) + (q < min * min ? .08 : 0), dd = Math.sqrt(q);
      dx /= dd; dy /= dd; a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
    }
    for (const l of L) {
      const dx = l.b.x - l.a.x, dy = l.b.y - l.a.y, dd = Math.hypot(dx, dy) || 1, f = (dd - (l.weak ? 150 : 85)) * (l.weak ? .0018 : .006);
      l.a.vx += dx / dd * f; l.a.vy += dy / dd * f; l.b.vx -= dx / dd * f; l.b.vy -= dy / dd * f;
    }
    for (const n of N) { if (n === drag?.node) { n.vx = n.vy = 0; continue; } n.vx *= .82; n.vy *= .82; n.x += n.vx; n.y += n.vy; }
  }
  const ease = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t) * Math.cos(t * 7);
  function draw(now) {
    const k = cam.k;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = rgba(C.hud, .06); ctx.lineWidth = 1; const gs = 60 * k, ox = (W / 2 - cam.x * k) % gs, oy = (H / 2 - cam.y * k) % gs;
    ctx.beginPath(); for (let x = ox; x < W; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = oy; y < H; y += gs) { ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
    ctx.setTransform(DPR * k, 0, 0, DPR * k, DPR * (W / 2 - cam.x * k), DPR * (H / 2 - cam.y * k));
    // Régions des domaines, nommées de loin
    const regA = Math.max(0, Math.min(1, (.8 - k) / .3));
    for (const s of SPHERES) {
      const ns = N.filter(n => n.dom === s.id); if (!ns.length) continue;
      const cx = ns.reduce((a, n) => a + n.x, 0) / ns.length, cy = ns.reduce((a, n) => a + n.y, 0) / ns.length, r = 120 + Math.sqrt(ns.length) * 40, g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, rgba(C[s.id], .16 * (.35 + regA))); g.addColorStop(1, rgba(C[s.id], 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
      if (regA > .02) {
        ctx.globalAlpha = regA; ctx.textAlign = 'center'; ctx.fillStyle = C[s.id]; ctx.font = `700 ${15 / k}px Orbitron, monospace`; ctx.fillText(s.id.toUpperCase(), cx, cy - r * .2);
        ctx.font = `${11 / k}px "Share Tech Mono", monospace`; ctx.fillStyle = C.mut; ctx.fillText(`${ns.length} NOTES · ${ns.reduce((a, n) => a + open(n), 0)} TÂCHES`, cx, cy - r * .2 + 17 / k); ctx.globalAlpha = 1;
      }
    }
    for (const l of L) {
      const g = Math.min(1, (now - l.born) / 700); if (g <= 0) continue;
      const hot = sel && (l.a === sel || l.b === sel);
      ctx.strokeStyle = hot ? C.hud : rgba(l.weak ? C.mut : C.ink2, l.weak ? .22 : .5); ctx.lineWidth = (hot ? 2 : l.weak ? .6 : 1.3) / Math.max(k, .6);
      ctx.beginPath(); ctx.moveTo(l.a.x, l.a.y); ctx.lineTo(l.a.x + (l.b.x - l.a.x) * g, l.a.y + (l.b.y - l.a.y) * g); ctx.stroke();
    }
    if (!reduce && Math.random() < .08) { const s = L.filter(l => !l.weak); if (s.length) pulses.push({ l: s[Math.random() * s.length | 0], t: now, rev: Math.random() < .5 }); }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i], u = (now - p.t) / 1100; if (u > 1 || !N.includes(p.l.a)) { pulses.splice(i, 1); continue; }
      const [a, b] = p.rev ? [p.l.b, p.l.a] : [p.l.a, p.l.b];
      ctx.fillStyle = C.hud; ctx.shadowColor = C.glow; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, 2.2 / Math.max(k, .7), 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    }
    // Tâches en dendrites, de près
    const tA = Math.max(0, Math.min(1, (k - 1.4) / .5));
    if (tA > 0) for (const [ni, n] of N.entries()) {
      const m = n.tasks.length, R = rad(n) + 26;
      n.tasks.forEach((t, i) => {
        const ang = -Math.PI / 2 + (i - (m - 1) / 2) * .62 + (ni % 7) * .9, c = Math.cos(ang), tx = n.x + c * R, ty = n.y + Math.sin(ang) * R;
        ctx.globalAlpha = tA; ctx.strokeStyle = t.done ? rgba(C.mut, .5) : rgba(C.hud, .7); ctx.lineWidth = .8 / k;
        ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.quadraticCurveTo(n.x + c * R * .5 + 6, n.y + Math.sin(ang) * R * .5 - 6, tx, ty); ctx.stroke();
        ctx.fillStyle = t.done ? C.mut : C.hud; ctx.beginPath(); ctx.arc(tx, ty, 3 / Math.sqrt(k), 0, 7); ctx.fill();
        if (k > 2.2) { const lab = (t.done ? '✓ ' : '') + plain(t.text); ctx.font = `${11 / k}px ${getComputedStyle(document.body).fontFamily}`; ctx.textAlign = c < -.2 ? 'right' : 'left'; ctx.fillStyle = t.done ? C.mut : C.ink2; ctx.fillText(lab.length > 48 ? lab.slice(0, 46) + '…' : lab, tx + (c < -.2 ? -6 : 6) / k, ty + 3.5 / k); }
        ctx.globalAlpha = 1;
      });
    }
    const lvl = level();
    for (const [ni, n] of N.entries()) {
      const age = (now - n.born) / 900; if (age < 0) continue;
      const r = Math.max(0, rad(n) * ease(age)), col = C.kind[n.kind] || C.ink, fresh = Math.max(0, 1 - (Date.now() - n.stamp) / (6 * DAY)), br = reduce ? 0 : Math.sin(now / 900 + ni) * .5 + .5;
      if (fresh > 0 || n === sel) { ctx.shadowColor = n === sel ? C.glow : rgba(col, .8); ctx.shadowBlur = (8 + 14 * fresh * (.6 + .4 * br)) * (n === sel ? 1.6 : 1); }
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      if (n.hub) { ctx.strokeStyle = C.paper; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(n.x, n.y, r * .55, 0, 7); ctx.stroke(); }
      if (n === sel || n === hover) { ctx.strokeStyle = C.hud; ctx.lineWidth = 1.4 / k; ctx.setLineDash([4 / k, 3 / k]); ctx.beginPath(); ctx.arc(n.x, n.y, r + 6 / k + 2, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
      if (n.hub ? k > .55 : lvl !== 'domaines' && (k > .85 || n === hover || n === sel || fresh > .5)) {
        const lab = n.hub ? n.title.toUpperCase() : n.title.length > 34 && k < 2 ? n.title.slice(0, 32) + '…' : n.title, ly = n.y + r + 15 / k;
        ctx.globalAlpha = Math.min(1, age); ctx.textAlign = 'center'; ctx.font = n.hub ? `700 ${12 / k}px Orbitron, monospace` : `${13 / k}px ${getComputedStyle(document.documentElement).getPropertyValue('--serif')}`;
        ctx.lineWidth = 3 / k; ctx.strokeStyle = C.paper; ctx.strokeText(lab, n.x, ly); ctx.fillStyle = n === sel ? C.hud : C.ink; ctx.fillText(lab, n.x, ly); ctx.globalAlpha = 1;
      }
    }
    for (let i = pings.length - 1; i >= 0; i--) {
      const p = pings[i], u = (now - p.t) / 1400; if (u > 1) { pings.splice(i, 1); continue; }
      ctx.strokeStyle = rgba(C.hud, 1 - u); ctx.lineWidth = 2 / k;
      for (const o of [0, .3]) if (u > o) { ctx.beginPath(); ctx.arc(p.n.x, p.n.y, 8 + (u - o) * 90, 0, 7); ctx.stroke(); }
    }
  }
  const nn = $('[data-nn]', el), nl = $('[data-nl]', el), nt = $('[data-nt]', el), nv = $('[data-nv]', el);
  function frame(now) {
    if (!alive) return;
    if (!(fc++ % 30)) colors();
    step(); draw(now);
    const on = N.filter(n => n.born <= now);
    nn.textContent = on.length; nl.textContent = L.filter(l => !l.weak && l.born <= now).length; nt.textContent = on.reduce((a, n) => a + open(n), 0); nv.textContent = level();
    requestAnimationFrame(frame);
  }
  const size = () => { DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; };
  const toW = (sx, sy) => [(sx - W / 2) / cam.k + cam.x, (sy - H / 2) / cam.k + cam.y];
  const zoomAt = (sx, sy, f) => { const [wx, wy] = toW(sx, sy); cam.k = Math.max(.25, Math.min(4.5, cam.k * f)); cam.x = wx - (sx - W / 2) / cam.k; cam.y = wy - (sy - H / 2) / cam.k; };
  const pick = (sx, sy) => { const [x, y] = toW(sx, sy); let b = null, bd = 1e9; for (const n of N) { const q = Math.hypot(n.x - x, n.y - y); if (q < rad(n) + 10 / cam.k && q < bd) { bd = q; b = n; } } return b; };
  function fit() {
    if (!N.length) return; const xs = N.map(n => n.x), ys = N.map(n => n.y), w = Math.max(...xs) - Math.min(...xs) + 160, h = Math.max(...ys) - Math.min(...ys) + 240;
    cam.k = Math.max(.3, Math.min(1.2, Math.min(W / w, H / h))); cam.x = (Math.max(...xs) + Math.min(...xs)) / 2; cam.y = (Math.max(...ys) + Math.min(...ys)) / 2;
  }
  // Déplacer, pincer, molette, toucher un neurone
  const pts = new Map(); let drag = null, pinch = null;
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: cam.k }; drag = null; return; }
    drag = { node: pick(e.clientX, e.clientY), sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, moved: false };
  });
  cv.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) { hover = pick(e.clientX, e.clientY); cv.style.cursor = hover ? 'pointer' : 'grab'; return; }
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && pts.size === 2) { const [a, b] = [...pts.values()]; zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, pinch.k * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d / cam.k); return; }
    if (!drag) return; const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy; if (Math.hypot(dx, dy) > 4) drag.moved = true;
    if (drag.node) [drag.node.x, drag.node.y] = toW(e.clientX, e.clientY); else { cam.x = drag.cx - dx / cam.k; cam.y = drag.cy - dy / cam.k; }
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (drag && !drag.moved) { sel = drag.node; showCard(); } drag = null; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * .0015)); }, { passive: false });
  // Fiche de la note touchée : cocher une tâche, ouvrir la note, sauter vers un voisin
  function showCard() {
    const n = sel; card.hidden = !n; if (!n) return;
    const nb = L.filter(l => !l.weak && (l.a === n || l.b === n)).map(l => l.a === n ? l.b : l.a), o = open(n);
    card.innerHTML = `<div class="kick">${esc(KIND(n.kind)?.short || 'Note')}${n.dom ? ' · ' + esc(n.dom) : ''}</div><h3>${esc(n.title)}</h3>
      <div class="net-meta">${o} tâche${o > 1 ? 's' : ''} ouverte${o > 1 ? 's' : ''} · modifiée ${frDate(new Date(n.stamp).toISOString().slice(0, 10), { day: 'numeric', month: 'short' })}</div>
      ${n.tasks.map((t, i) => `<div class="task ${t.done ? 'done' : ''}"><button class="ck" data-nk="${i}" aria-label="${t.done ? 'Rouvrir' : 'Cocher'}"></button><span class="tx">${inline(t.text)}</span></div>`).join('')}
      ${nb.length ? `<div class="net-nb">${nb.map(m => `<button data-nj="${esc(m.path)}">↳ ${esc(m.title)}</button>`).join('')}</div>` : ''}
      <div class="net-ca"><button class="btn sm" data-no>Ouvrir la note</button><button class="btn sm line" data-nc>Fermer</button></div>`;
  }
  card.addEventListener('click', e => {
    const n = sel; if (!n) return; e.stopPropagation();
    const ck = e.target.closest('[data-nk]'); if (ck) { const t = n.tasks[+ck.dataset.nk]; if (toggleLine(t.path, t.line, t.raw)) pings.push({ n, t: performance.now() }); render(); return showCard(); }
    const j = e.target.closest('[data-nj]'); if (j) { sel = N.find(m => m.path === j.dataset.nj) || null; if (sel) { cam.x = sel.x; cam.y = sel.y; } return showCard(); }
    if (e.target.closest('[data-no]')) return openNote(n.path);
    if (e.target.closest('[data-nc]')) { sel = null; showCard(); }
  });
  $('[data-netx]', el).onclick = () => history.state?.net ? history.back() : close();
  $('[data-netf]', el).onclick = fit;
  $('[data-netr]', el).onclick = () => {
    const t0 = performance.now(), order = [...N].sort((a, b) => a.cree - b.cree), step = Math.min(260, 9000 / (order.length || 1));
    order.forEach((n, i) => { n.born = t0 + 300 + i * step; if (i % 3 === 0) setTimeout(() => alive && pings.push({ n, t: performance.now() }), 300 + i * step); });
    for (const l of L) l.born = Math.max(l.a.born, l.b.born);
    sel = null; showCard();
  };
  function close() { alive = false; removeEventListener('resize', size); el.remove(); document.body.style.overflow = ''; net = null; }
  addEventListener('resize', size); size(); colors();
  refresh(); for (let i = 0; i < 260; i++) step(); fit();
  requestAnimationFrame(frame);
  net = { refresh, close };
}
addEventListener('popstate', () => { if (net && !history.state?.net && (!ov || ov.hidden)) net.close(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && net && (!ov || ov.hidden)) history.state?.net ? history.back() : net.close(); });

/* ---------- Clics communs ---------- */
const WORK_MSG = 'Traite mes demandes du Cerveau : les notes et les fils « à traiter », puis passe-les à « fait ».';
const ACTS = { chat: () => chat(), reseau: () => openNet(), settings: () => settings(), search: () => search(), journal: () => journal(), review: () => review(), newproj: () => newProject(), oldproj: () => oldProjects(), calguide: () => calGuide(), recap: () => recapDay(), loginlink: () => loginLinkSheet(), loginsetup: () => loginSetupSheet(), login: () => startLogin(), calhide: () => { UI.noCal = true; saveUI(); render(); }, calkey: () => settings('cal'), work: () => { if (!cfg.work) return settings('work'); navigator.clipboard?.writeText(WORK_MSG).then(() => toast('Message copié : colle-le et envoie'), () => {}); open(cfg.work, '_blank', 'noopener'); }, newnote: () => editNote(null), sync: () => ghReady() ? sync() : settings(), triall: () => { const b = buildIndex().box[0]; if (b) classify(b.path, true); } };
document.addEventListener('click', e => {
  const xi = e.target.closest('[data-ximg]'); if (xi) { e.preventDefault(); const im = Object.assign(document.createElement('img'), { className: 'att', src: xi.dataset.ximg, alt: xi.dataset.alt, referrerPolicy: 'no-referrer' }); im.onclick = () => window.open(im.src, '_blank', 'noopener'); return xi.replaceWith(im); }
  const wl = e.target.closest('[data-wl]'); if (wl) { e.preventDefault(); return openWiki(wl.dataset.wl); }
  if (e.target.closest('a[target]')) return;
  const tm = e.target.closest('[data-tmenu]'); if (tm) { const t = TK[+tm.dataset.tmenu]; if (t) taskSheet(t); return; }
  const th = e.target.closest('[data-th]'); if (th) { const t = TK[+th.dataset.th]; if (t) openThread(t.path, t.line, t.raw); return; }
  const tk = e.target.closest('[data-tk]'); if (tk) { const t = TK[+tk.dataset.tk]; if (t) { if (toggleLine(t.path, t.line, t.raw)) ping(tk); render(); } return; }
  const sp = e.target.closest('[data-sph]'); if (sp) { sphere = sp.dataset.sph; saveUI(); return render(); }
  const vw = e.target.closest('[data-view]'); if (vw) return go(vw.dataset.view);
  if (e.target.closest('[data-cap]')) return capture();
  const ac = e.target.closest('[data-act]'); if (ac) { const f = ACTS[ac.dataset.act]; if (f) { e.preventDefault(); return f(); } }
  const cv = e.target.closest('[data-cal]'); if (cv) return analyseEvent(cv.dataset.cal);
  const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); return g.dataset.go === 'newdom' ? editNote(null, { kind: 'domaine', fm: { type: 'domaine' } }) : g.dataset.go === 'calkey' ? settings('cal') : go(g.dataset.go); }
  const cl = e.target.closest('[data-classify]'); if (cl) return classify(cl.dataset.classify, false);
  const op = e.target.closest('[data-open]'); if (op) { e.preventDefault(); return openNote(op.dataset.open); }
});
// Raccourcis clavier (ordinateur) : N = capturer, / = aller à
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
    <span class="sub" style="margin-top:14px">C’est…</span>
    <div class="dest d3">
      <button type="button" data-d="tache"><b>Une tâche</b><small>À faire</small></button>
      <button type="button" data-d="ressource"><b>Une note</b><small>À garder</small></button>
      <button type="button" data-d="projet"><b>Un projet</b><small>Plusieurs étapes</small></button>
    </div>
    <div id="cMore"></div>
    <div class="btns"><button class="btn bad" id="cDel">Supprimer</button>${chain ? '<button class="btn line" id="cSkip">Passer</button>' : ''}</div>`);
  const getS = chipGroup(pan, 'cS', d => { const sel = $('#tfTo', pan), p = domNote(d); if (sel && p) sel.value = p; });
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
    if (d === 'tache') {
      if (title() !== x.title) { saveNote(path, withDom()); path = moveNote(path, uniquePath(dirOf('boite'), title())); }
      more.innerHTML = `<div style="margin-top:14px;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--sheet)">${taskFormHTML(info(path), getS())}</div>`;
      bindTaskForm(pan, path, msg => done(msg));
      setTimeout(() => more.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50);
      return;
    }
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

/* ---------- Transformer une note en tâche ---------- */
const domNote = d => { const D = buildIndex().doms; return (D.find(n => n.title === d) || D.find(n => n.fm.domaine === d && d))?.path || ''; };
function taskFormHTML(x, dom) {
  const lines = x.body.split('\n').map(l => l.trim()).filter(Boolean), single = lines.length <= 1 && !/!\[\[|https?:|\[\[/.test(x.body);
  const guess = lines.length === 1 && !TASK.test(lines[0]) && lines[0].length < 80 ? lines[0] : x.title;
  const due = (/📅\s*(\d{4}-\d{2}-\d{2})/u.exec(x.body) || [])[1] || '';
  return `<div class="tform"><div class="fld"><label for="tfT">La tâche</label><input id="tfT" value="${esc(guess.replace(/^[-*+] \[ \] ?/, ''))}"></div>
    <div class="fld"><label for="tfTo">Rangée dans</label><select id="tfTo">${targetOptions(domNote(dom || x.dom))}</select></div>
    <span class="sub">Échéance</span>${dueChips('tfDue', due)}
    <label class="askchk" style="color:var(--ink2);margin-top:10px"><input type="checkbox" id="tfKeep" ${single ? '' : 'checked'}> Garder aussi la note (reliée à la tâche)</label>
    <button class="btn block" id="tfGo" style="margin-top:8px">En faire une tâche</button></div>`;
}
function bindTaskForm(pan, path, after) {
  const getDue = dueGroup(pan, 'tfDue');
  $('#tfGo', pan).onclick = () => {
    const x = info(path), to = $('#tfTo', pan).value, keep = $('#tfKeep', pan).checked;
    let t = $('#tfT', pan).value.replace(/\s+/g, ' ').trim() || x.title;
    if (!to) return toast('Choisis où ranger la tâche');
    let np = null;
    if (keep) { np = x.kind === 'ressource' ? path : moveNote(path, uniquePath(dirOf('ressource'), x.title)); t += ` — [[${titleOf(np)}]]`; }
    appendTo(to, { text: t, task: true, due: getDue() });
    if (!keep) deleteNote(path);
    vibrate(); after(`Tâche ajoutée dans « ${titleOf(to)} »`);
  };
}
function toTaskSheet(path) {
  const x = info(path), pan = layer('En faire une tâche', taskFormHTML(x));
  bindTaskForm(pan, path, msg => { toast(msg); closeLayer(() => render()); render(); });
}

/* ---------- Lire une note ---------- */
function openNote(path) {
  if (!notes[path]) return toast('Note introuvable');
  if (kindOf(path) === 'fil') { const f = threadParent(path); if (f) return openThread(f.path, f.line, f.raw); }
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
    <div class="btns" style="margin-top:26px">${x.kind === 'boite' ? '<button class="btn" id="nCl">Trier</button>' : ''}${['ressource', 'autre', 'boite', 'journal'].includes(x.kind) ? '<button class="btn line" id="nTk">✓ En faire une tâche</button>' : ''}<button class="btn line" id="nMv">Déplacer</button>${cfg.aiKey ? '<button class="btn line askbtn" id="nChat">💬 En discuter avec l’IA</button>' : ''}<button class="btn line askbtn" id="nAsk">◆ ${x.ask ? 'Consigne' : 'Confier à l’assistant'}</button>
      ${isProj && x.fm.statut !== 'terminé' ? '<button class="btn line" id="nEnd">Projet terminé</button>' : ''}
      ${x.kind === 'archive' ? '<button class="btn line" id="nUn">Sortir des archives</button>' : x.kind !== 'boite' && !isProj ? '<button class="btn line" id="nArc">Archiver</button>' : ''}
      <button class="btn bad" id="nDel">Supprimer</button></div>
    <p class="path">${esc(path)}</p>`, { page: true, actions: `<button class="ib" id="nEd" aria-label="Modifier">${ico('edit')}</button>` });
  scanDoc($('#nMd', pan));
  const redraw = () => { const y = info(path); $('#nMd', pan).innerHTML = md(y.body, notes[path].text.split('\n').length - y.body.split('\n').length); hydrate($('#nMd', pan)); render(); };
  bindQz($('#nMd', pan), path, redraw);
  $('#nMd', pan).addEventListener('click', e => {
    const tx = e.target.closest('[data-thr]'); if (tx && !e.target.closest('a')) { const i = +tx.dataset.thr; return openThread(path, i, notes[path].text.split('\n')[i]); }
    const b = e.target.closest('[data-tl]'); if (!b) return;
    const i = +b.dataset.tl;
    if (toggleLine(path, i, notes[path].text.split('\n')[i])) ping(b);
    const y = info(path); $('#nMd', pan).innerHTML = md(y.body, notes[path].text.split('\n').length - y.body.split('\n').length); hydrate($('#nMd', pan)); render();
  });
  const on = (s, f) => { const el = $(s, pan); if (el) el.onclick = f; };
  on('#nEd', () => editNote(path));
  on('#nCl', () => classify(path, false));
  on('#nMv', () => moveSheet(path));
  on('#nTk', () => toTaskSheet(path));
  on('#nAsk', () => askSheet(path));
  on('#nChat', () => chat('', path));
  on('#nEnd', () => { setFm(path, { statut: 'terminé', fini: today() }); const np = moveNote(path, uniquePath(dirOf('archive'), x.title)); vibrate(); toast('Bravo ! Projet rangé dans les archives'); render(); openNote(np); });
  on('#nArc', () => { const np = moveNote(path, uniquePath(dirOf('archive'), x.title)); toast('Archivé'); render(); openNote(np); });
  on('#nUn', () => { const k = x.fm.type === 'projet' ? 'projet' : x.fm.type === 'domaine' ? 'domaine' : 'ressource'; if (k === 'projet') setFm(path, { statut: 'actif', fini: undefined }); const np = moveNote(path, uniquePath(dirOf(k), x.title)); toast('Sorti des archives'); render(); openNote(np); });
  on('#nDel', () => { if (!confirm(`Supprimer « ${x.title} » ? (l'historique GitHub en garde une copie)`)) return; deleteNote(path); closeLayer(() => render()); render(); toast('Supprimée'); });
}

/* ==========================================================
   Fils de discussion : chaque étape (tâche) peut ouvrir un fil.
   La tâche reçoit un identifiant « 🆔 abc123 » (format Tasks d'Obsidian) ;
   le fil est une note du dossier Fils/ : en-tête fil, parent, tache ;
   messages « ### AAAA-MM-JJ HH:MM · moi » ou « · assistant ».
   ========================================================== */
const MSG = /^###\s+(\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})?)\s*·\s*(moi|assistant)\s*$/i;
const threadPath = id => Object.keys(notes).find(p => kindOf(p) === 'fil' && parse(notes[p].text).fm.fil === id);
const threadCount = id => { const p = threadPath(id); return p ? notes[p].text.split('\n').filter(l => MSG.test(l)).length : 0; };
function threadParent(tp) {
  const { fm } = parse(notes[tp].text), pt = /\[\[([^\]|#]+)/.exec(fm.parent || '');
  const pp = pt && findByTitle(pt[1]); if (!pp || !notes[pp]) return null;
  const L = notes[pp].text.split('\n'), i = L.findIndex(l => TASK.test(l) && new RegExp('🆔\\s*' + escRe(fm.fil) + '\\b', 'u').test(l));
  return i < 0 ? null : { path: pp, line: i, raw: L[i] };
}
const stampNow = () => `${today()} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
const stampLabel = st => { const [d, h] = st.split(' '); return `${d === today() ? "Aujourd'hui" : frDate(d, { day: 'numeric', month: 'short' })}${h ? ' · ' + h : ''}`; };
function openThread(path, line, raw) {
  if (!notes[path]) return;
  const L0 = notes[path].text.split('\n'); let i = L0[line] === raw ? line : L0.indexOf(raw); if (i < 0) i = line;
  const m = TASK.exec(L0[i] || ''); if (!m) return toast('Étape introuvable');
  const id = (/🆔\s*([\w-]+)/u.exec(m[3]) || [])[1], tp = id && threadPath(id);
  const text = m[3].replace(/[📅✅⏳🛫]\s*\d{4}-\d{2}-\d{2}/gu, '').replace(/🆔\s*[\w-]+/gu, '').replace(/\s+/g, ' ').trim(), done = m[2] !== ' ';
  const due = (/📅\s*(\d{4}-\d{2}-\d{2})/u.exec(m[3]) || [])[1];
  const parent = info(path);
  let msgs = [], intro = '', tx = null;
  if (tp) {
    tx = info(tp); const BL = tx.body.split('\n'), off = notes[tp].text.split('\n').length - BL.length; let cur = null;
    BL.forEach((l, k) => { const mm = MSG.exec(l); if (mm) { cur = { st: mm[1], who: mm[2].toLowerCase(), lines: [], at: off + k + 1 }; msgs.push(cur); } else if (cur) cur.lines.push(l); else intro += l + '\n'; });
  }
  const msgHTML = mm => `<div class="msg ${mm.who === 'assistant' ? 'ai' : 'me'}"><div class="mh">${mm.who === 'assistant' ? '◆ Assistant' : 'Moi'} · ${esc(stampLabel(mm.st))}</div><div class="doc">${md(mm.lines.join('\n').trim() ? mm.lines.join('\n').replace(/\n+$/, '') : '', mm.at) || '<p class="empty">…</p>'}</div></div>`;
  const pan = layer('', `
    ${hudm(`Fil ▸ ${esc(parent.title)}`, tp ? `<b>${z3(msgs.length)}</b> message${msgs.length > 1 ? 's' : ''}` : 'Nouveau fil')}
    <div class="thtask ${done ? 'done' : ''}"><button class="ck" id="thCk" aria-label="${done ? 'Rouvrir' : 'Cocher'}"></button><div><div class="ntitle" style="font-size:25px;margin:0">${inline(text)}</div>${due ? `<span class="due ${!done && due < today() ? 'late' : ''}">→ ${dueLabel(due)}</span>` : ''}</div></div>
    <button class="thparent" data-open="${esc(path)}">↩ ${esc(parent.title)}</button>
    ${tx?.ask ? `<div class="askbox"><span>◆ En attente de l’assistant</span>${esc(tx.fm.consigne || 'Réponse au dernier message')}</div>` : ''}
    <div class="msgs" id="thM">${intro.trim() ? `<div class="doc">${md(intro.trim())}</div>` : ''}${msgs.map(msgHTML).join('') || '<p class="empty">Aucun message. Lance le fil : une idée, une question, une piste…</p>'}</div>
    <div class="composer"><div class="capw"><textarea class="big" id="thT" rows="3" placeholder="Écris dans le fil…" style="min-height:90px;font-size:17px"></textarea><span class="tag"><i class="wv"><b></b><b></b><b></b><b></b><b></b><b></b><b></b></i>Écoute</span></div>
      <div class="thumbs" id="thI"></div><div class="chips" style="margin-top:6px"><button type="button" class="chip" id="thP">📷 Photo</button></div>
      <label class="askchk"><input type="checkbox" id="thA"> ◆ Demander à l’assistant <small>réponse ou questionnaire dans le fil</small></label>
      <div class="btns">${cfg.aiKey ? '<button class="btn line askbtn" id="thAI">◆ Réponse de l’IA</button>' : ''}<button class="btn" id="thOk">Envoyer</button></div></div>`, { page: true });
  hydrate($('#thM', pan));
  if (tp) bindQz($('#thM', pan), tp, () => openThread(path, i, notes[path].text.split('\n')[i]));
  $('#thCk', pan).onclick = e => { const L = notes[path].text.split('\n'); if (toggleLine(path, i, L[i])) ping(e.currentTarget); render(); openThread(path, i, notes[path].text.split('\n')[i]); };
  $('#thT', pan).onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('#thOk', pan).click(); };
  const imgs = [];
  const drawImgs = () => { $('#thI', pan).innerHTML = imgs.map((m, k) => `<span class="th"><img src="${m.url}" alt=""><button type="button" data-rm="${k}" aria-label="Retirer">×</button></span>`).join(''); };
  $('#thI', pan).onclick = e => { const b = e.target.closest('[data-rm]'); if (b) { imgs.splice(+b.dataset.rm, 1); drawImgs(); } };
  $('#thP', pan).onclick = () => { const f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*'; f.multiple = true; f.onchange = async () => { for (const x of f.files) { const r = await shrink(x); imgs.push({ ...r, url: URL.createObjectURL(r.blob) }); } drawImgs(); }; f.click(); };
  const send = async ai => {
    let msg = $('#thT', pan).value.trim(); const ask = !ai && $('#thA', pan).checked;
    if (!msg && !ask && !ai && !imgs.length) return toast('Écris quelque chose');
    if (ai && !navigator.onLine) return toast('Pas de réseau');
    $$('#thOk, #thAI', pan).forEach(b => b.disabled = true);
    if (ai) $('#thAI', pan).textContent = '◆ réfléchit…';
    for (let k = 0; k < imgs.length; k++) msg += `${msg ? '\n' : ''}![[${await addMedia(imgs[k].blob, imgs[k].ext, k + 1)}]]`;
    let fp = tp, L = notes[path].text.split('\n');
    if (!fp) {
      const nid = Math.random().toString(36).slice(2, 8);
      L[i] = L[i].replace(/\s*$/, '') + ' 🆔 ' + nid; saveNote(path, L.join('\n'));
      fp = createNote(uniquePath(R() + 'Fils', text.slice(0, 70)), build({ fil: nid, parent: `[[${parent.title}]]`, tache: text, domaine: parent.dom || undefined, cree: today() }, ''));
    }
    const cur = notes[fp].text.replace(/\s*$/, '\n');
    saveNote(fp, msg ? `${cur}\n### ${stampNow()} · moi\n${msg}\n` : cur);
    if (ask) setFm(fp, { assistant: 'à traiter', consigne: msg ? undefined : 'Réponds dans le fil', demande: today(), traite: undefined });
    if (ai) {
      const cut = t => t.length > 15000 ? t.slice(0, 15000) + '\n[… coupé]' : t;
      const conv = { model: aiModel(), sys: aiSystem(), msgs: [{ role: 'user', content: `Fil de discussion sur la tâche « ${text} » de la note « ${parent.title} ».\n\nNote « ${parent.title} » :\n${cut(notes[path].text)}\n\nFil :\n${cut(parse(notes[fp].text).body)}\n\nRéponds au dernier message du fil, en restant sur cette tâche.` }], cost: 0 };
      try { const r = await aiRun(conv); saveNote(fp, `${notes[fp].text.replace(/\s*$/, '\n')}\n### ${stampNow()} · assistant\n${r || '(pas de réponse)'}\n`); toast(`◆ Réponse de l’IA · ${cents(conv.cost)}`); }
      catch (e) { toast('✗ ' + e.message); }
    } else { vibrate(); toast(ask ? 'Envoyé à l’assistant ◆' : 'Ajouté au fil'); }
    render();
    const L2 = notes[path].text.split('\n'), j = L2.findIndex(l => l.includes(text) && TASK.test(l));
    openThread(path, j < 0 ? i : j, L2[j < 0 ? i : j]);
    requestAnimationFrame(() => { const pb = $('.ov .pb'); if (pb) pb.scrollTop = pb.scrollHeight; });
  };
  $('#thOk', pan).onclick = () => send(false);
  if ($('#thAI', pan)) $('#thAI', pan).onclick = () => send(true);
}

/* ---------- Questionnaires : l'assistant les écrit dans un fil ou une note, tu réponds depuis l'appli ----------
   ?? Question [un: A ; B ; C]   (un choix)      ?? Question [plusieurs: A ; B]   (plusieurs choix)
   ?? Question [oui/non]   ?? Question [nombre]   ?? Question [date]   ?? Question   (texte libre)
   => réponse   (ligne juste en dessous ; vide tant que pas de réponse) */
const QQ = /^\?\?\s+(.+?)\s*(?:\[(un|plusieurs|oui\/non|nombre|date)(?::\s*([^\]]*))?\])?\s*$/i;
const ANS = /^=>\s?(.*)$/;
function qzHTML(m, ans, line) {
  const type = (m[2] || 'texte').toLowerCase(), opts = (m[3] || '').split(';').map(x => x.trim()).filter(Boolean), a = (ans || '').trim();
  let f;
  if (type === 'un' || type === 'oui/non') f = `<div class="chips">${(type === 'oui/non' ? ['Oui', 'Non'] : opts).map(v => `<button type="button" class="chip ${a === v ? 'on' : ''}" data-qv="${esc(v)}">${esc(v)}</button>`).join('')}</div>`;
  else if (type === 'plusieurs') { const sel = a.split(/\s*,\s*/); f = `<div class="chips">${opts.map(v => `<button type="button" class="chip ${sel.includes(v) ? 'on' : ''}" data-qm="${esc(v)}">${esc(v)}</button>`).join('')}</div>`; }
  else if (type === 'nombre') f = `<input class="qin" type="number" inputmode="decimal" value="${esc(a)}">`;
  else if (type === 'date') f = `<input class="qin" type="date" value="${esc(a)}">`;
  else f = `<textarea class="qin" rows="2" placeholder="Ta réponse…">${esc(a.replace(/ ⏎ /g, '\n'))}</textarea>`;
  return `<div class="qz ${a ? 'ok' : ''}" data-ql="${line}"><div class="qq"><span class="qn">${a ? '✓' : '?'}</span>${inline(m[1])}</div>${f}</div>`;
}
const qzEnd = () => `<div class="qzend"><button type="button" class="btn sm line askbtn" data-qsend>◆ Réponses prêtes : confier à l’assistant</button></div>`;
function bindQz(root, path, redraw) {
  if (!root) return;
  const setAns = (line, v) => {
    const L = notes[path].text.split('\n'); if (!QQ.test(L[line] || '')) return;
    v = String(v).replace(/\r?\n/g, ' ⏎ ').trim();
    if (ANS.test(L[line + 1] || '')) { if (L[line + 1] === `=> ${v}`) return; L[line + 1] = `=> ${v}`; saveNote(path, L.join('\n')); }
    else { L.splice(line + 1, 0, `=> ${v}`); saveNote(path, L.join('\n')); redraw(); }
  };
  root.addEventListener('click', e => {
    const q = e.target.closest('[data-ql]'), line = q && +q.dataset.ql;
    const one = e.target.closest('[data-qv]'); if (one) { const on = !one.classList.contains('on'); setAns(line, on ? one.dataset.qv : ''); $$('[data-qv]', q).forEach(b => b.classList.toggle('on', b === one && on)); q.classList.toggle('ok', on); vibrate(); return; }
    const mul = e.target.closest('[data-qm]'); if (mul) { mul.classList.toggle('on'); const v = $$('[data-qm].on', q).map(b => b.dataset.qm).join(', '); setAns(line, v); q.classList.toggle('ok', !!v); return; }
    if (e.target.closest('[data-qsend]')) { setFm(path, { assistant: 'à traiter', consigne: 'Questionnaire rempli : analyse mes réponses et continue', demande: today(), traite: undefined }); toast('Réponses confiées à l’assistant ◆'); vibrate(); render(); redraw(); }
  });
  root.addEventListener('change', e => { const inp = e.target.closest('.qin'); if (!inp) return; const q = inp.closest('[data-ql]'); setAns(+q.dataset.ql, inp.value); q.classList.toggle('ok', !!inp.value.trim()); });
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
  on('#r2', () => closeLayer(() => go('taches')));
  on('#r3', () => openNote(stuck[0].path));
  on('#r4', () => { if (!confirm(`Archiver ${plural(fin.length, 'projet')} ?`)) return; fin.forEach(p => { setFm(p.path, { statut: 'terminé', fini: p.fm.fini || today() }); moveNote(p.path, uniquePath(dirOf('archive'), p.title)); }); toast('Archivés'); render(); review(); });
  on('#r5', () => capture());
  on('#rOk', () => { UI.review = today(); saveUI(); vibrate(); toast('Revue faite. À la semaine prochaine !'); closeLayer(() => render()); });
}

/* ---------- Aller à (ouverture rapide) ----------
   Quelques lettres d'un titre : Entrée ouvre la première note ; si aucun titre ne correspond, Entrée la crée. */
const GOTO = [
  ['Journal du jour', 'journal', () => journal()],
  ['Capturer', 'inbox', () => capture()],
  ['Vue réseau', 'net', () => closeLayer(() => openNet())],
  ['Nouveau projet', 'proj', () => newProject()],
  ['Revue de la semaine', 'review', () => review()],
];
function search() {
  const pan = layer('Aller à', `<label class="search">${ico('search')}<input id="sQ" placeholder="Titre d’une note, ou commande…" autocomplete="off" enterkeyhint="go"></label><div id="sR"></div>`);
  const q = $('#sQ', pan), out = $('#sR', pan);
  let acts = [];
  const row = (i, icon, t, s) => `<button class="row" data-qa="${i}"><span class="gl">${ico(icon, 16)}</span><span class="m"><span class="t">${esc(t)}</span><span class="s">${s}</span></span></button>`;
  const draw = () => {
    const v = q.value.trim().replace(/\s+/g, ' '), k = norm(v), L = k ? hits(v) : [];
    const named = L.filter(x => norm(x.title).includes(k)), inText = L.filter(x => !named.includes(x));
    const cmds = GOTO.filter(c => norm(c[0]).includes(k));
    acts = cmds.map(c => c[2]);
    let h = named.map(noteRow).join('') + cmds.map((c, i) => row(i, c[1], c[0], 'Commande')).join('');
    if (k && !named.some(x => norm(x.title) === k)) { acts.push(() => editNote(null, { title: v })); h += row(acts.length - 1, 'plus', `Créer « ${v} »`, 'Nouvelle note'); }
    // Entrée : 1re note au titre proche, sinon commande, sinon création
    out.innerHTML = `<div class="list">${h}</div>` + (inText.length ? hudm('Dans le texte', `<b>${z3(inText.length)}</b>`) + `<div class="list">${inText.map(noteRow).join('')}</div>` : '');
  };
  out.onclick = e => { const b = e.target.closest('[data-qa]'); if (b) { e.preventDefault(); e.stopPropagation(); acts[+b.dataset.qa]?.(); } };
  q.oninput = draw; draw(); setTimeout(() => q.focus(), 120);
  q.onkeydown = e => { if (e.key === 'Enter' && q.value.trim()) { e.preventDefault(); $('.list button', out)?.click(); } };
}

/* ---------- Discuter avec l'IA (API Claude, appelée depuis cet appareil avec ta clé) ----------
   L'IA voit les titres des notes et les tâches ouvertes ; elle ouvre une note quand elle en a besoin
   et peut seulement ranger une nouvelle note dans la Boîte. La conversation reste sur cet appareil. */
// Prix en $ par million de jetons : entrée, sortie, lecture du cache (écriture du cache = 1,25 × entrée)
const AI_MODELS = {
  'claude-haiku-5-5': { n: 'Haiku 5.5 · très économe', i: 0.1, o: 0.5, r: 0.01 },
  'claude-sonnet-5-5': { n: 'Sonnet 5.5 · équilibré', i: 2, o: 10, r: 0.1 },
  'claude-opus-5-5': { n: 'Opus 5.5 · le plus capable', i: 4, o: 20, r: 0.2 },
};
const aiModel = () => AI_MODELS[cfg.aiModel] ? cfg.aiModel : 'claude-haiku-5-5';
const aiCost = (u, m) => { const p = AI_MODELS[m]; return ((u.input_tokens || 0) * p.i + (u.cache_creation_input_tokens || 0) * p.i * 1.25 + (u.cache_read_input_tokens || 0) * p.r + (u.output_tokens || 0) * p.o) / 1e6; };
const cents = d => (d * 100).toLocaleString('fr-FR', { maximumFractionDigits: d * 100 < 0.1 ? 3 : 2 }) + ' ¢';
const AI_TOOLS = [
  { name: 'lire_note', description: 'Lit le texte complet d’une note du Cerveau, à partir de son titre exact (tel qu’il apparaît dans la liste).', input_schema: { type: 'object', properties: { titre: { type: 'string' } }, required: ['titre'], additionalProperties: false } },
  { name: 'chercher', description: 'Cherche un mot ou une expression dans les titres et le texte de toutes les notes. Renvoie les titres trouvés avec un extrait.', input_schema: { type: 'object', properties: { texte: { type: 'string' } }, required: ['texte'], additionalProperties: false } },
  { name: 'ranger_dans_la_boite', description: 'Crée une nouvelle note dans la Boîte de réception d’Adrien (il la triera ensuite). Seulement quand il le demande ou l’accepte. Pour des tâches, écrire une ligne par tâche au format « - [ ] texte 📅 AAAA-MM-JJ » (date facultative).', input_schema: { type: 'object', properties: { titre: { type: 'string' }, texte: { type: 'string', description: 'Contenu Markdown de la note' } }, required: ['titre', 'texte'], additionalProperties: false } },
];
function aiSystem() {
  const I = buildIndex(), K = k => KIND(k)?.short || k;
  const list = I.idx.filter(x => x.kind !== 'fil').sort((a, b) => a.kind.localeCompare(b.kind) || byTitle(a, b)).map(x => `- ${x.title} (${K(x.kind)}${x.sub ? ' / ' + x.sub : ''}${x.dom ? ', ' + x.dom : ''})`).join('\n');
  const open = I.tasks.filter(t => !t.done).sort((a, b) => (a.due || '9').localeCompare(b.due || '9')).slice(0, 80).map(t => `- ${plain(t.text)}${t.due ? ' 📅 ' + t.due : ''} [${t.note.title}]`).join('\n');
  return `Tu es l’assistant du second cerveau d’Adrien (méthode PARA : Boîte, Projets, Domaines, Ressources, Archives, Journal). Réponds en français, simplement et brièvement, comme dans une discussion. Tutoie Adrien.
Tu peux lire ses notes (lire_note, chercher) avant de répondre quand c’est utile. Tu ne peux pas modifier ni supprimer ses notes : pour garder une idée ou des tâches, propose de les ranger dans sa Boîte (ranger_dans_la_boite) et ne le fais que s’il est d’accord ou le demande.
Nous sommes le ${frDate(today(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.

Ses notes (titre, dossier, domaine) :
${list || '(aucune)'}

Ses tâches ouvertes (avec la note où elles sont) :
${open || '(aucune)'}`;
}
function aiTool(name, a) {
  if (name === 'lire_note') {
    const p = findByTitle(String(a.titre || '').replace(/^\[\[|\]\]$/g, ''));
    if (!p) return { t: `Aucune note ne s’appelle « ${a.titre} ».`, err: true };
    const tx = notes[p].text, MAX = 15000; // shortcut: une note plus longue est coupée pour limiter le coût
    return { t: tx.length > MAX ? tx.slice(0, MAX) + `\n[… note coupée : ${tx.length - MAX} caractères de plus]` : tx, see: `a lu « ${titleOf(p)} »` };
  }
  if (name === 'chercher') {
    const L = hits(String(a.texte || '')).slice(0, 15);
    return { t: L.length ? L.map(x => `- ${x.title} : ${excerpt(x)}`).join('\n') : 'Rien trouvé.', see: `a cherché « ${a.texte} »` };
  }
  if (name === 'ranger_dans_la_boite') {
    const p = createNote(uniquePath(dirOf('boite'), a.titre || firstLine(a.texte) || 'Note de l’IA'), build({ cree: today(), source: 'IA' }, String(a.texte || '').trim() + '\n'));
    render(); return { t: `Note « ${titleOf(p)} » rangée dans la Boîte.`, see: `a rangé « ${titleOf(p)} » dans la Boîte`, path: p };
  }
  return { t: 'Outil inconnu.', err: true };
}
async function aiCall(conv) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': cfg.aiKey, 'anthropic-version': '2026-10-21', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: conv.model, max_tokens: 8000, output_config: { effort: 'low' }, cache_control: { type: 'ephemeral' }, system: conv.sys, tools: AI_TOOLS, messages: conv.msgs }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(r.status === 401 ? 'clé API refusée : vérifie-la dans les réglages' : r.status === 429 || r.status === 529 ? 'Claude est surchargé, réessaie dans un instant' : r.status === 400 && /credit/i.test(j.error?.message || '') ? 'crédit épuisé sur ton compte Anthropic' : (j.error?.message || 'erreur ' + r.status));
  return j;
}
// Boucle avec les outils ; renvoie le texte final. log(e) reçoit chaque étape à afficher.
async function aiRun(conv, log = () => { }) {
  const out = [];
  for (let round = 0; round < 8; round++) {
    const j = await aiCall(conv);
    conv.cost += aiCost(j.usage || {}, conv.model);
    conv.msgs.push({ role: 'assistant', content: j.content }); // renvoyé tel quel (réflexion comprise) au tour suivant
    const txt = j.content.filter(b => b.type === 'text').map(b => b.text).join('\n\n').trim();
    if (j.stop_reason === 'refusal') { const t = txt || 'Je ne peux pas répondre à cette demande.'; out.push(t); log({ who: 'ai', t }); return out.join('\n\n'); }
    const uses = j.content.filter(b => b.type === 'tool_use');
    if (txt) { const t = txt + (j.stop_reason === 'max_tokens' ? '\n\n*(réponse coupée)*' : ''); out.push(t); log({ who: 'ai', t }); }
    if (!uses.length) return out.join('\n\n');
    conv.msgs.push({ role: 'user', content: uses.map(u => { const r = aiTool(u.name, u.input || {}); if (r.see) log({ who: 'tool', t: r.see, path: r.path }); return { type: 'tool_result', tool_use_id: u.id, content: r.t, ...(r.err ? { is_error: true } : {}) }; }) });
  }
  conv.msgs.push({ role: 'assistant', content: [{ type: 'text', text: '(arrêt : trop d’étapes)' }] }); // garde l'historique valide
  return out.join('\n\n');
}
let chatBusy = false;
function chat(pre = '', about = '') {
  if (!cfg.aiKey) { toast('Saisis d’abord ta clé API Claude'); return settings('ai'); }
  let conv = read('chat', null);
  const fresh = () => ({ model: aiModel(), sys: aiSystem(), msgs: [], cost: 0, log: [], at: now() });
  if (!conv || conv.model !== aiModel() || now() - (conv.at || 0) > 6 * 36e5 || (about && conv.about !== about)) conv = fresh();
  if (about && !conv.msgs.length) { conv.about = about; conv.log = [{ who: 'tool', t: `discussion sur « ${titleOf(about)} »`, path: about }]; } // un autre modèle = nouvelle discussion (la réflexion d’un modèle n’est pas relue par un autre)
  const save = () => write('chat', conv);
  const bubble = (who, html) => `<div class="msg ${who === 'ai' ? 'ai' : 'me'}"><div class="mh">${who === 'ai' ? '◆ IA' : 'Moi'}</div><div class="doc">${html}</div></div>`;
  const draw = () => {
    const M = $('#chM', pan); if (!M) return;
    M.innerHTML = (conv.log.map(e => e.who === 'tool' ? `<p class="hint chtool">◆ ${esc(e.t)}${e.path ? ` · <a href="#" data-open="${esc(e.path)}">ouvrir</a>` : ''}</p>` : bubble(e.who, e.who === 'ai' ? md(e.t) : esc(e.t).replace(/\n/g, '<br>'))).join('') || '<p class="empty">Pose une question sur tes notes, tes projets, ta semaine…</p>')
      + (chatBusy ? '<p class="hint chtool">◆ réfléchit…</p>' : '');
    hydrate(M);
    $('#chC', pan).textContent = conv.log.length ? `${AI_MODELS[conv.model].n.split(' ·')[0]} · cette discussion : ${cents(conv.cost)}` : AI_MODELS[conv.model].n;
    const pb = $('.ov .pb'); if (pb) pb.scrollTop = pb.scrollHeight;
  };
  const pan = layer('Discuter avec l’IA', `
    <div class="msgs" id="chM"></div>
    <div class="composer"><textarea class="big" id="chT" rows="3" placeholder="Écris ta question…" style="min-height:80px;font-size:17px">${esc(pre)}</textarea>
      <div class="btns"><button class="btn line" id="chN">Nouvelle discussion</button><button class="btn" id="chOk">Envoyer</button></div>
      <p class="hint" id="chC" style="text-align:center;margin-top:8px"></p></div>`, { page: true });
  draw();
  const ta = $('#chT', pan); setTimeout(() => ta.focus(), 150);
  ta.onkeydown = e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('#chOk', pan).click(); };
  $('#chN', pan).onclick = () => { if (chatBusy) return; conv = fresh(); save(); draw(); ta.focus(); };
  $('#chOk', pan).onclick = async () => {
    const q = ta.value.trim(); if (!q || chatBusy) return;
    if (!navigator.onLine) return toast('Pas de réseau');
    ta.value = ''; chatBusy = true; $('#chOk', pan).disabled = true;
    const keep = conv.msgs.length, keepLog = conv.log.length; conv.at = now();
    const ctx = conv.about && !conv.msgs.length && notes[conv.about] ? `À propos de ma note « ${titleOf(conv.about)} » :\n\n${notes[conv.about].text.slice(0, 15000)}\n\n---\n` : '';
    conv.msgs.push({ role: 'user', content: ctx + q }); conv.log.push({ who: 'me', t: q }); draw();
    try {
      await aiRun(conv, e => { conv.log.push(e); save(); draw(); });
    } catch (e) {
      conv.msgs.length = keep; conv.log.length = keepLog; conv.log.push({ who: 'tool', t: '✗ ' + e.message }); ta.value = q;
    }
    chatBusy = false; save(); draw(); const b = $('#chOk', pan); if (b) b.disabled = false;
  };
}
// « ◆ Analyser » sur un rendez-vous de l'agenda : ouvre la discussion avec le rendez-vous (titre déchiffré sur cet appareil)
function analyseEvent(id) {
  const e = calEvents().find(x => x.id === id), t = calPlain[id]; if (!e || !t) return;
  chat(`Aide-moi à préparer ce rendez-vous : « ${t} », ${frDate(e.s.slice(0, 10), { weekday: 'long', day: 'numeric', month: 'long' })}${e.ad ? '' : ' à ' + e.s.slice(11, 16).replace(':', 'h')}.`);
}

/* ---------- Réglages ---------- */
/* ---------- Notifications : abonnement de cet appareil (Web Push), envoyées par l'automate GitHub ---------- */
async function enablePush(msg) {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('non prises en charge par ce navigateur');
    if (await Notification.requestPermission() !== 'granted') throw new Error('autorisation refusée');
    const reg = await navigator.serviceWorker.ready;
    let cur = { subs: [], sent: {} }, sha;
    try { const r = await gh('/contents/JSON_PUSH.json?ref=' + encodeURIComponent(cfg.branch)); sha = r.sha; cur = JSON.parse(b64d(r.content)); } catch (e) { if (e.status !== 404) throw e; }
    if (!cur.vapidPublic) throw new Error('crée d’abord la clé (étape 1)');
    const key = Uint8Array.from(atob(cur.vapidPublic.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    let sub = await reg.pushManager.getSubscription();
    if (sub && btoa(String.fromCharCode(...new Uint8Array(sub.options.applicationServerKey || []))) !== btoa(String.fromCharCode(...key))) { await sub.unsubscribe(); sub = null; }
    sub ||= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    const j = sub.toJSON(), dev = /Android/i.test(navigator.userAgent) ? 'Téléphone' : /Windows/i.test(navigator.userAgent) ? 'PC' : 'Appareil';
    cur.subs = (cur.subs || []).filter(x => x.endpoint !== j.endpoint).concat([{ endpoint: j.endpoint, keys: j.keys, device: dev, at: new Date().toISOString() }]);
    await gh('/contents/JSON_PUSH.json', { method: 'PUT', body: { message: 'Cerveau : notifications activées (' + dev + ')', content: btoa(unescape(encodeURIComponent(JSON.stringify(cur, null, 1)))), branch: cfg.branch, ...(sha ? { sha } : {}) } });
    UI.push = true; saveUI(); msg('✓ Notifications activées sur cet appareil'); schedule(300);
  } catch (e) { msg('✗ ' + e.message); }
}

// Étape 1 (une seule fois) : la paire de clés des notifications est créée ICI, sur ton appareil.
// La clé publique va dans JSON_PUSH.json ; la clé privée ne s'affiche qu'à toi, à coller dans le secret GitHub VAPID_PRIVATE.
async function makePushKeys(box) {
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey)), jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  const pub = btoa(String.fromCharCode(...raw)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  let cur = { subs: [], sent: {} }, sha;
  try { const r = await gh('/contents/JSON_PUSH.json?ref=' + encodeURIComponent(cfg.branch)); sha = r.sha; cur = JSON.parse(b64d(r.content)); } catch (e) { if (e.status !== 404) throw e; }
  if (cur.vapidPublic && !confirm('Une clé existe déjà. En créer une nouvelle oblige à réactiver chaque appareil. Continuer ?')) return;
  cur.vapidPublic = pub; cur.subs = [];
  await gh('/contents/JSON_PUSH.json', { method: 'PUT', body: { message: 'Cerveau : clé des notifications', content: btoa(unescape(encodeURIComponent(JSON.stringify(cur, null, 1)))), branch: cfg.branch, ...(sha ? { sha } : {}) } });
  box.innerHTML = `<div class="keybox"><span class="sub">Clé privée · à coller dans GitHub, nom <code>VAPID_PRIVATE</code></span><code id="vk">${esc(jwk.d)}</code><div class="btns"><button type="button" class="btn sm" id="vkc">Copier</button><a class="btn sm line" href="https://github.com/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/settings/secrets/actions/new" target="_blank" rel="noopener">Ouvrir les secrets GitHub</a></div><p class="hint">Elle n'est enregistrée nulle part ailleurs : si tu fermes sans la coller, recrée-la.</p></div>`;
  $('#vkc', box).onclick = () => navigator.clipboard?.writeText(jwk.d).then(() => toast('Clé copiée'));
}

/* ==========================================================
   Connexion simplifiée : identifiant + mot de passe
   GitHub n'accepte plus le mot de passe GitHub pour les applis : on chiffre donc le jeton
   (et la clé de l'agenda) avec TON identifiant + mot de passe, dans un lien de connexion.
   Le lien ne contient que du chiffré (après #, jamais envoyé à un serveur). Nouvel appareil :
   ouvrir le lien → identifiant + mot de passe → connecté à Cerveau seulement.
   ========================================================== */
const ITER = 600000;
const u64 = b => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const d64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
async function loginKey(id, pw, salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(id.trim().toLowerCase() + '|' + pw), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
const APP_REPO = 'AdrienFeuilloy/cerveau', ACCES = 'acces.json';
async function makeLoginBlob(id, pw, withCal) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const data = { o: cfg.owner, r: cfg.repo, b: cfg.branch, d: cfg.root, k: cfg.token, ...(withCal && cfg.calKey ? { c: cfg.calKey } : {}) };
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await loginKey(id, pw, salt), new TextEncoder().encode(JSON.stringify(data))));
  const all = new Uint8Array(28 + ct.length); all.set(salt); all.set(iv, 16); all.set(ct, 28);
  return u64(all);
}
async function fetchAcces() {
  try { const r = await fetch(`./${ACCES}?t=${Date.now()}`, { cache: 'no-store' }); if (!r.ok) return null; const j = await r.json(); return /^[\w-]{40,}$/.test(j.data || '') ? j.data : null; } catch { return null; }
}
/* Publie le chiffré dans le dépôt de l'appli (public) : le jeton doit avoir accès en écriture à ce dépôt. */
async function publishAcces(blob) {
  const url = `https://api.github.com/repos/${APP_REPO}/contents/${ACCES}`, H = { Authorization: 'Bearer ' + cfg.token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  let sha; const g = await fetch(url, { headers: H, cache: 'no-store' }); if (g.ok) sha = (await g.json()).sha;
  const body = { message: 'Accès chiffré', content: btoa(JSON.stringify({ v: 1, data: blob }) + '\n'), ...(sha ? { sha } : {}) };
  const r = await fetch(url, { method: 'PUT', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) { const e = new Error('GitHub ' + r.status); e.status = r.status; throw e; }
}
async function makeLoginLink(id, pw, withCal) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const data = { o: cfg.owner, r: cfg.repo, b: cfg.branch, d: cfg.root, k: cfg.token, ...(withCal && cfg.calKey ? { c: cfg.calKey } : {}) };
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await loginKey(id, pw, salt), new TextEncoder().encode(JSON.stringify(data))));
  const all = new Uint8Array(28 + ct.length); all.set(salt); all.set(iv, 16); all.set(ct, 28);
  return `${location.origin}${location.pathname}#connexion=${u64(all)}`;
}
async function openLogin(blob) {
  const pan = layer('Connexion', `${hudm('Accès ▸ dépôt privé', '<span class="blink">● Verrouillé</span>')}
    <p class="lead" style="margin-top:8px">Ton identifiant et ton mot de passe <em>Cerveau</em> pour ouvrir tes notes sur cet appareil.</p>
    <div class="fld"><label for="lgI">Identifiant</label><input id="lgI" autocomplete="username" autocapitalize="off"></div>
    <div class="fld"><label for="lgP">Mot de passe</label><input id="lgP" type="password" autocomplete="current-password"></div>
    <div class="btns"><button class="btn" id="lgOk">Se connecter</button></div><p class="hint" id="lgM"></p>`);
  setTimeout(() => $('#lgI', pan).focus(), 150);
  $('#lgP', pan).onkeydown = e => { if (e.key === 'Enter') $('#lgOk', pan).click(); };
  $('#lgOk', pan).onclick = async () => {
    const m = $('#lgM', pan), btn = $('#lgOk', pan); btn.disabled = true; m.textContent = 'Déchiffrement…';
    try {
      const all = d64(blob), key = await loginKey($('#lgI', pan).value, $('#lgP', pan).value, all.slice(0, 16));
      const d = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(16, 28) }, key, all.slice(28))));
      const changed = d.o !== cfg.owner || d.r !== cfg.repo || (d.d || '') !== cfg.root;
      Object.assign(cfg, { owner: d.o, repo: d.r, branch: d.b || 'main', root: d.d || '', token: d.k, ...(d.c ? { calKey: d.c } : {}) }); saveCfg();
      if (changed) { notes = {}; Object.assign(meta, { head: null, tree: null, treeSha: null, last: 0, deleted: {}, seeded: false }); persist(); }
      if (location.hash) history.replaceState(null, '', location.pathname); vibrate(); toast('Connecté ✓');
      closeLayer(() => { render(); sync(); });
    } catch { m.textContent = '✗ Identifiant ou mot de passe incorrect'; btn.disabled = false; }
  };
}
function loginSetupSheet() {
  if (!cfg.token) return toast('Relie d’abord ton dépôt dans les réglages');
  const pan = layer('Activer le login', `<p class="hint" style="margin-top:0">Choisis un identifiant et un mot de passe <b>propres à Cerveau</b> (pas ceux de GitHub). Sur un nouvel appareil, il suffira d’ouvrir Cerveau et de les saisir.</p>
    <div class="fld"><label for="laI">Identifiant</label><input id="laI" autocomplete="username" autocapitalize="off" placeholder="ex. adrien"></div>
    <div class="fld"><label for="laP">Mot de passe (12 caractères ou plus)</label><input id="laP" type="password" autocomplete="new-password"></div>
    <div class="fld"><label for="laP2">Confirmer le mot de passe</label><input id="laP2" type="password" autocomplete="new-password"></div>
    <label class="askchk" style="color:var(--ink2)"><input type="checkbox" id="laC" ${cfg.calKey ? 'checked' : 'disabled'}> Inclure la clé de l’agenda</label>
    <p class="hint">Seule une version chiffrée de ton accès est publiée avec l’appli. Un mot de passe long (une petite phrase, par exemple) la rend impossible à casser.</p>
    <div class="btns"><button class="btn" id="laOk">Activer</button></div><p class="hint" id="laM"></p>`);
  $('#laOk', pan).onclick = async () => {
    const id = $('#laI', pan).value.trim(), pw = $('#laP', pan).value, m = $('#laM', pan), btn = $('#laOk', pan);
    if (!id) return toast('Choisis un identifiant');
    if (pw.length < 12) return toast('Mot de passe trop court (12 caractères minimum)');
    if (pw !== $('#laP2', pan).value) return toast('Les deux mots de passe ne correspondent pas');
    btn.disabled = true; m.textContent = 'Chiffrement…';
    try {
      await publishAcces(await makeLoginBlob(id, pw, $('#laC', pan).checked));
      vibrate(); toast('Login activé ✓');
      m.innerHTML = '✓ Activé. Sur un nouvel appareil, ouvre <b>adrienfeuilloy.github.io/cerveau</b> et connecte-toi (disponible d’ici une minute).';
    } catch (e) {
      btn.disabled = false;
      m.innerHTML = e.status === 403 || e.status === 404
        ? `✗ Ton jeton n’a pas accès au dépôt <b>cerveau</b>. Ajoute-le à ton jeton (<a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noopener">jetons GitHub</a> → ton jeton → Repository access : ajouter <b>cerveau</b>, Contents : lecture et écriture), puis réessaie.`
        : '✗ Échec de la publication (' + esc(e.message) + '). Réessaie.';
    }
  };
}
async function startLogin() {
  const blob = await fetchAcces();
  if (blob) openLogin(blob); else settings();
}
function loginLinkSheet() {
  if (!cfg.token) return toast('Relie d’abord ton dépôt dans les réglages');
  const pan = layer('Lien de connexion', `<p class="hint" style="margin-top:0">Choisis un identifiant et un mot de passe <b>propres à Cerveau</b> (pas ceux de GitHub). Ils chiffrent ton accès dans un lien : sur un nouvel appareil, ouvre le lien puis saisis-les.</p>
    <div class="fld"><label for="llI">Identifiant</label><input id="llI" autocomplete="username" autocapitalize="off" placeholder="ex. adrien"></div>
    <div class="fld"><label for="llP">Mot de passe (12 caractères ou plus)</label><input id="llP" type="password" autocomplete="new-password"></div>
    <div class="fld"><label for="llP2">Confirmer le mot de passe</label><input id="llP2" type="password" autocomplete="new-password"></div>
    <label class="askchk" style="color:var(--ink2)"><input type="checkbox" id="llC" ${cfg.calKey ? 'checked' : 'disabled'}> Inclure la clé de l’agenda</label>
    <div class="btns"><button class="btn" id="llOk">Créer le lien</button></div><div id="llOut"></div>`);
  $('#llOk', pan).onclick = async () => {
    const id = $('#llI', pan).value.trim(), pw = $('#llP', pan).value, out = $('#llOut', pan);
    if (!id) return toast('Choisis un identifiant');
    if (pw.length < 12) return toast('Mot de passe trop court (12 caractères minimum)');
    if (pw !== $('#llP2', pan).value) return toast('Les deux mots de passe ne correspondent pas');
    $('#llOk', pan).disabled = true; out.innerHTML = '<div class="spin"></div>';
    const link = await makeLoginLink(id, pw, $('#llC', pan).checked);
    out.innerHTML = `<div class="keybox" style="margin-top:12px"><span class="sub">Ton lien de connexion</span><code>${esc(link.slice(0, 70))}…</code>
      <div class="btns"><button type="button" class="btn sm" id="llCp">Copier</button>${navigator.share ? '<button type="button" class="btn sm line" id="llSh">Partager</button>' : ''}</div>
      <p class="hint">Garde-le dans un endroit sûr (gestionnaire de mots de passe, ou envoie-le toi-même par message). Sans ton identifiant et ton mot de passe, il est illisible.</p></div>`;
    $('#llCp', pan).onclick = () => navigator.clipboard?.writeText(link).then(() => toast('Lien copié'));
    if ($('#llSh', pan)) $('#llSh', pan).onclick = () => navigator.share({ title: 'Connexion Cerveau', url: link }).catch(() => { });
    $('#llOk', pan).disabled = false;
  };
}

function settings(focus) {
  const f = (id, l, v, at = '') => `<div class="fld"><label for="${id}">${l}</label><input id="${id}" value="${esc(v)}" ${at}></div>`;
  const pan = layer('Réglages', `
    <span class="sub">Apparence</span>
    <div class="chips" id="sTh">${[['auto', 'Comme le téléphone'], ['light', 'Clair'], ['dark', 'Sombre']].map(([k, l]) => `<button type="button" class="chip ${cfg.theme === k ? 'on' : ''}" data-v="${k}">${l}</button>`).join('')}</div>
    <span class="sub" style="margin-top:16px">Dépôt GitHub privé des notes</span>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${f('sO', 'Propriétaire', cfg.owner, 'autocapitalize="off"')}${f('sR', 'Dépôt', cfg.repo, 'autocapitalize="off"')}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${f('sB', 'Branche', cfg.branch, 'autocapitalize="off"')}${f('sD', 'Dossier (facultatif)', cfg.root, 'autocapitalize="off" placeholder="racine"')}</div>
    ${f('sK', 'Jeton (Contents : lecture et écriture)', cfg.token, 'type="password" autocomplete="off"')}
    <span class="sub" style="margin-top:6px">Connexion sur un autre appareil</span>
    <p class="hint" style="margin-top:0">Plus besoin de recopier le jeton : un identifiant et un mot de passe suffisent.</p>
    <div class="btns" style="margin:-2px 0 14px"><button type="button" class="btn line" data-act="loginsetup">Activer le login</button><button type="button" class="btn sm line" data-act="loginlink">ou un lien</button></div>
    <span class="sub" style="margin-top:16px">Agenda Google</span>
    ${f('sC', 'Clé de l’agenda (reste sur cet appareil)', cfg.calKey || '', 'type="password" autocomplete="off" placeholder="la même que CAL_KEY dans GitHub"')}
    <button type="button" class="btn sm line" data-act="calguide" style="margin:-6px 0 12px">Comment relier mon agenda ?</button>
    <span class="sub" style="margin-top:6px">Discuter avec l’IA</span>
    ${f('sA', 'Clé API Claude (reste sur cet appareil)', cfg.aiKey || '', 'type="password" autocomplete="off" placeholder="sk-ant-…"')}
    <div class="fld"><label for="sAM">Modèle</label><select id="sAM">${Object.entries(AI_MODELS).map(([k, m]) => `<option value="${k}" ${aiModel() === k ? 'selected' : ''}>${m.n}</option>`).join('')}</select></div>
    <p class="hint" style="margin:-6px 0 14px">Clé à créer sur console.anthropic.com → API Keys. Fixe-y un plafond de dépense mensuel.</p>
    <span class="sub" style="margin-top:6px">Session de travail</span>
    ${f('sW', 'Lien ouvert par 🛠️ en bas de page (reste sur cet appareil)', cfg.work || '', 'type="url" autocapitalize="off" placeholder="https://…"')}
    <span class="sub" style="margin-top:6px">Notifications</span>
    <p class="hint" style="margin-top:0">Résumé du matin vers 7 h 45, même appli fermée. L’automate passe 4 fois par jour : un rappel ⏰ n’arrive que s’il tombe près d’un passage.</p>
    <div class="btns" style="margin:-2px 0 6px"><button type="button" class="btn line" id="sKeys">1 · Créer la clé (une fois)</button><button type="button" class="btn line" id="sPush">${UI.push ? '✓ 2 · Activées · réactiver' : '2 · Activer sur cet appareil'}</button></div><div id="sKeyBox" style="margin-bottom:14px"></div>
    <p class="hint" id="sMsg">Le jeton reste sur cet appareil. Tes notes sont de simples fichiers Markdown : tu peux aussi les ouvrir sur GitHub ou dans Obsidian.</p>
    <div class="btns"><button class="btn line" id="sTest">Tester</button><button class="btn" id="sOk">Enregistrer</button></div>
    <span class="sub" style="margin-top:22px">Avancé</span>
    <div class="btns" style="margin-top:4px"><button class="btn line" id="sReload">Tout recharger depuis GitHub</button><button class="btn bad" id="sOut">Se déconnecter de cet appareil</button></div>`);
  const getTh = chipGroup(pan, 'sTh');
  $('#sPush', pan).onclick = () => enablePush(t => { $('#sMsg', pan).textContent = t; toast(t); });
  $('#sKeys', pan).onclick = () => makePushKeys($('#sKeyBox', pan)).catch(e => toast('✗ ' + e.message));
  if (focus === 'work') setTimeout(() => { $('#sW', pan).scrollIntoView({ block: 'center' }); $('#sW', pan).focus(); }, 200);
  if (focus === 'ai') setTimeout(() => { $('#sA', pan).scrollIntoView({ block: 'center' }); $('#sA', pan).focus(); }, 200);
  if (focus === 'cal') setTimeout(() => { $('#sC', pan).scrollIntoView({ block: 'center' }); $('#sC', pan).focus(); }, 200);
  const val = id => $('#' + id, pan).value.trim();
  const collect = () => {
    const changedRepo = val('sO') !== cfg.owner || val('sR') !== cfg.repo || (val('sB') || 'main') !== cfg.branch || val('sD') !== cfg.root;
    if (val('sC') !== (cfg.calKey || '')) calPlain = {};
    Object.assign(cfg, { owner: val('sO'), repo: val('sR'), branch: val('sB') || 'main', root: val('sD').replace(/^\/+|\/+$/g, ''), token: val('sK'), calKey: val('sC'), aiKey: val('sA'), aiModel: $('#sAM', pan).value, work: val('sW'), theme: getTh() || 'auto' });
    saveCfg(); applyTheme();
    if (changedRepo) { notes = {}; Object.assign(meta, { head: null, tree: null, treeSha: null, last: 0, deleted: {}, seeded: false }); persist(); }
  };
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
    sessionStorage.clear(); location.replace(location.pathname);
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
  el.innerHTML = `<div class="sp-bg"></div><svg class="sp-logo" viewBox="0 0 200 200">
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
    splashing = false; boot = true; render(); // l'écran est prêt sous le démarrage : rien de lourd pendant l'animation
    const logo = $('.sp-logo', el);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const a = logo.getBoundingClientRect(), ring = $('#view .hud-ring'), r = ring?.getBoundingClientRect();
      const fly = r && r.width && r.top >= 0 && r.bottom <= innerHeight;
      if (fly) ring.style.opacity = '0';
      const D = 820, ease = 'cubic-bezier(.7,0,.2,1)';
      const tf = fly ? `translate(${(r.left + r.width / 2) - (a.left + a.width / 2)}px, ${(r.top + r.height / 2) - (a.top + a.height / 2)}px) scale(${(r.width * 1.18 / a.width).toFixed(3)}) rotate(180deg)` : 'scale(1.4)';
      logo.animate([{ transform: 'none', opacity: 1 }, { transform: tf, opacity: fly ? 1 : 0 }], { duration: D, easing: ease, fill: 'forwards' });
      $$('.sp-name, .sp-log, .sp-bar', el).forEach((n, i) => n.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-18px)' }], { duration: 300, delay: i * 50, easing: 'ease-in', fill: 'forwards' }));
      $('.sp-bg', el).animate([{ opacity: 1 }, { opacity: 0 }], { duration: 560, delay: 220, easing: 'ease-out', fill: 'forwards' });
      $('.sp-scan', el).animate([{ transform: `translateY(${innerHeight}px)`, opacity: 0 }, { opacity: 1, offset: .15 }, { transform: 'translateY(-10px)', opacity: 0 }], { duration: 700, delay: 140, easing: ease, fill: 'forwards' });
      $('.app').animate([{ transform: 'translateY(14px) scale(.985)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 640, delay: 230, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
      setTimeout(() => {
        if (fly) { ring.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' }).onfinish = () => { ring.style.opacity = ''; }; }
        el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).onfinish = () => { el.remove(); document.body.classList.remove('booting'); };
      }, D - 60);
    }));
  };
  at(2050, finish);
  el.addEventListener('pointerdown', finish);
}

shell();
const loginBlob = (/^#connexion=([\w-]+)$/.exec(location.hash) || [])[1];
const coldSplash = !loginBlob && !['share', 'capture', 'text', 'url', 'title'].some(k => new URLSearchParams(location.search).has(k)) && !matchMedia('(prefers-reduced-motion: reduce)').matches && !sessionStorage.getItem('sc.splash');
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
if (loginBlob) openLogin(loginBlob);
else if (!ghReady()) fetchAcces().then(async b => {
  while (document.querySelector('.splash')) await new Promise(r => setTimeout(r, 150));
  if (b && !ghReady() && (!ov || ov.hidden)) openLogin(b);
});
sync();
