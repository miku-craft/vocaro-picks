// lit-html 템플릿: 카드, 섹션 버튼, 상세 창
import { html, nothing } from "lit-html";
import {
  KIND,
  FLAG,
  koTitle,
  isPick,
  thumbUrl,
  embedUrl,
  vocalShort,
  badgeText,
  fmt,
  eventDate,
} from "./format.js";

const extLink = (href, text) => html`<a href=${href} target="_blank" rel="noopener">${text} ↗</a>`;

export const card = (s, onOpen) => html`
  <article class="card">
    <button class="open" type="button" @click=${() => onOpen(s)}>
      ${
        thumbUrl(s) ? html`<img class="thumb" loading="lazy" alt="" src=${thumbUrl(s)} />` : nothing
      }
      <span class="body">
        <span class="title">${koTitle(s)}</span>
        ${s.titleKo ? html`<span class="title-ja">${s.title}</span>` : nothing}
        <span class="meta">${s.producer.join(", ")} · ${vocalShort(s)}</span>
        <span class="badges">${badgeText(s)}</span>
        ${isPick(s) && s.why ? html`<span class="why-line">${s.why}</span>` : nothing}
      </span>
    </button>
  </article>
`;

export const sectionTabs = (sections, active, onSelect) =>
  [{ key: null, title: "전체" }, ...sections].map(
    (sec) => html`
      <button
        type="button"
        aria-pressed=${sec.key === active ? "true" : "false"}
        @click=${() => onSelect(sec.key)}
      >
        ${sec.title}
      </button>
    `,
  );

// 행사 하나: 제목 줄 + 그 행사에서 쓰인 세션 목록
const useItem = (e, id, list) => html`
  <li>
    <div class="use-head">${FLAG[e?.country] ?? ""} ${eventDate(e)} ${e?.name ?? id}</div>
    <ul>
      ${list.map(
        (u) =>
          html`<li>
            ${KIND[u.kind] ?? u.kind} · ${u.session}${u.self ? " (DJ 본인 곡)" : ""}
            ${u.src ? extLink(u.src, "출처") : nothing}
          </li>`,
      )}
    </ul>
  </li>
`;

export function detail(s, events) {
  const src = embedUrl(s);
  const kinds = Object.entries(s.stats.byKind)
    .map(([k, n]) => `${KIND[k] ?? k} ${n}`)
    .join(" · ");
  const tags = s.tags.filter((t) => t !== "pick");
  // 행사별로 묶어서 최근 행사부터
  const byEvent = Object.entries(Object.groupBy(s.uses, (u) => u.ev)).sort(([a], [b]) =>
    (events.get(b)?.from ?? "").localeCompare(events.get(a)?.from ?? ""),
  );
  const links = [
    s.yt && extLink(`https://www.youtube.com/watch?v=${s.yt}`, "YouTube"),
    s.nico && extLink(`https://www.nicovideo.jp/watch/${s.nico}`, "니코동"),
    extLink(`https://vocadb.net/S/${s.id}`, "VocaDB"),
  ].filter(Boolean);

  return html`
    <div class="player">
      ${
        src
          ? html`<iframe
              src=${src}
              title=${s.title}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowfullscreen
            ></iframe>`
          : html`<p class="no-video">등록된 영상이 없어요.</p>`
      }
    </div>
    <div class="detail-body">
      <h2 id="detail-title">${koTitle(s)}</h2>
      ${
        s.titleKo
          ? html`<p class="title-ja">
              ${s.title}${s.titleKoUnverified ? " · 한국어 제목은 임시 번역" : ""}
            </p>`
          : nothing
      }
      <p class="meta">
        ${[s.producer.join(", "), vocalShort(s, 8), s.pub && `${fmt(s.pub)} 발표`]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <p class="badges">${badgeText(s)}${kinds ? ` (${kinds})` : ""}</p>
      ${s.why ? html`<p class="why">${s.why}</p>` : nothing}
      ${
        tags.length
          ? html`<ul class="tags">
              ${tags.map((t) => html`<li>${t}</li>`)}
            </ul>`
          : nothing
      }
      <h3>쓰인 행사</h3>
      <ol class="uses">
        ${
          byEvent.length
            ? byEvent.map(([id, list]) => useItem(events.get(id), id, list))
            : html`<li class="empty">아직 수집한 행사 셋리에는 나오지 않았어요.</li>`
        }
      </ol>
      <p class="links">${links.map((a, i) => html`${i ? " · " : ""}${a}`)}</p>
    </div>
  `;
}
