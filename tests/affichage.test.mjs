// Test de la mise en forme des notes : node --test tests/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// On isole inline() de app.js, avec de petites doublures pour ce qu'elle appelle.
const src = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const code = src.slice(src.indexOf('function inline(s)'), src.indexOf('function md(src'));
const inline = new Function('esc', 'unesc', 'isImgName', 'findByTitle', 'today', 'frDate', 'dueLabel', `${code}; return inline;`)(
  s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'),
  n => /\.(jpe?g|png|gif|webp|heic|avif)$/i.test(n), () => null, () => '2026-11-28', d => d, d => d);

// Chaque balise produite doit être bien formée : attributs entre guillemets, sans < > ni " à l'intérieur.
const tagsOk = h => (h.match(/<[^>]*>/g) || []).every(t => /^<\/?[a-z]+(\s[\w-]+="[^"<>]*")*\s*>$/.test(t));

test('note piégée : une adresse dans la légende d’une image ne casse pas l’attribut', () => {
  const h = inline('![légende https://a.fr/x onerror=alert(1)//](https://b.fr/i.png) **fin**');
  assert.ok(tagsOk(h), h);
  assert.equal((h.match(/<a /g) || []).length, 1, h);
  assert.ok(!/<img/.test(h), 'image web non chargée d’office : ' + h);
  assert.match(h, /data-ximg="https:\/\/b\.fr\/i\.png"/);
  assert.match(h, /<b>fin<\/b>/);
});

test('les règles suivantes ne touchent plus les liens déjà fabriqués', () => {
  for (const s of ['[x](https://a.fr/==b==)', '[x](https://a.fr/**b**)', '![](%22onerror%3Dalert(1)%20x.png)', 'https://a.fr/`c` ⏰ 2026-11-28 10:00', '[[note|https://a.fr]]', '[`c` ==m==](https://a.fr)'])
    assert.ok(tagsOk(inline(s)), s + ' → ' + inline(s));
});
