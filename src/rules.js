// sections.json 의 where / sort 규칙 해석

const get = (o, path) => path.split(".").reduce((a, k) => a?.[k], o);

const oneYearAgo = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return d.toLocaleDateString("sv-SE"); // YYYY-MM-DD (로컬 날짜)
};

const OPS = {
  ">=": (a, b) => a >= b,
  "<=": (a, b) => a <= b,
  ">": (a, b) => a > b,
  "<": (a, b) => a < b,
  "": (a, b) => a == b,
};

// 값 예: ">=3", "<=2025-01-01", ">=@1y"(1년 전 날짜), "pick"(같음, 배열이면 포함)
function test(song, field, rule) {
  const [, op = "", raw] = String(rule).match(/^(>=|<=|>|<)?(.*)$/);
  const want = raw === "@1y" ? oneYearAgo() : raw;
  const v = get(song, field);
  if (Array.isArray(v)) return v.includes(want);
  const num = want !== "" && !isNaN(want);
  return OPS[op](v ?? (num ? 0 : ""), num ? Number(want) : want);
}

export const matches = (song, where = {}) =>
  Object.entries(where).every(([f, r]) => test(song, f, r));

// "-stats.events" 처럼 앞에 - 가 붙으면 큰 값부터. 같으면 행사 많은 순
export const byKey = (key) => {
  const field = key.replace(/^-/, "");
  const dir = key.startsWith("-") ? -1 : 1;
  return (x, y) => {
    const a = get(x, field) ?? "";
    const b = get(y, field) ?? "";
    return ((a > b) - (a < b)) * dir || y.stats.events - x.stats.events;
  };
};
