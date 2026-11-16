// 새로 모은 raw 셋리(행사 ID 지정)를 VocaDB와 맞춰 tally.json 에 합친다.
// 실행: npm run merge -- J34 J35
// 판정 규칙은 tally.md 의 '판정 기준'과 같다 (2026-11-14 REPL 집계 로직을 옮김).
import fs from "node:fs/promises";
import path from "node:path";

const RES = path.resolve(import.meta.dirname, "..", "research");
const ids = process.argv.slice(2);
if (!ids.length) throw new Error("행사 ID를 주세요. 예: npm run merge -- J34 J35");

const SYNTH = new Set(["Vocaloid", "UTAU", "CeVIO", "SynthesizerV", "NEUTRINO", "VoiSona", "NewType", "Voiceroid", "VOICEVOX", "ACEVirtualSinger", "AIVOICE", "OtherVoiceSynthesizer"]);
const nz = (s) => (s || "").normalize("NFKC").toLowerCase().replace(/[\s\u3000・·.\-_~〜～!！?？'"“”‘’「」『』:：,，、/／\\★☆♪♡❤→]+/g, "");
const UNITS = ["leo/need", "leoneed", "moremorejump", "vividbadsquad", "ワンダーランズ×ショウタイム", "ワンダショ", "25時ナイトコードで", "ニーゴ", "virtualsinger", "バーチャルシンガー", "プロセカ", "projectsekai"].map(nz);
const VER = /(remix|edit|mix|ver\b|ver\.|version|bootleg|flip|vip|mashup|arrange|short|cut|cover|rmx|refix|re-edit|remaster|piano|band|live|acoustic|instrumental|off vocal|full)/i;
const stripVer = (t) =>
  t.replace(/\s*[\(\[（【\{][^\)\]）】\}]*(remix|edit|mix|ver\b|ver\.|version|bootleg|flip|vip|mashup|arrange|short|cut|cover|rmx|refix|re-edit|remaster|piano|band|live|acoustic|instrumental|off vocal|full)[^\)\]）】\}]*[\)\]）】\}]/gi, "")
    .replace(/\s+[-–—~〜]\s*[^-–—~〜]*(remix|edit|mix|ver|version|bootleg|flip|vip|arrange|rmx)[^-–—~〜]*[-–—~〜]?\s*$/i, "").trim();
const fixKana = (s) => s.replace(/\u309B/g, "\u3099").replace(/\u309C/g, "\u309A").replace(/\s(?=[\u3099\u309A])/g, "").normalize("NFC");
function titleCands(title) {
  let t = fixKana((title || "").normalize("NFKC")).replace(/\[판독불가[^\]]*\]?/g, "").trim();
  const out = new Set();
  const add = (x) => {
    const s = stripVer(x);
    out.add(s);
    const m = s.match(/^(.*?)\s*[\(（]([^\)）]+)[\)）]\s*$/);
    if (m) { out.add(m[1].trim()); out.add(m[2].trim()); }
    const m2 = s.match(/^(.*?)\s*[\[［]([^\]］]+)[\]］]\s*$/);
    if (m2) out.add(m2[1].trim());
  };
  add(t);
  const cut = t.replace(/\s*[\(（]?\s*\b(feat|ft)\b\.?.*$/i, "").replace(/\s*[\(（\[【][^\)）\]】]*$/, "").trim();
  add(cut);
  const dash = cut.split(/\s+[-–—]\s+/);
  if (dash.length >= 2) dash.forEach(add);
  return [...out].map((x) => x.replace(/^[\s\-–—~〜『「【\[]+|[\s\-–—~〜』」】\]]+$/g, "").trim()).filter((x) => x.length >= 1);
}
const splitArtist = (a) => (a || "").normalize("NFKC").replace(/\[판독불가[^\]]*\]?/g, "").split(/\s*(?:,|&|＆|×|\bx\b|\/|、|feat\.?|ft\.?|with|＋|\+)\s*/i).map(nz).filter((x) => x.length >= 2);
const isVocalist = (a) => /Vocalist/.test(a.cat);
const slim = (s) => ({ id: s.id, name: s.defaultName, type: s.songType, favs: s.favoritedTimes, orig: s.originalVersionId || null, pub: s.publishDate?.slice(0, 10) || null, names: (s.names || []).map((n) => n.value), artists: (s.artists || []).map((a) => ({ cat: a.categories, roles: a.effectiveRoles, name: a.name, type: a.artist?.artistType, an: a.artist ? [a.artist.name, ...(a.artist.additionalNames || "").split(",").map((x) => x.trim())] : [a.name] })) });

async function vsearch(q) {
  const u = `https://vocadb.net/api/songs?query=${encodeURIComponent(q)}&maxResults=10&sort=FavoritedTimes&nameMatchMode=Auto&fields=Artists,Names&lang=Default`;
  for (let i = 0; i < 3; i++) {
    const r = await fetch(u);
    if (r.ok) return (await r.json()).items.map(slim);
    await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
  }
  return [];
}
const origCache = new Map();
async function original(s) {
  if (!s.orig) return s;
  if (!origCache.has(s.orig)) {
    const r = await fetch(`https://vocadb.net/api/songs/${s.orig}?fields=Artists,Names&lang=Default`);
    origCache.set(s.orig, r.ok ? slim(await r.json()) : s);
  }
  return origCache.get(s.orig);
}
function hitOf(song, artist) {
  const sa = splitArtist(artist);
  if (!sa.length) return "E";
  if (sa.some((x) => UNITS.some((u) => x.includes(u) || u.includes(x)))) return "U";
  const ns = song.artists.flatMap((a) => a.an).map(nz).filter((x) => x.length >= 2);
  return sa.some((x) => ns.some((n) => x === n || (n.length >= 3 && x.includes(n)) || (x.length >= 3 && n.includes(x)))) ? "A" : "X";
}
const typeRank = (t) => ({ Original: 0, Remaster: 1, Remix: 2, Cover: 3 })[t] ?? 4;

async function matchTrack(title, artist) {
  const cands = titleCands(title);
  const pool = new Map();
  for (const c of cands) for (const it of await vsearch(c)) if (it.names.some((n) => nz(n) === nz(c))) pool.set(it.id, it);
  if (!pool.size) return null;
  const scored = [...pool.values()].map((it) => ({ it, hit: hitOf(it, artist) }))
    .sort((a, b) => (a.hit === "A" ? 0 : 1) - (b.hit === "A" ? 0 : 1) || typeRank(a.it.type) - typeRank(b.it.type) || b.it.favs - a.it.favs);
  return scored[0];
}

const tally = JSON.parse(await fs.readFile(path.join(RES, "tally.json"), "utf8"));
const byId = new Map(tally.map((t) => [t.vocadbId, t]));
const review = [];
let added = 0, newSongs = 0;

for (const id of ids) {
  const e = JSON.parse(await fs.readFile(path.join(RES, "raw", `${id}.json`), "utf8"));
  for (const t of tally) t.used = t.used.filter((u) => u.eventId !== id); // 다시 돌려도 중복되지 않게
  for (const s of e.sessions) for (const tr of s.tracks) {
    const parts = /\s\+\s/.test(tr.title) ? tr.title.split(/\s\+\s/) : [tr.title];
    for (const part of parts) {
      const p = await matchTrack(part.trim(), tr.artist);
      if (!p) continue;
      const song = await original(p.it);
      if (!song.artists.some((a) => isVocalist(a) && SYNTH.has(a.type))) continue;
      const hit = [p.hit, hitOf(song, tr.artist)].includes("A") ? "A" : [p.hit, hitOf(song, tr.artist)].includes("U") ? "U" : p.hit;
      // 보카쿠라(보카로 전문 행사) 기준: 아티스트 빈칸은 인정, 다르면 즐겨찾기 20 이상만
      const ok = hit === "A" || hit === "U" || hit === "E" || (hit === "X" && song.favs >= 20) || (/판독불가/.test(tr.artist) && song.favs >= 50);
      if (!ok) { review.push({ eventId: id, asListed: tr.raw, guess: song.name }); continue; }
      const prods = song.artists.filter((a) => !isVocalist(a)).flatMap((a) => a.an).map(nz).filter((x) => x.length >= 2);
      const self = s.kind === "DJ" && prods.some((n) => nz(s.label).includes(n));
      let t = byId.get(song.id);
      if (!t) {
        t = { vocadbId: song.id, title: song.name, pub: song.pub, producers: [...new Set(song.artists.filter((a) => /Producer|Composer/.test(a.cat) || /Composer/.test(a.roles || "")).map((a) => a.name))], vocal: [...new Set(song.artists.filter((a) => isVocalist(a) && SYNTH.has(a.type)).map((a) => a.name))], used: [] };
        tally.push(t); byId.set(song.id, t); newSongs++;
      }
      t.used.push({ eventId: id, event: e.event, session: s.label, date: s.date, country: e.country, kind: s.kind, source: s.source, sourceType: s.sourceType, asListed: tr.raw, self });
      added++;
    }
  }
}

// 곡별 숫자 다시 계산
for (const t of tally) {
  const u = (f) => new Set(t.used.filter(f).map((x) => x.eventId)).size;
  Object.assign(t, { events: u(() => true), eventsNonSelf: u((x) => !x.self), kr: u((x) => x.country === "KR"), jp: u((x) => x.country === "JP"), plays: t.used.length, kinds: [...new Set(t.used.map((x) => x.kind))] });
}
tally.sort((a, b) => b.eventsNonSelf - a.eventsNonSelf || b.plays - a.plays);
await fs.writeFile(path.join(RES, "tally.json"), JSON.stringify(tally, null, 2));
console.log(`행사 ${ids.join(", ")}: 보카로로 인정한 줄 ${added}개, 새 곡 ${newSongs}개, 보류 ${review.length}줄`);
for (const r of review) console.log("  보류:", r.eventId, r.asListed, "→", r.guess);
console.log("새 곡(한국어 제목 없음):", tally.filter((t) => !t.titleKo).map((t) => `${t.vocadbId} ${t.title}`).join(" | ") || "없음");
