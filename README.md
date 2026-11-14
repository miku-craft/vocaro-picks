# 보카로 트렌드

오타쿠 랜덤플레이댄스를 보다가 이런 행사에 나오는 곡들은 웰노운이고 좋은 곡들이라는 생각이 들었습니다.

그래서 여러 행사들에 나오는 곡들을 조사해서 리스트를 만들어봤습니다.

복잡한 구조보다는 우선 `songs.json`만 잘 관리하면 그걸 적절히 보여주도록 개발했습니다.

## 구조

```
vocaro-picks/
├── index.html              페이지 뼈대 (헤더, 목록 자리, 상세 창)
├── style.css               스타일 (라이트/다크 모드 자동 전환)
├── src/
│   ├── main.ts             데이터 불러오기, 검색, 섹션, 정렬, 상세 창 열고 닫기
│   ├── views.ts            lit-html 템플릿 (카드, 섹션 버튼, 상세 창, 연속 재생)
│   ├── format.ts           화면에 보일 문자열과 URL 만들기
│   ├── i18n.ts             화면 문구 (한국어, 일본어)
│   ├── sections.ts         섹션 정의와 정렬 방법 (요즘 신곡, 랜플댄 단골 등)
│   ├── picks.ts            picks.json 을 곡 목록에 합치기
│   └── types.ts            데이터 타입 (Song, EventInfo, Section)
├── public/
│   ├── songs.json          곡 데이터
│   └── events.json         행사 데이터 (곡 상세의 "쓰인 행사"에 사용)
├── .github/workflows/
│   └── check.yml           PR, main 푸시마다 린트와 빌드(타입 검사 포함)
├── scripts/
│   └── build-data.ts       research/ 조사 결과로 public/songs.json, events.json 생성
├── picks.json              노점상 추천 곡 (PR은 여기에)
├── wrangler.jsonc          Cloudflare Workers 배포 설정
└── research/               행사 셋리 조사 자료 (커밋하지 않음)
```

TypeScript로 작성했습니다. 화면은 [lit-html](https://lit.dev/docs/libraries/standalone-templates/)로 그리고 [Vite](https://vite.dev/)로 빌드합니다.

## 로컬에서 보기

Node.js 22.18 이상이 필요합니다. (`scripts/build-data.ts`를 Node가 바로 실행합니다.)

```bash
npm install
npm run dev       # 개발 서버 (저장하면 바로 반영)
npm run build     # dist/ 에 배포용 파일 생성
npm start         # dist/ 를 배포와 같은 형태로 확인
npm run typecheck # TypeScript 타입 검사 (build 때도 실행)
npm run lint      # oxlint로 코드 검사
npm run format    # oxfmt로 코드 정리
```

`npm run dev` 후 안내되는 주소(기본 http://localhost:5173)를 열면 됩니다.

## 곡 데이터

`public/songs.json`과 `public/events.json`은 `research/`의 조사 결과로 만듭니다. `research/`는 커밋하지 않으므로 로컬에서 만든 뒤 `public/`의 JSON을 커밋합니다.

```bash
npm run data
```

- 서로 다른 행사 3곳 이상에서 쓰인 곡과, 2곳에서 쓰인 최근 1년 신곡을 올립니다.
- `picks.json`에 있는 곡은 행사 수가 기준에 못 미쳐도 집계에 있으면 행사 기록과 함께 올립니다.
- 조사 방법과 기준은 `research/method.md`, `research/tally.md`에 있습니다.

```json
{
  "id": 920272,
  "title": "ブレインロット",
  "titleKo": "브레인롯",
  "producer": ["東京真中"],
  "vocal": ["重音テトSV2"],
  "pub": "2026-02-21",
  "yt": "UsjsYMo3O1Q",
  "nico": "sm46537381",
  "stats": {
    "events": 13,
    "kr": 8,
    "jp": 5,
    "byKind": { "DJ": 6, "랜플댄": 6, "공연": 1 }
  },
  "uses": [
    {
      "ev": "K16",
      "session": "11/8 랜플댄 (몽구 채널 풀캠)",
      "date": "2026-11-08",
      "kind": "랜플댄",
      "src": "https://..."
    }
  ]
}
```

| 필드                | 설명                                                                   |
| ------------------- | ---------------------------------------------------------------------- |
| `id`                | VocaDB 곡 ID. 곡을 구분하는 key이고 공유 링크(`#song-920272`)에도 씀   |
| `title` / `titleKo` | 원제 / 한국어 제목 (`titleKoUnverified: true`면 임시 번역)             |
| `producer`, `vocal` | 작곡가(P), 보컬 음원                                                   |
| `pub`               | VocaDB 기준 발표일                                                     |
| `yt`, `nico`        | YouTube, 니코동 영상 ID. 썸네일과 상세 창 임베드에 사용 (YouTube 우선) |
| `stats`             | 쓰인 행사 수 (`events` 전체, `kr` 한국, `jp` 일본, `byKind` 종류별)    |
| `uses`              | 쓰인 기록. `ev`는 `events.json`의 행사 ID                              |

## 노점상 넣기

노점상은 행사 기록과 상관없이 직접 추천하는 곡입니다. 루트의 `picks.json` 배열에 항목 하나를 추가하면 "노점상" 섹션에 나옵니다. 다른 파일은 건드리지 않아도 됩니다.

```json
{
  "id": 1021673,
  "title": "最高のMVの作りかた",
  "titleKo": "최고의 MV 만드는 법",
  "producer": ["阿修"],
  "vocal": ["初音ミク"],
  "pub": "2026-08-22",
  "yt": "fcVC8FN_Qx8",
  "why": "추천 이유 한 줄"
}
```

| 필드                | 필수 | 설명                                                                                                                  |
| ------------------- | ---- | --------------------------------------------------------------------------------------------------------------------- |
| `id`                | ✓    | VocaDB 곡 ID. YouTube 영상 ID로 `https://vocadb.net/api/songs/byPv?pvService=Youtube&pvId=영상ID`를 열면 찾을 수 있음 |
| `title`             | ✓    | 원제                                                                                                                  |
| `producer`          | ✓    | 작곡가(P) 목록                                                                                                        |
| `titleKo`           |      | 한국어 제목                                                                                                           |
| `titleKoUnverified` |      | 한국어 제목이 임시 번역이면 `true`                                                                                    |
| `vocal`             |      | 보컬 음원 목록                                                                                                        |
| `pub`               |      | 발표일 `YYYY-MM-DD`                                                                                                   |
| `yt`                |      | YouTube 영상 ID. 썸네일, 재생, 목록 연속 재생에 사용                                                                  |
| `nico`              |      | 니코동 영상 ID (`sm...`). `yt`가 없을 때 재생에 사용                                                                  |
| `why`               |      | 추천 이유 한 줄. 카드와 상세 창에 표시                                                                                |

- 이미 집계에 있는 곡이면 행사 기록은 `songs.json` 것을 그대로 쓰고, 노점상 표시와 `why`만 붙습니다.
- `npm run typecheck`로 필드 이름과 타입을 확인할 수 있습니다. PR을 보내면 GitHub Actions가 같은 검사를 자동으로 돌립니다.

## 섹션 추가하기

`src/sections.ts`의 `SECTIONS`에 항목을 추가하면 섹션 버튼이 생깁니다. 버튼 순서는 배열 순서와 같고, "전체"는 항상 맨 앞에 붙습니다. `filter`가 `true`인 곡만 `sort` 순서로 보여 줍니다.

```ts
{
  key: "randplay",
  title: "랜플댄 단골",
  desc: "랜덤플레이댄스 5곳 이상",
  filter: (s) => (s.stats.byKind.랜플댄 ?? 0) >= 5,
  sort: desc((s) => s.stats.byKind.랜플댄 ?? 0),
}
```

- `filter`, `sort`는 일반 함수입니다. 곡(`Song`)의 필드는 `src/types.ts`에 있습니다.
- `desc(값)` / `asc(값)`: 그 값의 큰 순 / 작은 순. 같으면 행사 많은 순으로 한 번 더 정렬합니다.
- 정렬 드롭다운의 항목은 같은 파일의 `SORTS`에 있고, key는 `index.html`의 `<option value>`와 같아야 합니다.

곡을 누르면 상세 창이 열립니다. 영상은 상세 창을 열 때만 불러오고, 창을 닫으면 멈춥니다.

## 언어

화면 문구는 `src/i18n.ts`에 한국어(`ko`)와 일본어(`ja`)로 있습니다. `ko`에 문구를 추가하면 `ja`에도 같은 키를 넣어야 타입 검사를 통과합니다.

- 언어는 주소의 `?lang=ko` / `?lang=ja`로 고르고, 없으면 브라우저 언어가 일본어일 때만 일본어로 보여 줍니다. 오른쪽 위 링크로 바꿀 수 있습니다.
- 일본어 화면에서는 곡 제목을 원제로 보여 줍니다. 행사 이름과 세션 설명은 조사 자료 그대로(대부분 한국어) 나옵니다.

## 배포

Cloudflare Workers(정적 파일만)로 배포합니다. 저장소가 Cloudflare Workers Builds에 연결되어 있어서 `main`에 push하면 자동으로 빌드하고 배포합니다.

| 항목          | 값                    |
| ------------- | --------------------- |
| 빌드 명령     | `npm run build`       |
| 배포 명령     | `npx wrangler deploy` |
| 루트 디렉터리 | `/`                   |

- 배포 설정은 `wrangler.jsonc`에 있습니다. `dist/`의 파일만 올라갑니다.
- 주소는 https://vocaro.witch.work 입니다. 도메인과 `workers.dev` 사용 여부는 `wrangler.jsonc`에서 관리합니다. 대시보드에서 바꾸면 다음 배포 때 `wrangler.jsonc` 값으로 돌아갑니다.
- 로컬에서 직접 배포하려면 `npx wrangler login` 후 `npm run deploy`를 실행합니다.
