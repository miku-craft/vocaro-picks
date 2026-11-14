import { render, nothing } from "lit-html";
import { matches, byKey } from "./rules.ts";
import { card, sectionTabs, detail } from "./views.ts";
import type { EventInfo, Section, Song } from "./types.ts";

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const dlg = $<HTMLDialogElement>("#detail");
const q = $<HTMLInputElement>("#q");
const sort = $<HTMLSelectElement>("#sort");
const state = {
  songs: [] as Song[],
  sections: [] as Section[],
  events: new Map<string, EventInfo>(),
  active: null as string | null, // 섹션 key (null = 전체)
};

const searchText = (s: Song) =>
  [s.title, s.titleKo, ...s.producer, ...s.vocal, ...s.tags].join(" ").toLowerCase();

function update() {
  const query = q.value.trim().toLowerCase();
  const section = state.sections.find((s) => s.key === state.active);
  const shown = state.songs
    .filter((s) => (!section || matches(s, section.where)) && searchText(s).includes(query))
    .sort(byKey(sort.value || section?.sort || "-stats.events"));

  render(sectionTabs(state.sections, state.active, selectSection), $("#sections"));
  $("#section-desc").textContent = `${section ? `${section.desc} ·` : "전체"} ${shown.length}곡`;
  render(
    shown.length ? shown.map((s) => card(s, openDetail)) : "조건에 맞는 곡이 없어요.",
    $("#list"),
  );
}

function selectSection(key: string | null) {
  state.active = key;
  update();
}

function openDetail(s: Song) {
  render(detail(s, state.events), $("#detail-content"));
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
q.addEventListener("input", update);
sort.addEventListener("change", update);

const load = <T>(name: string): Promise<T> =>
  fetch(`${import.meta.env.BASE_URL}${name}.json`).then((r) => {
    if (!r.ok) throw new Error(name);
    return r.json();
  });

Promise.all([load<Song[]>("songs"), load<Section[]>("sections"), load<EventInfo[]>("events")])
  .then(([songs, sections, events]) => {
    Object.assign(state, {
      songs,
      sections,
      events: new Map(events.map((e) => [e.id, e])),
    });
    update();
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
  })
  .catch(() => {
    $("#list").textContent = "데이터를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.";
  });
