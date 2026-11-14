// 노점상: 루트의 picks.json 을 곡 목록에 합친다.
// 이미 집계에 있는 곡이면 pick 표시만 붙이고, 없으면 행사 기록 없는 곡으로 추가한다.
import raw from "../picks.json";
import type { PickEntry, Song, SongData } from "./types.ts";

const PICKS: PickEntry[] = raw;

export function withPicks(songs: SongData[]): Song[] {
  const picks = new Map(PICKS.map((p) => [p.id, p]));
  const out: Song[] = songs.map((s) => {
    const p = picks.get(s.id);
    picks.delete(s.id);
    return { ...s, tags: p ? ["pick"] : [], why: p?.why ?? "" };
  });
  for (const p of picks.values()) {
    out.push({
      id: p.id,
      title: p.title,
      titleKo: p.titleKo ?? null,
      titleKoUnverified: p.titleKoUnverified ?? false,
      producer: p.producer,
      vocal: p.vocal ?? [],
      pub: p.pub ?? null,
      yt: p.yt ?? null,
      nico: p.nico ?? null,
      stats: { events: 0, kr: 0, jp: 0, byKind: {} },
      uses: [],
      tags: ["pick"],
      why: p.why ?? "",
    });
  }
  return out;
}
