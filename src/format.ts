// 화면에 보여 줄 문자열과 URL 만들기
import { lang, t } from "./i18n.ts";
import type { Country, EventInfo, Song } from "./types.ts";

export const FLAG: Record<Country, string> = { KR: "🇰🇷", JP: "🇯🇵" };

// 한국어 화면은 한국어 제목, 일본어 화면은 원제
export const displayTitle = (s: Song) => (lang === "ko" && s.titleKo) || s.title;
// 제목 아래 작게 보여 줄 원제 (한국어 제목을 보여 줄 때만)
export const subTitle = (s: Song) => (displayTitle(s) !== s.title ? s.title : "");
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
    .replace(/^(Synthesizer V( \d)?( AI)?|AI|V\d|v)\s+/i, "")
    .replace(/\s*[(（].*$/, "")
    .replace(/\s+(V\d+X?|V\d|NT|Append|AI|SV\d?|English|Natural|Lite)$/i, "")
    .replace(/(SV\d?|AI)$/, "")
    .trim();

export const vocalShort = (s: Song, max = 3) => {
  const names = [...new Set(s.vocal.map(voiceName))];
  const rest = names.length - max;
  return names.slice(0, max).join(", ") + (rest > 0 ? t.more(rest) : "");
};

export const badgeText = (s: Song) =>
  [
    isPick(s) && t.pickBadge,
    s.stats.events ? t.eventsBadge(s.stats.events, s.stats.kr, s.stats.jp) : t.noUsesBadge,
  ]
    .filter(Boolean)
    .join(" - ");

export const fmt = (d: string | null) => (d ? d.replaceAll("-", ".") : t.dateUnknown);

export const eventDate = (e?: EventInfo) => {
  if (!e?.from) return "";
  return e.from === e.to ? fmt(e.from) : `${fmt(e.from)}~${fmt(e.to).slice(5)}`;
};
