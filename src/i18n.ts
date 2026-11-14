// 화면 문구 (한국어, 일본어). ko 가 기준이고, ja 는 ko 의 키를 빠짐없이 채워야 한다 (빠지면 타입 에러).
// 곡 제목, 행사 이름, 세션 설명 같은 데이터는 번역하지 않는다.
import type { Kind } from "./types.ts";

export type Lang = "ko" | "ja";

const ko = {
  siteTitle: "보카로 트렌드",
  lead: "한국과 일본 행사 셋리스트에 쓰인 보카로 곡. 행사에서 쓰기 좋은 곡 위주라서 유명하다고 다 있는 건 아니에요.",
  otherLang: "日本語", // 다른 언어로 바꾸는 링크 글자
  search: "검색",
  searchPlaceholder: "제목, P, 보컬 검색",
  sort: "정렬",
  sortDefault: "기본",
  sortEvents: "행사 많은 순",
  sortNew: "최신 발표순",
  sortTitle: "제목순",
  autoplay: "자동재생",
  playAll: "▶ 목록 연속 재생",
  sectionsNav: "섹션",
  close: "닫기",
  all: "전체",
  count: (n: number) => `${n}곡`,
  noMatch: "조건에 맞는 곡이 없어요.",
  loadError: "데이터를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.",
  kind: { 랜플댄: "랜덤플레이댄스", DJ: "DJ", 공연: "공연", 커버: "밴드 커버" } as Record<
    Kind,
    string
  >,
  pickBadge: "★ 노점상",
  eventsBadge: (n: number, kr: number, jp: number) => `행사 ${n}곳, 🇰🇷 ${kr}, 🇯🇵 ${jp}`,
  noUsesBadge: "아직 수집한 셋리에는 없어요",
  dateUnknown: "날짜 미확인",
  more: (n: number) => ` 외 ${n}`,
  selfSong: " (DJ 본인 곡)",
  source: "출처",
  nico: "니코동",
  noVideo: "등록된 영상이 없어요.",
  koTitleUnverified: " (한국어 제목은 임시 번역)",
  published: (date: string) => `${date} 발표`,
  usedAt: "쓰인 행사",
  noUses: "아직 수집한 행사 셋리에는 나오지 않았어요.",
  playlistTitle: "목록 연속 재생",
  playlistNone: "재생할 YouTube 영상이 없어요.",
  playlistCount: (n: number, skipped: number) =>
    `${n}곡` + (skipped ? ` (YouTube 영상이 없거나 199곡을 넘어 ${skipped}곡 제외)` : ""),
  sections: {
    pick: { title: "노점상", desc: "한번 드셔보세요" },
    new: { title: "요즘 신곡", desc: "최근 1년 안에 나온 곡" },
    randplay: { title: "랜플댄 단골", desc: "랜덤플레이댄스 5곳 이상" },
    both: { title: "한일 양쪽에서 쓰인 곡", desc: "한국과 일본 행사 모두에서 쓰인 곡" },
    club: { title: "클럽 DJ 단골", desc: "DJ 셋 5곳 이상" },
    kr: { title: "한국 행사 인기곡", desc: "한국 행사 4곳 이상" },
    jp: { title: "일본 현장 인기곡", desc: "일본 행사 4곳 이상" },
  },
};

const ja: typeof ko = {
  siteTitle: "ボカロトレンド",
  lead: "日韓のイベントのセットリストで使われたボカロ曲。イベントで使いやすい曲が中心なので、有名な曲でも載っていないことがあります。",
  otherLang: "한국어",
  search: "検索",
  searchPlaceholder: "曲名・P・ボーカルで検索",
  sort: "並び替え",
  sortDefault: "標準",
  sortEvents: "イベント数順",
  sortNew: "新しい順",
  sortTitle: "曲名順",
  autoplay: "自動再生",
  playAll: "▶ リストを連続再生",
  sectionsNav: "セクション",
  close: "閉じる",
  all: "すべて",
  count: (n) => `${n}曲`,
  noMatch: "条件に合う曲がありません。",
  loadError: "データを読み込めませんでした。しばらくしてからもう一度お試しください。",
  kind: { 랜플댄: "ランダムプレイダンス", DJ: "DJ", 공연: "ライブ", 커버: "バンドカバー" },
  pickBadge: "★ 屋台",
  eventsBadge: (n, kr, jp) => `イベント${n}件、🇰🇷 ${kr}、🇯🇵 ${jp}`,
  noUsesBadge: "収集したセトリにはまだありません",
  dateUnknown: "日付不明",
  more: (n) => ` ほか${n}`,
  selfSong: "（DJ本人の曲）",
  source: "出典",
  nico: "ニコニコ",
  noVideo: "登録された動画がありません。",
  koTitleUnverified: "", // 日本語表示では韓国語タイトルを出さない
  published: (date) => `${date} 公開`,
  usedAt: "使われたイベント",
  noUses: "収集したイベントのセトリにはまだ登場していません。",
  playlistTitle: "リストを連続再生",
  playlistNone: "再生できるYouTube動画がありません。",
  playlistCount: (n, skipped) =>
    `${n}曲` + (skipped ? `（YouTube動画がない曲・199曲を超えた分の${skipped}曲を除く）` : ""),
  sections: {
    pick: { title: "屋台", desc: "ちょっと味見していって" },
    new: { title: "最近の新曲", desc: "1年以内に公開された曲" },
    randplay: { title: "ランダムプレイダンスの常連", desc: "ランダムプレイダンス5件以上" },
    both: { title: "日韓両方で使われた曲", desc: "韓国と日本、両方のイベントで使われた曲" },
    club: { title: "クラブDJの常連", desc: "DJセット5件以上" },
    kr: { title: "韓国イベントの人気曲", desc: "韓国のイベント4件以上" },
    jp: { title: "日本の現場の人気曲", desc: "日本のイベント4件以上" },
  },
};

// 언어: 주소의 ?lang= 가 있으면 그것, 없으면 브라우저 언어가 일본어일 때만 ja
export const langParam = new URLSearchParams(location.search).get("lang");
export const lang: Lang =
  langParam === "ja" || langParam === "ko"
    ? langParam
    : navigator.language.startsWith("ja")
      ? "ja"
      : "ko";
export const t = lang === "ja" ? ja : ko;
