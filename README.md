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
│   ├── main.js             데이터 불러오기, 검색·섹션·정렬, 상세 창 열고 닫기
│   ├── views.js            lit-html 템플릿 (카드, 섹션 버튼, 상세 창)
│   ├── format.js           화면에 보일 문자열·URL 만들기
│   └── rules.js            sections.json 규칙 해석
├── public/
│   ├── songs.json          곡 데이터
│   ├── events.json         행사 데이터 (곡 상세의 "쓰인 행사"에 사용)
│   └── sections.json       섹션 정의 (요즘 신곡, 한일 양쪽, 랜플댄 단골 등)
├── scripts/
│   └── build-data.mjs      research/ 조사 결과로 public/songs.json, events.json 생성
├── wrangler.jsonc          Cloudflare Workers 배포 설정
└── research/               행사 셋리 조사 자료 (커밋하지 않음)
```

화면은 [lit-html](https://lit.dev/docs/libraries/standalone-templates/)로 그리고, [Vite](https://vite.dev/)로 빌드합니다.

## 로컬에서 보기

Node.js 20.19 이상이 필요합니다.

```bash
npm install
npm run dev       # 개발 서버 (저장하면 바로 반영)
npm run build     # dist/ 에 배포용 파일 생성
npm run preview   # dist/ 를 배포와 같은 형태로 확인
npm run format    # Prettier로 코드 정리
```

`npm run dev` 후 안내되는 주소(기본 http://localhost:5173)를 열면 됩니다.

## 곡 데이터

`public/songs.json`과 `public/events.json`은 `research/`의 조사 결과로 만듭니다. `research/`는 커밋하지 않으므로 로컬에서 만든 뒤 `public/`의 JSON을 커밋합니다.

```bash
npm run data
```

- 서로 다른 행사 3곳 이상에서 쓰인 곡과, 2곳에서 쓰인 최근 1년 신곡을 올립니다.
- 다시 빌드해도 `songs.json`에 직접 적은 `tags`, `why`는 `id` 기준으로 그대로 남습니다.
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
  ],
  "tags": [],
  "why": "추천 근거 한 줄"
}
```

| 필드                | 설명                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| `id`                | VocaDB 곡 ID. 곡을 구분하는 key이고 공유 링크(`#song-920272`)에도 씀  |
| `title` / `titleKo` | 원제 / 한국어 제목 (`titleKoUnverified: true`면 임시 번역)            |
| `producer`, `vocal` | 작곡가(P), 보컬 음원                                                  |
| `pub`               | VocaDB 기준 발표일                                                    |
| `yt`, `nico`        | YouTube·니코동 영상 ID. 썸네일과 상세 창 임베드에 사용 (YouTube 우선) |
| `stats`             | 쓰인 행사 수 (`events` 전체, `kr` 한국, `jp` 일본, `byKind` 종류별)   |
| `uses`              | 쓰인 기록. `ev`는 `events.json`의 행사 ID                             |
| `tags`              | 직접 붙이는 분류 key (예: `pick`). 빌드해도 유지                      |
| `why`               | 추천 근거. 빌드해도 유지                                              |

## 에디터 픽 넣기

`public/songs.json`에 곡을 하나 추가하고 `tags`에 `"pick"`을 넣으면 "에디터 픽" 섹션에 나옵니다. 추천 이유(`why`)는 비워 둬도 됩니다. 행사 기록이 없는 곡도 됩니다.

- `id`는 VocaDB 곡 ID입니다. YouTube 영상 ID로 `https://vocadb.net/api/songs/byPv?pvService=Youtube&pvId=영상ID`를 열면 찾을 수 있습니다.
- 행사 기록이 없으면 `stats`는 `{ "events": 0, "kr": 0, "jp": 0, "byKind": {} }`, `uses`는 `[]`로 둡니다.
- `npm run data`를 다시 돌려도 `tags`가 있는 곡은 지워지지 않습니다. 이미 집계에 있는 곡이면 `tags`에 `"pick"`만 추가해도 됩니다.

## 섹션 추가하기

`public/sections.json`에 항목을 추가하면 섹션 버튼이 생깁니다. 버튼 순서는 배열 순서와 같고, "전체"는 항상 맨 앞에 붙습니다. `where`의 모든 조건을 만족하는 곡만 보여 줍니다.

```json
{
  "key": "pick",
  "title": "에디터 픽",
  "desc": "직접 고른 곡",
  "where": { "tags": "pick" },
  "sort": "-stats.events"
}
```

- 조건 값: `">=3"`, `"<=2"`, `">=2026-01-01"`, `">=@1y"`(오늘부터 1년 전), `"pick"`(같음. 배열 필드면 포함 여부)
- 필드는 점으로 이어 씁니다: `stats.kr`, `stats.byKind.랜플댄`
- `sort`: 필드 이름, 앞에 `-`를 붙이면 큰 값부터

곡을 누르면 상세 창이 열립니다. 영상은 상세 창을 열 때만 불러오고, 창을 닫으면 멈춥니다.

## 배포

Cloudflare Workers(정적 파일만)로 배포합니다. 저장소가 Cloudflare Workers Builds에 연결되어 있어서 `main`에 push하면 자동으로 빌드·배포됩니다.

| 항목          | 값                    |
| ------------- | --------------------- |
| 빌드 명령     | `npm run build`       |
| 배포 명령     | `npx wrangler deploy` |
| 루트 디렉터리 | `/`                   |

- 배포 설정은 `wrangler.jsonc`에 있습니다. `dist/`의 파일만 올라갑니다.
- 커스텀 도메인(예: `vocaro.witch.work`)은 Cloudflare 대시보드의 Worker → Settings → Domains & Routes에서 추가하거나, `wrangler.jsonc`의 `routes` 주석을 풀어서 설정합니다.
- 로컬에서 직접 배포하려면 `npx wrangler login` 후 `npm run deploy`를 실행합니다.
