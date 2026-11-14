import { render, nothing } from "lit-html";
import { repeat } from "lit-html/directives/repeat.js";
import { matches, byKey } from "./rules.ts";
import { SECTIONS } from "./sections.ts";
import { withPicks } from "./picks.ts";
import { card, sectionTabs, detail, playlist } from "./views.ts";
import type { EventInfo, SongData, SortKey, Song } from "./types.ts";

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const dlg = $<HTMLDialogElement>("#detail");
const q = $<HTMLInputElement>("#q");
const sort = $<HTMLSelectElement>("#sort");
const autoplay = $<HTMLInputElement>("#autoplay");

// 자동재생 설정은 이 브라우저에만 기억한다 (기본은 꺼짐)
try {
  autoplay.checked = localStorage.getItem("autoplay") === "1";
} catch {}
autoplay.addEventListener("change", () => {
  try {
    localStorage.setItem("autoplay", autoplay.checked ? "1" : "0");
  } catch {}
});
const state = {
  songs: [] as Song[],
  shown: [] as Song[], // 지금 화면에 보이는 목록 (연속 재생에 사용)
  events: new Map<string, EventInfo>(),
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
  const qs = p.toString();
  history.replaceState(null, "", `${location.pathname}${qs ? `?${qs}` : ""}${location.hash}`);
}

const searchText = (s: Song) =>
  [s.title, s.titleKo, ...s.producer, ...s.vocal, ...s.tags].join(" ").toLowerCase();

function update() {
  const query = q.value.trim().toLowerCase();
  const section = SECTIONS.find((s) => s.key === state.active);
  const shown = state.songs
    .filter((s) => (!section || matches(s, section.where)) && searchText(s).includes(query))
    .sort(byKey((sort.value as SortKey | "") || section?.sort || "-stats.events"));
  state.shown = shown;

  render(sectionTabs(SECTIONS, state.active, selectSection), $("#sections"));
  $("#section-desc").textContent = `${section ? `${section.desc} -` : "전체"} ${shown.length}곡`;
  render(
    // 곡 id를 키로 카드 DOM을 재사용해서, 검색이나 정렬이 바뀌어도 썸네일이 다시 로드되지 않게 한다
    shown.length
      ? repeat(
          shown,
          (s) => s.id,
          (s) => card(s, openDetail),
        )
      : "조건에 맞는 곡이 없어요.",
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

const load = <T>(name: string): Promise<T> =>
  fetch(`${import.meta.env.BASE_URL}${name}.json`).then((r) => {
    if (!r.ok) throw new Error(name);
    return r.json();
  });

Promise.all([load<SongData[]>("songs"), load<EventInfo[]>("events")])
  .then(([songs, events]) => {
    state.songs = withPicks(songs);
    state.events = new Map(events.map((e) => [e.id, e]));
    update();
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
  })
  .catch(() => {
    $("#list").textContent = "데이터를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.";
  });
