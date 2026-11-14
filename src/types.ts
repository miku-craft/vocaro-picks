// public/*.json 의 모양. scripts/build-data.ts 가 만들고 화면이 읽는다.

export type Country = "KR" | "JP";

export interface Use {
  ev: string; // EventInfo.id
  session: string;
  date: string | null;
  kind: string; // 랜플댄 | DJ | 공연 | 커버
  src: string;
  self?: true; // DJ 본인 곡
}

export interface Song {
  id: number; // VocaDB id
  title: string;
  titleKo: string | null;
  titleKoUnverified: boolean;
  producer: string[];
  vocal: string[];
  pub: string | null;
  yt: string | null;
  nico: string | null;
  stats: { events: number; kr: number; jp: number; byKind: Record<string, number> };
  uses: Use[];
  tags: string[];
  why: string;
}

export interface EventInfo {
  id: string;
  name: string;
  country: Country;
  from: string | null;
  to: string | null;
}

export interface Section {
  key: string;
  title: string;
  desc: string;
  where: Record<string, string>;
  sort?: string;
}
