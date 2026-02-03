## ディレクトリ構造

```text
.
├── .github/
│   └── ISSUE_TEMPLATE/
│       ├── epic.md
│       ├── story.md
│       └── task.md
├── docs/
│   ├── requirements.md
│   └── tech-selection.md
├── frontend/
│   ├── index.html
│   ├── .eslintrc.cjs
│   ├── .prettierrc.cjs
│   ├── .prettierignore
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.cjs
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       └── components/
│           └── figma/
│               └── ImageWithFallback.tsx
├── .gitignore
└── README.md
```

`frontend/node_modules/` はツリーから省略しています。

## 構成説明

| パス | 説明 |
| --- | --- |
| `.github/` | GitHub 関連の設定ファイルを配置するディレクトリ。 |
| `.github/ISSUE_TEMPLATE/` | Issue テンプレートを格納するディレクトリ。 |
| `.github/ISSUE_TEMPLATE/epic.md` | Epic 用の Issue テンプレート。 |
| `.github/ISSUE_TEMPLATE/story.md` | Story 用の Issue テンプレート。 |
| `.github/ISSUE_TEMPLATE/task.md` | Task 用の Issue テンプレート。 |
| `docs/` | 仕様・検討資料などのドキュメントを置くディレクトリ。 |
| `docs/requirements.md` | 要件定義のメモ。 |
| `docs/tech-selection.md` | 技術選定の理由・方針。 |
| `frontend/` | フロントエンド（Vite + React + Tailwind）のルート。 |
| `frontend/index.html` | Vite のエントリ HTML。 |
| `frontend/.eslintrc.cjs` | ESLint 設定。 |
| `frontend/.prettierrc.cjs` | Prettier 設定。 |
| `frontend/.prettierignore` | Prettier の除外設定。 |
| `frontend/package.json` | フロントエンドの依存関係とスクリプト定義。 |
| `frontend/package-lock.json` | npm のロックファイル。 |
| `frontend/postcss.config.cjs` | PostCSS 設定。 |
| `frontend/tailwind.config.ts` | Tailwind CSS 設定。 |
| `frontend/tsconfig.json` | フロントエンドの TypeScript 設定。 |
| `frontend/tsconfig.node.json` | Vite 設定向けの TypeScript 設定。 |
| `frontend/vite.config.ts` | Vite の設定。 |
| `frontend/src/` | React アプリのソースコード。 |
| `frontend/src/App.tsx` | 画面全体のメインコンポーネント。 |
| `frontend/src/main.tsx` | React のエントリポイント。 |
| `frontend/src/index.css` | Tailwind の読み込みを含むグローバル CSS。 |
| `frontend/src/components/` | UI コンポーネント群。 |
| `frontend/src/components/figma/` | Figma 由来の部品を置くディレクトリ。 |
| `frontend/src/components/figma/ImageWithFallback.tsx` | 画像読み込み失敗時のフォールバック付き画像コンポーネント。 |
| `.gitignore` | Git の追跡対象外を定義。 |
| `README.md` | リポジトリの概要と構成説明。 |

## 技術スタック

| 区分 | 技術 | 用途 | 備考 |
| --- | --- | --- | --- |
| フロントエンド | React | UI 構築 | 関数コンポーネントを利用 |
| フロントエンド | TypeScript | 型安全な実装 | JSX/TSX を採用 |
| フロントエンド | Vite | 開発サーバー/ビルド | 高速な HMR |
| フロントエンド | Tailwind CSS | スタイリング | ユーティリティクラス |
| フロントエンド | PostCSS | CSS 変換 | Autoprefixer と併用 |
| フロントエンド | Autoprefixer | ベンダープレフィックス付与 | PostCSS プラグイン |
| フロントエンド | ESLint | リント | コード品質チェック |
| フロントエンド | Prettier | フォーマッター | コード整形 |
| フロントエンド | lucide-react | アイコン | Lucide の React 実装 |
| フロントエンド | motion | アニメーション | Framer Motion ベース |
