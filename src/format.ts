// 화면에 보여 줄 문자열과 URL 만들기
import type { Country, EventInfo, Song } from "./types.ts";

export const KIND: Record<string, string> = {
  랜플댄: "랜덤플레이댄스",
  DJ: "DJ",
  공연: "공연",
  커버: "밴드 커버",
};
export const FLAG: Record<Country, string> = { KR: "🇰🇷", JP: "🇯🇵" };

export const koTitle = (s: Song) => s.titleKo || s.title;
export const isPick = (s: Song) => s.tags.includes("pick");

export const thumbUrl = (s: Song) => {
  if (s.yt) return `https://i.ytimg.com/vi/${s.yt}/mqdefault.jpg`;
  const n = s.nico?.replace(/\D/g, "");
  return n ? `https://nicovideo.cdn.nimg.jp/thumbnails/${n}/${n}` : "";
};

export const embedUrl = (s: Song, autoplay: boolean) => {
  const q = `?autoplay=${autoplay ? 1 : 0}`;
  return s.yt
    ? `https://www.youtube-nocookie.com/embed/${s.yt}${q}`
    : s.nico && `https://embed.nicovideo.jp/watch/${s.nico}${q}`;
};

// "初音ミク V4X (Dark)" → "初音ミク" 처럼 음원 버전을 떼고 캐릭터 이름만 남긴다
const voiceName = (v: string) =>
  v
    .replace(/^(Synthesizer V( \d)?( AI)?|V\d|v)\s+/i, "")
    .replace(/\s*[(（].*$/, "")
    .replace(/\s+(V\d+X?|V\d|NT|Append|AI|SV\d?|English|Natural|Lite)$/i, "")
    .replace(/(SV\d?|AI)$/, "")
    .trim();

export const vocalShort = (s: Song, max = 3) => {
  const names = [...new Set(s.vocal.map(voiceName))];
  const rest = names.length - max;
  return names.slice(0, max).join(", ") + (rest > 0 ? ` 외 ${rest}` : "");
};

export const badgeText = (s: Song) =>
  [
    isPick(s) && "★ 에디터 픽",
    s.stats.events
      ? `행사 ${s.stats.events}곳, ${FLAG.KR} ${s.stats.kr}, ${FLAG.JP} ${s.stats.jp}`
      : "아직 수집한 셋리에는 없어요",
  ]
    .filter(Boolean)
    .join(" - ");

export const fmt = (d: string | null) => (d ? d.replaceAll("-", ".") : "날짜 미확인");

export const eventDate = (e?: EventInfo) => {
  if (!e?.from) return "";
  return e.from === e.to ? fmt(e.from) : `${fmt(e.from)}~${fmt(e.to).slice(5)}`;
};
