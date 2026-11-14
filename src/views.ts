// lit-html 템플릿: 카드, 섹션 버튼, 상세 창
import { html, nothing } from "lit-html";
import { t } from "./i18n.ts";
import {
  FLAG,
  displayTitle,
  subTitle,
  isPick,
  thumbUrl,
  embedUrl,
  vocalShort,
  badgeText,
  fmt,
  eventDate,
} from "./format.ts";
import { KINDS, type EventInfo, type Section, type Song, type Use } from "./types.ts";

const extLink = (href: string, text: string) =>
  html`<a href=${href} target="_blank" rel="noopener">${text} ↗</a>`;

export const card = (s: Song, onOpen: (s: Song) => void) => html`
  <article class="card">
    <button class="open" type="button" @click=${() => onOpen(s)}>
      ${
        thumbUrl(s) ? html`<img class="thumb" loading="lazy" alt="" src=${thumbUrl(s)} />` : nothing
      }
      <span class="body">
        <span class="title">${displayTitle(s)}</span>
        ${subTitle(s) ? html`<span class="title-ja">${subTitle(s)}</span>` : nothing}
        <span class="meta">${s.producer.join(", ")} - ${vocalShort(s)}</span>
        <span class="badges">${badgeText(s)}</span>
        ${isPick(s) && s.why ? html`<span class="why-line">${s.why}</span>` : nothing}
      </span>
    </button>
  </article>
`;

export const sectionTabs = (
  sections: Section[],
  active: string | null,
  onSelect: (key: string | null) => void,
) =>
  [{ key: null, title: t.all }, ...sections].map(
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
const useItem = (e: EventInfo | undefined, id: string, list: Use[]) => html`
  <li>
    <div class="use-head">${e ? FLAG[e.country] : ""} ${eventDate(e)} ${e?.name ?? id}</div>
    <ul>
      ${list.map(
        (u) =>
          html`<li>
            ${t.kind[u.kind]} - ${u.session}${u.self ? t.selfSong : ""}
            ${u.src ? extLink(u.src, t.source) : nothing}
          </li>`,
      )}
    </ul>
  </li>
`;

export function detail(s: Song, events: Map<string, EventInfo>, autoplay: boolean) {
  const src = embedUrl(s, autoplay);
  const kinds = KINDS.filter((k) => s.stats.byKind[k])
    .map((k) => `${t.kind[k]} ${s.stats.byKind[k]}`)
    .join(", ");
  // 행사별로 묶어서 최근 행사부터
  const byEvent = [...Map.groupBy(s.uses, (u) => u.ev)].sort(([a], [b]) =>
    (events.get(b)?.from ?? "").localeCompare(events.get(a)?.from ?? ""),
  );
  const links = [
    s.yt && extLink(`https://www.youtube.com/watch?v=${s.yt}`, "YouTube"),
    s.nico && extLink(`https://www.nicovideo.jp/watch/${s.nico}`, t.nico),
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
          : html`<p class="no-video">${t.noVideo}</p>`
      }
    </div>
    <div class="detail-body">
      <h2 id="detail-title">${displayTitle(s)}</h2>
      ${
        subTitle(s)
          ? html`<p class="title-ja">
              ${subTitle(s)}${s.titleKoUnverified ? t.koTitleUnverified : ""}
            </p>`
          : nothing
      }
      <p class="meta">
        ${[s.producer.join(", "), vocalShort(s, 8), s.pub && t.published(fmt(s.pub))]
          .filter(Boolean)
          .join(" - ")}
      </p>
      <p class="badges">${badgeText(s)}${kinds ? ` (${kinds})` : ""}</p>
      ${s.why ? html`<p class="why">${s.why}</p>` : nothing}
      <h3>${t.usedAt}</h3>
      <ol class="uses">
        ${
          byEvent.length
            ? byEvent.map(([id, list]) => useItem(events.get(id), id, list))
            : html`<li class="empty">${t.noUses}</li>`
        }
      </ol>
      <p class="links">${links.map((a, i) => html`${i ? ", " : ""}${a}`)}</p>
    </div>
  `;
}

// 지금 목록을 YouTube 임베드의 playlist 파라미터로 이어서 재생한다. 순서와 다음 곡 넘기기는 플레이어가 맡는다.
// 첫 곡도 playlist 에 넣어야 첫 곡부터 재생된다 (안 넣으면 둘째 곡부터 시작함)
// ponytail: YouTube 영상이 있는 앞 199곡까지만. 200곡부터는 플레이어가 아예 뜨지 않는다 (직접 확인).
// 니코동만 있는 곡은 빠진다. 전부 넣으려면 IFrame Player API 로 한 곡씩 넘겨야 한다
export function playlist(songs: Song[]) {
  const list = songs.filter((s) => s.yt).slice(0, 199);
  const ids = list.map((s) => s.yt).join(",");
  const skipped = songs.length - list.length;
  return html`
    <div class="player">
      ${
        list.length
          ? html`<iframe
              src=${`https://www.youtube-nocookie.com/embed/${list[0]?.yt}?autoplay=1&playlist=${ids}`}
              title=${t.playlistTitle}
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowfullscreen
            ></iframe>`
          : html`<p class="no-video">${t.playlistNone}</p>`
      }
    </div>
    <div class="detail-body">
      <h2 id="detail-title">${t.playlistTitle}</h2>
      <p class="meta">${t.playlistCount(list.length, skipped)}</p>
      <ol class="queue">
        ${list.map((s) => html`<li>${displayTitle(s)} - ${s.producer.join(", ")}</li>`)}
      </ol>
    </div>
  `;
}
