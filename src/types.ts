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

// public/songs.json 의 곡 하나
export interface SongData {
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
}

// 화면에서 쓰는 곡: songs.json 에 picks.json 을 합친 것 (src/picks.ts)
export interface Song extends SongData {
  tags: string[]; // 노점상이면 ["pick"]
  why: string;
}

// picks.json 의 항목. 노점상 추천 PR 은 이것만 적으면 된다
export interface PickEntry {
  id: number; // VocaDB id
  title: string;
  titleKo?: string;
  titleKoUnverified?: boolean; // 한국어 제목이 임시 번역이면 true
  producer: string[];
  vocal?: string[];
  pub?: string; // YYYY-MM-DD
  yt?: string; // YouTube 영상 ID
  nico?: string; // 니코동 영상 ID (sm...)
  why?: string; // 추천 이유 한 줄
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
