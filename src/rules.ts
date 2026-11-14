// 섹션의 where / sort 규칙 해석
import type { Field, Section, SortKey, Song } from "./types.ts";

type Val = string | number;

const get = (o: unknown, path: string): unknown => path.split(".").reduce<any>((a, k) => a?.[k], o);

const oneYearAgo = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toLocaleDateString("sv-SE"); // YYYY-MM-DD (로컬 날짜)
};

const OPS = {
  ">=": (a: Val, b: Val) => a >= b,
  "<=": (a: Val, b: Val) => a <= b,
  ">": (a: Val, b: Val) => a > b,
  "<": (a: Val, b: Val) => a < b,
  "": (a: Val, b: Val) => a == b,
};
// 두 글자 연산자를 먼저 본다 (">=" 를 ">" 로 읽지 않게)
const OP_ORDER = [">=", "<=", ">", "<"] as const;

// 값 예: ">=3", "<=2025-01-01", ">=@1y"(1년 전 날짜), "pick"(같음, 배열이면 포함)
function test(song: Song, field: Field, rule: string) {
  const op = OP_ORDER.find((o) => rule.startsWith(o)) ?? "";
  const raw = rule.slice(op.length);
  const want = raw === "@1y" ? oneYearAgo() : raw;
  const v = get(song, field);
  if (Array.isArray(v)) return v.includes(want);
  const num = want !== "" && !Number.isNaN(Number(want));
  return OPS[op]((v as Val | null | undefined) ?? (num ? 0 : ""), num ? Number(want) : want);
}

export const matches = (song: Song, where: Section["where"] = {}) =>
  (Object.entries(where) as [Field, string][]).every(([f, r]) => test(song, f, r));

// "-stats.events" 처럼 앞에 - 가 붙으면 큰 값부터. 같으면 행사 많은 순
export const byKey = (key: SortKey) => {
  const field = key.replace(/^-/, "");
  const dir = key.startsWith("-") ? -1 : 1;
  return (x: Song, y: Song) => {
    const a = (get(x, field) ?? "") as Val;
    const b = (get(y, field) ?? "") as Val;
    return (a > b ? 1 : a < b ? -1 : 0) * dir || y.stats.events - x.stats.events;
  };
};
