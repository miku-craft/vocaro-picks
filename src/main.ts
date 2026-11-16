import { render, nothing } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { lang, langParam, t } from "./i18n.ts";
import { DEFAULT_SORT, SECTIONS, SORTS } from "./sections.ts";
import { withPicks } from "./picks.ts";
import { statsText } from "./format.ts";
import { card, sectionTabs, sortOptions, detail, playlist } from "./views.ts";
import type { EventInfo, SongData, Song } from "./types.ts";
import songsData from "../data/songs.json";
import eventsData from "../data/events.json";

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const dlg = $<HTMLDialogElement>("#detail");
const q = $<HTMLInputElement>("#q");
const sort = $<HTMLSelectElement>("#sort");
const autoplay = $<HTMLInputElement>("#autoplay");

// index.html 에 적힌 한국어 문구를 고른 언어로 바꾼다
document.documentElement.lang = lang;
document.title = t.pageTitle;
// 제목을 누르면 섹션, 검색어, 정렬, 열린 곡을 모두 비운 첫 화면으로 (고른 언어만 유지)
const home = $<HTMLAnchorElement>("#home");
home.textContent = t.siteTitle;
home.href = location.pathname + (langParam ? `?lang=${lang}` : "");
$(".lead").textContent = t.lead;
$("#stats").textContent = statsText(eventsData as EventInfo[]);
q.placeholder = t.searchPlaceholder;
q.ariaLabel = t.search;
sort.ariaLabel = t.sort;
render(sortOptions(SORTS), sort);
$("#autoplay-label").textContent = t.autoplay;
$("#play-all").textContent = t.playAll;
$("#sections").ariaLabel = t.sectionsNav;
$("#detail .close").ariaLabel = t.close;

// 언어 전환: 지금 주소(섹션, 검색어, 정렬)는 그대로 두고 ?lang= 만 바꿔 다시 연다
const langLink = $<HTMLAnchorElement>("#lang");
const otherLang = lang === "ja" ? "ko" : "ja";
langLink.textContent = t.otherLang;
langLink.hreflang = otherLang;
langLink.href = `?lang=${otherLang}`; // 새 탭으로 열 때를 위한 기본 주소
langLink.addEventListener("click", (e) => {
  e.preventDefault();
  const p = new URLSearchParams(location.search);
  p.set("lang", otherLang);
  location.search = p.toString();
});

// 자동재생 설정은 이 브라우저에만 기억한다 (기본은 꺼짐)
try {
  autoplay.checked = localStorage.getItem("autoplay") === "1";
} catch {}
autoplay.addEventListener("change", () => {
  try {
    localStorage.setItem("autoplay", autoplay.checked ? "1" : "0");
  } catch {}
});
// 데이터는 JS 번들에 같이 들어간다 (내용이 바뀌면 파일 이름의 해시가 바뀌어서 오래 캐시해도 된다)
const state = {
  songs: withPicks(songsData as SongData[]),
  shown: [] as Song[], // 지금 화면에 보이는 목록 (연속 재생에 사용)
  events: new Map((eventsData as EventInfo[]).map((e) => [e.id, e])),
  active: null as string | null, // 섹션 key (null = 전체)
};

// 섹션, 검색어, 정렬은 주소의 ?s=&q=&sort= 에 담아서 그대로 공유할 수 있게 한다
const params = new URLSearchParams(location.search);
// 없는 섹션 key면 전체로
state.active = SECTIONS.some((s) => s.key === params.get("s")) ? params.get("s") : null;
q.value = params.get("q") ?? "";
// <select>는 목록에 없는 값을 넣으면 "" 가 되므로 sort.value 는 항상 옵션 값 중 하나다
sort.value = params.get("sort") ?? "";

function saveToUrl() {
  const p = new URLSearchParams();
  if (state.active) p.set("s", state.active);
  if (q.value.trim()) p.set("q", q.value.trim());
  if (sort.value) p.set("sort", sort.value);
  if (langParam) p.set("lang", lang);
  const qs = p.toString();
  history.replaceState(null, "", `${location.pathname}${qs ? `?${qs}` : ""}${location.hash}`);
}

const searchText = (s: Song) =>
  [s.title, s.titleKo, ...s.producer, ...s.vocal, ...s.tags].join(" ").toLowerCase();

function update() {
  const query = q.value.trim().toLowerCase();
  const section = SECTIONS.find((s) => s.key === state.active);
  const shown = state.songs
    .filter((s) => (!section || section.filter(s)) && searchText(s).includes(query))
    .sort(SORTS.find((o) => o.key === sort.value)?.sort ?? section?.sort ?? DEFAULT_SORT);
  state.shown = shown;

  render(sectionTabs(SECTIONS, state.active, selectSection), $("#sections"));
  $("#section-desc").textContent =
    `${section ? `${section.desc} -` : t.all} ${t.count(shown.length)}`;
  render(
    // 곡 id를 키로 카드 DOM을 재사용해서, 검색이나 정렬이 바뀌어도 썸네일이 다시 로드되지 않게 한다
    shown.length
      ? repeat(
          shown,
          (s) => s.id,
          (s) => card(s, openDetail),
        )
      : t.noMatch,
    $("#list"),
  );
  saveToUrl();
}

function selectSection(key: string | null) {
  state.active = key;
  update();
}

function openDetail(s: Song) {
  render(detail(s, state.events, autoplay.checked), $("#detail-content"));
  history.replaceState(null, "", `#song-${s.id}`);
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
}

// 주소가 #song-<VocaDB id> 이면 그 곡 상세를 연다 (공유 링크)
function openFromHash() {
  const m = location.hash.match(/^#song-(\d+)$/);
  const target = m && state.songs.find((x) => x.id === Number(m[1]));
  if (target) openDetail(target);
}

// 닫으면 영상을 지워 재생을 멈추고 주소의 #song-… 을 지운다
dlg.addEventListener("close", () => {
  render(nothing, $("#detail-content"));
  history.replaceState(null, "", location.pathname + location.search);
});
// 바깥(배경)을 누르면 닫기
dlg.addEventListener("click", (e) => {
  if (e.target === dlg) dlg.close();
});
$("#play-all").addEventListener("click", () => {
  render(playlist(state.shown), $("#detail-content"));
  history.replaceState(null, "", location.pathname + location.search);
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
});
q.addEventListener("input", update);
sort.addEventListener("change", update);

// 빌드 때 미리 넣어 둔 섹션 버튼과 목록(vite.config.ts, 검색엔진용)을 지우고 lit-html 로 다시 그린다
$("#sections").replaceChildren();
$("#list").replaceChildren();
update();
openFromHash();
window.addEventListener("hashchange", openFromHash);
