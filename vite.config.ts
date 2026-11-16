// 빌드할 때 index.html 의 제목, 설명, 소개 문구, 섹션 버튼, 곡 목록을 미리 채운다.
// JS 를 실행하지 않는 크롤러(네이버 등)도 내용을 읽을 수 있게 하려는 것이고,
// 화면에서는 main.ts 가 같은 문구로 다시 채우거나(언어에 맞게) 지우고 다시 그린다.
// 문구는 화면과 같은 src/i18n.ts 를 쓴다 (Node 에서는 한국어).
import { defineConfig } from "vite";
import songs from "./data/songs.json";
import events from "./data/events.json";
import { t } from "./src/i18n.ts";
import { statsText } from "./src/format.ts";
import { withPicks } from "./src/picks.ts";
import { SECTIONS } from "./src/sections.ts";
import type { EventInfo, Song, SongData } from "./src/types.ts";

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// views.ts 의 card 와 같은 마크업 (한국어 화면 기준, 기본 정렬 = 행사 많은 순)
const card = (s: Song) =>
  `<article class="card"><a class="open" href="#song-${s.id}">${
    s.yt
      ? `<img class="thumb" loading="lazy" alt="" src="https://i.ytimg.com/vi/${s.yt}/mqdefault.jpg" />`
      : ""
  }<span class="body"><span class="title">${esc(s.titleKo || s.title)}</span>${
    s.titleKo ? `<span class="title-ja">${esc(s.title)}</span>` : ""
  }<span class="meta">${esc([...s.producer, ...s.vocal].join(", "))}</span>${
    s.why ? `<span class="why-line">${esc(s.why)}</span>` : ""
  }</span></a></article>`;

// views.ts 의 sectionTabs 와 같은 마크업. 섹션 설명은 title 로 넣어 검색엔진도 읽게 한다
const tabs = [{ title: t.all, desc: "" }, ...SECTIONS]
  .map(
    (s, i) =>
      `<button type="button" aria-pressed="${i === 0}" title="${esc(s.desc)}">${esc(s.title)}</button>`,
  )
  .join("");

export default defineConfig({
  plugins: [
    {
      name: "prerender",
      transformIndexHtml: (html) => {
        const list = withPicks(songs as SongData[]).sort((a, b) => b.stats.events - a.stats.events);
        const fill = (tag: string, inner: string) => {
          if (!html.includes(tag)) throw new Error(`index.html 에 ${tag} 가 없음`);
          html = html.replace(tag, tag.replace("><", `>${inner}<`));
        };
        html = html
          .replaceAll("%PAGE_TITLE%", esc(t.pageTitle))
          .replaceAll("%DESCRIPTION%", esc(t.description(list.length, events.length)));
        fill('<p class="lead"></p>', esc(t.lead));
        fill('<p id="stats" class="desc"></p>', esc(statsText(events as EventInfo[])));
        fill('<nav id="sections" class="tags" aria-label="섹션"></nav>', tabs);
        fill('<p id="section-desc" class="desc"></p>', esc(`${t.all} ${t.count(list.length)}`));
        fill('<main id="list"></main>', list.map(card).join(""));
        return html;
      },
    },
  ],
});
