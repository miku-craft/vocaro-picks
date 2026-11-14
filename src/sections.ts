// 섹션 정의와 정렬 방법. 버튼 순서는 SECTIONS 배열 순서와 같고 "전체"는 항상 맨 앞에 붙는다.
import { isPick } from "./format.ts";
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
    title: "노점상",
    desc: "한번 드셔보세요",
    filter: isPick,
    sort: desc(pub),
  },
  {
    key: "new",
    title: "요즘 신곡",
    desc: "최근 1년 안에 나온 곡",
    filter: (s) => pub(s) >= oneYearAgo(),
    sort: byEvents,
  },
  {
    key: "randplay",
    title: "랜플댄 단골",
    desc: "랜덤플레이댄스 5곳 이상",
    filter: (s) => randplay(s) >= 5,
    sort: desc(randplay),
  },
  {
    key: "both",
    title: "한일 양쪽에서 쓰인 곡",
    desc: "한국과 일본 행사 모두에서 쓰인 곡",
    filter: (s) => s.stats.kr >= 1 && s.stats.jp >= 1,
    sort: byEvents,
  },
  {
    key: "club",
    title: "클럽 DJ 단골",
    desc: "DJ 셋 5곳 이상",
    filter: (s) => dj(s) >= 5,
    sort: desc(dj),
  },
  {
    key: "kr",
    title: "한국 행사 인기곡",
    desc: "한국 행사 4곳 이상",
    filter: (s) => s.stats.kr >= 4,
    sort: desc((s) => s.stats.kr),
  },
  {
    key: "jp",
    title: "일본 현장 인기곡",
    desc: "일본 행사 4곳 이상",
    filter: (s) => s.stats.jp >= 4,
    sort: desc((s) => s.stats.jp),
  },
];
