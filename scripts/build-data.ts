// research/ 의 조사 결과로 public/songs.json, public/events.json 을 만든다.
// 실행: npm run data  (node scripts/build-data.ts, Node 22.18+ 의 타입 제거 실행)
// - 페이지에 올리는 곡: 서로 다른 행사 3곳 이상 + 2곳에서 쓰인 최근 1년 신곡
// - songs.json 에 직접 적은 tags, why 는 id 기준으로 보존한다.
// - VocaDB 영상 정보(YouTube/니코동 ID)는 research/.pv-cache.json 에 캐시한다.

import fs from "node:fs/promises";
import path from "node:path";
import type { EventInfo, Song } from "../src/types.ts";

// research/ 입력 파일 모양 (쓰는 필드만)
interface RawEvent {
  eventId: string;
  event: string;
  country: EventInfo["country"];
  sessions: { date: string }[];
}
interface TallyUse {
  eventId: string;
  session: string;
  date: string;
  kind: string;
  source: string;
  self: boolean;
}
interface Tally {
  vocadbId: number;
  title: string;
  titleKo?: string;
  titleKoSource?: string;
  titleKoCheck?: string;
  producers: string[];
  vocal: string[];
  pub: string | null;
  eventsNonSelf: number;
  kr: number;
  jp: number;
  used: TallyUse[];
}
interface VocaDbPv {
  service: string;
  pvType: string;
  pvId: string;
  disabled?: boolean;
}
type PvCache = Record<number, { yt: string | null; nico: string | null }>;

const ROOT = path.resolve(import.meta.dirname, "..");
const R = (...p: string[]) => path.join(ROOT, ...p);

const MIN_EVENTS = 3;
const NEW_MIN_EVENTS = 2;
const today = new Date();
const pad = (n: number) => String(n).padStart(2, "0");
const NEW_SINCE = `${today.getFullYear() - 1}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

// raw 파일에 날짜가 '미확인'인 행사는 events.md 의 행사 기간을 쓴다.
const EVENT_RANGE_FIX: Record<string, string[]> = {
  K2: ["2026-10-10", "2026-10-11"],
  K3: ["2026-08-29", "2026-08-30"],
  K4: ["2026-08-01", "2026-08-02"],
  K5: ["2026-05-23", "2026-05-24"],
  K11: ["2026-05-16", "2026-05-17"],
  J24: ["2026-11-14", "2026-11-14"],
  K26: ["2026-11-14", "2026-11-15"],
};

const readJson = async <T>(p: string, fallback: T): Promise<T> => {
  try {
    return JSON.parse(await fs.readFile(p, "utf8"));
  } catch {
    return fallback;
  }
};
const isDate = (d: string | null | undefined) => /^\d{4}-\d{2}-\d{2}$/.test(d || "");

// ---------- events.json ----------
const rawDir = R("research", "raw");
const rawFiles = (await fs.readdir(rawDir)).filter((f) => f.endsWith(".json"));
const events: EventInfo[] = [];
for (const f of rawFiles) {
  const e: RawEvent = JSON.parse(await fs.readFile(path.join(rawDir, f), "utf8"));
  const dates = [
    ...e.sessions.map((s) => s.date).filter(isDate),
    ...(EVENT_RANGE_FIX[e.eventId] || []),
  ].sort();
  events.push({
    id: e.eventId,
    name: e.event,
    country: e.country,
    from: dates[0] || null,
    to: dates.at(-1) || null,
  });
}
events.sort(
  (a, b) =>
    (a.from || "9999").localeCompare(b.from || "9999") ||
    a.id.localeCompare(b.id, "en", { numeric: true }),
);

// ---------- 곡 고르기 ----------
const tally = await readJson<Tally[]>(R("research", "tally.json"), []);
const picked = tally.filter(
  (t) =>
    t.eventsNonSelf >= MIN_EVENTS ||
    (t.eventsNonSelf >= NEW_MIN_EVENTS && (t.pub || "") >= NEW_SINCE),
);

// ---------- VocaDB 영상 ID ----------
const pvCachePath = R("research", ".pv-cache.json");
const pvCache = await readJson<PvCache>(pvCachePath, {});
const pickPv = (pvs: VocaDbPv[], service: string) => {
  const ok = pvs.filter((p) => p.service === service && !p.disabled);
  return (
    (ok.find((p) => p.pvType === "Original") || ok.find((p) => p.pvType === "Reprint") || ok[0])
      ?.pvId || null
  );
};
const need = picked.filter((t) => !(t.vocadbId in pvCache));
let i = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (i < need.length) {
      const t = need[i++];
      try {
        const r = await fetch(`https://vocadb.net/api/songs/${t.vocadbId}?fields=PVs`);
        if (!r.ok) continue;
        const j: { pvs?: VocaDbPv[] } = await r.json();
        pvCache[t.vocadbId] = {
          yt: pickPv(j.pvs || [], "Youtube"),
          nico: pickPv(j.pvs || [], "NicoNicoDouga"),
        };
      } catch {
        /* 다음 실행 때 다시 시도 */
      }
    }
  }),
);
await fs.writeFile(pvCachePath, JSON.stringify(pvCache));

// ---------- songs.json ----------
const prev = await readJson<Song[]>(R("public", "songs.json"), []);
const keep = new Map(prev.filter((s) => typeof s.id === "number").map((s) => [s.id, s]));

const songs: Song[] = picked.map((t) => {
  const uses = t.used.filter((u) => !u.self);
  const byKind: Record<string, number> = {};
  for (const kind of new Set(uses.map((u) => u.kind))) {
    byKind[kind] = new Set(uses.filter((u) => u.kind === kind).map((u) => u.eventId)).size;
  }
  const old: Partial<Song> = keep.get(t.vocadbId) || {};
  const pv = pvCache[t.vocadbId] ?? { yt: null, nico: null };
  return {
    id: t.vocadbId,
    title: t.title.trim(),
    titleKo: t.titleKo && t.titleKo !== t.title.trim() ? t.titleKo : null,
    titleKoUnverified: t.titleKoSource === "번역" && t.titleKoCheck !== "유튜브 일치",
    producer: t.producers,
    vocal: t.vocal,
    pub: t.pub,
    yt: pv.yt || null,
    nico: pv.nico || null,
    stats: { events: t.eventsNonSelf, kr: t.kr, jp: t.jp, byKind },
    uses: t.used.map((u) => ({
      ev: u.eventId,
      session: u.session,
      date: isDate(u.date) ? u.date : null,
      kind: u.kind,
      src: u.source,
      ...(u.self ? { self: true as const } : {}),
    })),
    tags: old.tags || [],
    why: old.why || "",
  };
});

// 집계 기준에는 안 들지만 직접 넣은 곡(tags 나 why 가 있는 곡)은 그대로 남긴다. 예: 에디터 픽
const built = new Set(songs.map((s) => s.id));
const manual = prev.filter(
  (s) => typeof s.id === "number" && !built.has(s.id) && ((s.tags || []).length || s.why),
);
songs.push(...manual);

await fs.writeFile(R("public", "events.json"), JSON.stringify(events, null, 1) + "\n");
await fs.writeFile(R("public", "songs.json"), JSON.stringify(songs, null, 1) + "\n");

const noVideo = songs.filter((s) => !s.yt && !s.nico).length;
console.log(
  `곡 ${songs.length}개 (집계 ${songs.length - manual.length} + 직접 넣은 곡 ${manual.length}, 신곡 기준일 ${NEW_SINCE}), 행사 ${events.length}개`,
);
console.log(
  `YouTube ${songs.filter((s) => s.yt).length}개, 니코동만 ${songs.filter((s) => !s.yt && s.nico).length}개, 영상 없음 ${noVideo}개`,
);
