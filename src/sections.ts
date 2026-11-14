// 섹션 정의와 정렬 방법. 버튼 순서는 SECTIONS 배열 순서와 같고 "전체"는 항상 맨 앞에 붙는다.
import { isPick } from "./format.ts";
import { t } from "./i18n.ts";
import type { Compare, Section, Song } from "./types.ts";

const compare = (x: number | string, y: number | string) => (x > y ? 1 : x < y ? -1 : 0);

// 같은 값이면 행사 많은 순으로 한 번 더 정렬한다
const byEvents: Compare = (a, b) => b.stats.events - a.stats.events;
const desc =
  (value: (s: Song) => number | string): Compare =>
  (a, b) =>
    compare(value(b), value(a)) || byEvents(a, b);
const asc =
  (value: (s: Song) => number | string): Compare =>
  (a, b) =>
    compare(value(a), value(b)) || byEvents(a, b);

const randplay = (s: Song) => s.stats.byKind.랜플댄 ?? 0;
const dj = (s: Song) => s.stats.byKind.DJ ?? 0;
const pub = (s: Song) => s.pub ?? "";

const oneYearAgo = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toLocaleDateString("sv-SE"); // YYYY-MM-DD (로컬 날짜)
};

// 정렬 드롭다운. key 는 index.html 의 <option value> 이자 주소의 ?sort= 값
export const SORTS: Record<string, Compare> = {
  "-stats.events": byEvents,
  "-pub": desc(pub),
  title: asc((s) => s.title),
};

export const DEFAULT_SORT = byEvents;

export const SECTIONS: Section[] = [
  {
    key: "pick",
    ...t.sections.pick,
    filter: isPick,
    sort: desc(pub),
  },
  {
    key: "new",
    ...t.sections.new,
    filter: (s) => pub(s) >= oneYearAgo(),
    sort: byEvents,
  },
  {
    key: "randplay",
    ...t.sections.randplay,
    filter: (s) => randplay(s) >= 5,
    sort: desc(randplay),
  },
  {
    key: "both",
    ...t.sections.both,
    filter: (s) => s.stats.kr >= 1 && s.stats.jp >= 1,
    sort: byEvents,
  },
  {
    key: "club",
    ...t.sections.club,
    filter: (s) => dj(s) >= 5,
    sort: desc(dj),
  },
  {
    key: "kr",
    ...t.sections.kr,
    filter: (s) => s.stats.kr >= 4,
    sort: desc((s) => s.stats.kr),
  },
  {
    key: "jp",
    ...t.sections.jp,
    filter: (s) => s.stats.jp >= 4,
    sort: desc((s) => s.stats.jp),
  },
];
