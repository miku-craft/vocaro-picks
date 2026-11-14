// public/*.json 과 섹션 정의의 모양. JSON은 scripts/build-data.ts 가 만들고 화면이 읽는다.

export type Country = "KR" | "JP";
export type Kind = "랜플댄" | "DJ" | "공연" | "커버";

export interface Use {
  ev: string; // EventInfo.id
  session: string;
  date: string | null;
  kind: Kind;
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
  stats: { events: number; kr: number; jp: number; byKind: Partial<Record<Kind, number>> };
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

// 섹션 조건과 정렬에 쓸 수 있는 필드 (점으로 이은 경로)
export type Field =
  | "title"
  | "pub"
  | "tags"
  | "stats.events"
  | "stats.kr"
  | "stats.jp"
  | `stats.byKind.${Kind}`;
export type SortKey = Field | `-${Field}`;

export interface Section {
  key: string;
  title: string;
  desc: string;
  where: Partial<Record<Field, string>>;
  sort?: SortKey;
}
