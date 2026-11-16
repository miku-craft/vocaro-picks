// 빌드할 때 곡 목록을 index.html 의 <main id="list"> 에 미리 넣는다.
// JS 를 실행하지 않는 크롤러(네이버 등)도 곡 제목, P 를 읽을 수 있게 하려는 것이고,
// 화면에서는 main.ts 가 이 내용을 지우고 지금처럼 다시 그린다.
import { defineConfig } from "vite";
import songs from "./data/songs.json";
import { withPicks } from "./src/picks.ts";
import type { SongData } from "./src/types.ts";

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

// views.ts 의 card 와 같은 마크업 (한국어 화면 기준, 기본 정렬 = 행사 많은 순)
const card = (s: ReturnType<typeof withPicks>[number]) =>
  `<article class="card"><a class="open" href="#song-${s.id}">${
    s.yt
      ? `<img class="thumb" loading="lazy" alt="" src="https://i.ytimg.com/vi/${s.yt}/mqdefault.jpg" />`
      : ""
  }<span class="body"><span class="title">${esc(s.titleKo || s.title)}</span>${
    s.titleKo ? `<span class="title-ja">${esc(s.title)}</span>` : ""
  }<span class="meta">${esc([...s.producer, ...s.vocal].join(", "))}</span>${
    s.why ? `<span class="why-line">${esc(s.why)}</span>` : ""
  }</span></a></article>`;

export default defineConfig({
  plugins: [
    {
      name: "prerender-list",
      transformIndexHtml: (html) => {
        const list = withPicks(songs as SongData[]).sort((a, b) => b.stats.events - a.stats.events);
        return html.replace(
          '<main id="list"></main>',
          `<main id="list">${list.map(card).join("")}</main>`,
        );
      },
    },
  ],
});
