// research/ 의 조사 결과로 public/songs.json, public/events.json 을 만든다.
// 실행: npm run data  (node scripts/build-data.ts, Node 22.18+ 의 타입 제거 실행)
// - 페이지에 올리는 곡: 서로 다른 행사 3곳 이상 + 2곳에서 쓰인 최근 1년 신곡
// - 노점상(picks.json)에 있는 곡은 기준에 못 미쳐도 집계에 있으면 행사 기록과 함께 올린다.
// - VocaDB 영상 정보(YouTube/니코동 ID)는 research/.pv-cache.json 에 캐시한다.

import fs from "node:fs/promises";
import path from "node:path";
import pMap from "p-map";
import { KINDS, type EventInfo, type Kind, type PickEntry, type SongData } from "../src/types.ts";

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

// VocaDB 에 YouTube PV 가 등록되지 않은 곡의 YouTube 영상 ID (VocaDB id → 영상 ID)
const YT_FIX: Record<number, string> = {
  4979: "EMGyiiTC7sg", // カゲロウデイズ
  773190: "Ja9qmYjXk6U", // 太陽系デスコ
  871013: "R401j1QAvEg", // ディスペアダンス (YouTube 제목은 다름)
  389595: "lyMrKFS_qls", // ハジメテノオト(Shortバージョン) (YouTube 는 malo - Topic 음원)
  588460: "y4Z_Yf8ut8Y", // 卑怯戦隊うろたんだー (수정판 재업로드, 영어 가사 자막)
};

// 일본 행사 이름의 한국어 표기 (한국어 화면에서 씀). 영어로만 된 이름은 그대로 둔다.
const NAME_KO: Record<string, string> = {
  B2: "소카대학 록 연구회 (인스타 @soka.rocken)",
  J1: "니코니코 초회의 2026 「초 보카니코」",
  J2: "하츠네 미쿠 「매지컬 미라이 2026」",
  J10: "Unmute vol.1 Powered by 보카코레",
  J11: "프로세카 커넥트 라이브 「Parallel Paaaarty!!!!」",
  J12: "프로세카 커넥트 라이브 「GO Hoppin' Parade」",
  J13: "EXCURSION Vol.3 (#エクスカ) - VocaGaku 원맨",
  J14: "보카부키 정기 이벤트 (신주쿠 보카부키)",
  J15: "VOCABUKI 2nd Anniversary DJ PARTY (보카부키 2주년)",
  J17: "VOCALOID WEST vol.4 in Osaka (#ボカウエスト) 2026",
  J18: "Vocaloid Standard Regulation VOL.8 (#ボカスタレ) × #ボカレトロ 콜라보 (주년 회차)",
  J20: "Akiba39ers 7월 회차 (Vocaloid-20) × #僕プロ一周年 콜라보",
  J21: "Vocaloid High 84th (#ボカハイ)",
  J22: "VOCALOID Crossing 10th Anniv. × 도라문 요코초 (#どらクロ0801)",
  J23: "나는 하츠네 미쿠로 간다 vol.08 (#俺ミク)",
  J24: "VOCALOID FREAK VOL.165 (#ボカフリ)",
  J25: "Vocaloid Assortment Vol.3 (#ボカソト)",
  J26: "Vocaloid Standard Regulation VOL.9 (#ボカスタレ)",
  J27: "Vocaloid Standard Regulation (#ボカスタレ) 2026-04-18 회차",
  J28: "Vocaloid High 85th (#ボカハイ)",
  J29: "Vocaloid High (#ボカハイ) 2026-05-24 회차",
  J30: "VOCALOID FREAK VOL.164 (#ボカフリ)",
  J31: "39 Connection!! Akiba Vol.24 (#39コネ)",
  J32: "Voca/ad (#ボカアド) 제1회 · 가와사키 야외 보카쿠라",
  J33: "아마도, 보카쿠라。 Vol.2 (#多分ボカクラ)",
};

const readJson = async <T>(p: string, fallback: T): Promise<T> => {
  try {
    return JSON.parse(await fs.readFile(p, "utf8"));
  } catch {
    return fallback;
  }
};
const isDate = (d: string | null | undefined) => /^\d{4}-\d{2}-\d{2}$/.test(d || "");
// 조사 데이터의 kind 가 화면에서 아는 종류인지 확인한다. 새 종류면 types.ts 의 KINDS 와 i18n.ts 의 kind 에 먼저 추가
const toKind = (k: string): Kind => {
  if (!(KINDS as readonly string[]).includes(k)) throw new Error(`알 수 없는 kind: ${k}`);
  return k as Kind;
};

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
    ...(NAME_KO[e.eventId] && { nameKo: NAME_KO[e.eventId] }),
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
const pickIds = new Set((await readJson<PickEntry[]>(R("picks.json"), [])).map((p) => p.id));
const picked = tally.filter(
  (t) =>
    t.eventsNonSelf >= MIN_EVENTS ||
    (t.eventsNonSelf >= NEW_MIN_EVENTS && (t.pub || "") >= NEW_SINCE) ||
    (pickIds.has(t.vocadbId) && t.eventsNonSelf > 0),
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
// VocaDB 에 6개씩 동시에 묻는다. 실패한 곡은 캐시에 안 남으니 다음 실행 때 다시 시도한다
await pMap(
  need,
  async (t) => {
    try {
      const r = await fetch(`https://vocadb.net/api/songs/${t.vocadbId}?fields=PVs`);
      if (!r.ok) return;
      const j: { pvs?: VocaDbPv[] } = await r.json();
      pvCache[t.vocadbId] = {
        yt: pickPv(j.pvs || [], "Youtube"),
        nico: pickPv(j.pvs || [], "NicoNicoDouga"),
      };
    } catch {}
  },
  { concurrency: 6 },
);
await fs.writeFile(pvCachePath, JSON.stringify(pvCache));

// ---------- songs.json ----------
const songs: SongData[] = picked.map((t) => {
  const uses = t.used.filter((u) => !u.self);
  const byKind: SongData["stats"]["byKind"] = {};
  for (const kind of new Set(uses.map((u) => u.kind))) {
    byKind[toKind(kind)] = new Set(uses.filter((u) => u.kind === kind).map((u) => u.eventId)).size;
  }
  const pv = pvCache[t.vocadbId] ?? { yt: null, nico: null };
  return {
    id: t.vocadbId,
    title: t.title.trim(),
    titleKo: t.titleKo && t.titleKo !== t.title.trim() ? t.titleKo : null,
    titleKoUnverified: t.titleKoSource === "번역" && t.titleKoCheck !== "유튜브 일치",
    producer: t.producers,
    vocal: t.vocal,
    pub: t.pub,
    yt: YT_FIX[t.vocadbId] || pv.yt || null,
    nico: pv.nico || null,
    stats: { events: t.eventsNonSelf, kr: t.kr, jp: t.jp, byKind },
    uses: t.used.map((u) => ({
      ev: u.eventId,
      session: u.session,
      date: isDate(u.date) ? u.date : null,
      kind: toKind(u.kind),
      src: u.source,
      ...(u.self ? { self: true as const } : {}),
    })),
  };
});

await fs.writeFile(R("public", "events.json"), JSON.stringify(events, null, 1) + "\n");
await fs.writeFile(R("public", "songs.json"), JSON.stringify(songs, null, 1) + "\n");

const noVideo = songs.filter((s) => !s.yt && !s.nico).length;
console.log(`곡 ${songs.length}개 (신곡 기준일 ${NEW_SINCE}), 행사 ${events.length}개`);
console.log(
  `YouTube ${songs.filter((s) => s.yt).length}개, 니코동만 ${songs.filter((s) => !s.yt && s.nico).length}개, 영상 없음 ${noVideo}개`,
);
