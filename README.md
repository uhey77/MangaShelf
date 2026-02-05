## ディレクトリ構造

```text
.
├── .github/
│   └── ISSUE_TEMPLATE/
│       ├── epic.md
│       ├── story.md
│       └── task.md
├── backend/
│   ├── data/
│   │   └── library.json
│   ├── pyproject.toml
│   ├── src/
│   │   ├── main.py
│   │   ├── application/
│   │   │   ├── __init__.py
│   │   │   ├── commands/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── delete_library_item.py
│   │   │   │   └── upsert_library_item.py
│   │   │   └── queries/
│   │   │       ├── __init__.py
│   │   │       ├── get_library.py
│   │   │       ├── rank_search_results.py
│   │   │       └── search_books.py
│   │   ├── domain/
│   │   │   ├── __init__.py
│   │   │   ├── errors.py
│   │   │   ├── models.py
│   │   │   ├── repositories.py
│   │   │   ├── search.py
│   │   │   └── services.py
│   │   ├── infrastructure/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   ├── persistence/
│   │   │   │   ├── __init__.py
│   │   │   │   └── json_library_repository.py
│   │   │   └── search/
│   │   │       ├── __init__.py
│   │   │       ├── composite_search_service.py
│   │   │       ├── google_books_service.py
│   │   │       ├── ndl_opensearch_service.py
│   │   │       └── rakuten_books_service.py
│   │   └── presentation/
│   │       ├── __init__.py
│   │       ├── api.py
│   │       ├── dependencies.py
│   │       ├── schemas.py
│   │       └── routers/
│   │           ├── __init__.py
│   │           ├── health.py
│   │           ├── library.py
│   │           └── search.py
│   └── uv.lock
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
│       ├── domain/
│       │   ├── entities/
│       │   │   └── MangaSeries.ts
│       │   ├── repositories/
│       │   │   ├── LibraryRepository.ts
│       │   │   └── SearchRepository.ts
│       │   └── search.ts
│       ├── application/
│       │   ├── commands/
│       │   │   ├── DeleteLibraryItem.ts
│       │   │   └── UpsertLibraryItem.ts
│       │   └── queries/
│       │       ├── GetLibrary.ts
│       │       └── SearchBooks.ts
│       ├── infrastructure/
│       │   ├── di/
│       │   │   └── createAppContainer.ts
│       │   ├── http/
│       │   │   └── fetchJson.ts
│       │   ├── mappers/
│       │   │   └── libraryMapper.ts
│       │   └── repositories/
│       │       ├── LibraryApiRepository.ts
│       │       └── SearchApiRepository.ts
│       ├── presentation/
│       │   ├── hooks/
│       │   │   ├── useLibrary.ts
│       │   │   └── useSearch.ts
│       │   ├── providers/
│       │   │   └── AppProvider.tsx
│       │   ├── utils/
│       │   │   └── formatters.ts
│       │   └── App.tsx
│       ├── components/
│       │   └── figma/
│       │       └── ImageWithFallback.tsx
│       ├── main.tsx
│       └── index.css
├── skills/
│   └── .gitkeep
├── .gitignore
├── AGENTS.md
├── Taskfile.yml
├── .sops.yaml
└── README.md
```

`node_modules/`, `.venv/`, `.mypy_cache/`, `.git/` は自動生成のため省略しています。
`backend/pyproject.toml` には Ruff/ty の開発ツール設定を追加しています。


## 構成説明

| パス | 説明 |
| --- | --- |
| `.github/` | GitHub 関連の設定ファイルを配置するディレクトリ。 |
| `.github/ISSUE_TEMPLATE/` | Issue テンプレートを格納するディレクトリ。 |
| `.github/ISSUE_TEMPLATE/epic.md` | Epic 用の Issue テンプレート。 |
| `.github/ISSUE_TEMPLATE/story.md` | Story 用の Issue テンプレート。 |
| `.github/ISSUE_TEMPLATE/task.md` | Task 用の Issue テンプレート。 |
| `backend/` | Python のバックエンド API。 |
| `backend/data/` | 本棚データの保存先。 |
| `backend/data/library.json` | 本棚データのサンプルと保存ファイル。 |
| `backend/pyproject.toml` | バックエンドの依存関係定義。Ruff/ty の開発ツール設定を含む。 |
| `backend/uv.lock` | uv のロックファイル。 |
| `backend/src/` | バックエンドのソースコード。 |
| `backend/src/main.py` | FastAPI のエントリポイント。 |
| `backend/src/application/` | アプリケーション層（ユースケース）。 |
| `backend/src/application/__init__.py` | アプリケーション層のパッケージ定義。 |
| `backend/src/application/commands/` | コマンド（書き込みユースケース）。 |
| `backend/src/application/commands/__init__.py` | コマンド層のパッケージ定義。 |
| `backend/src/application/commands/delete_library_item.py` | 所持データ削除コマンド。 |
| `backend/src/application/commands/upsert_library_item.py` | 所持データ追加・更新コマンド。 |
| `backend/src/application/queries/` | クエリ（読み取りユースケース）。 |
| `backend/src/application/queries/__init__.py` | クエリ層のパッケージ定義。 |
| `backend/src/application/queries/get_library.py` | 所持データ取得クエリ。 |
| `backend/src/application/queries/rank_search_results.py` | 検索結果のランキングを行うユースケース。 |
| `backend/src/application/queries/search_books.py` | 検索ユースケース。 |
| `backend/src/domain/` | ドメイン層（エンティティ・リポジトリIF）。 |
| `backend/src/domain/__init__.py` | ドメイン層のパッケージ定義。 |
| `backend/src/domain/errors.py` | ドメイン例外定義。 |
| `backend/src/domain/models.py` | ドメインモデル。 |
| `backend/src/domain/repositories.py` | リポジトリ抽象。 |
| `backend/src/domain/search.py` | 検索ドメインの型（検索期間は `date`）。 |
| `backend/src/domain/services.py` | ドメインサービス抽象。 |
| `backend/src/infrastructure/` | インフラ層（外部API・永続化）。 |
| `backend/src/infrastructure/__init__.py` | インフラ層のパッケージ定義。 |
| `backend/src/infrastructure/config.py` | 設定読み込み。 |
| `backend/src/infrastructure/persistence/` | 永続化アダプタ。 |
| `backend/src/infrastructure/persistence/__init__.py` | 永続化層のパッケージ定義。 |
| `backend/src/infrastructure/persistence/json_library_repository.py` | JSON ファイル永続化。 |
| `backend/src/infrastructure/search/` | 外部検索アダプタ。 |
| `backend/src/infrastructure/search/__init__.py` | 検索アダプタのパッケージ定義。 |
| `backend/src/infrastructure/search/composite_search_service.py` | 複数の検索ソースを統合するサービス。 |
| `backend/src/infrastructure/search/google_books_service.py` | Google Books API 連携。 |
| `backend/src/infrastructure/search/ndl_opensearch_service.py` | NDL OpenSearch 連携。 |
| `backend/src/infrastructure/search/rakuten_books_service.py` | 楽天ブックス API 連携。 |
| `backend/src/presentation/` | プレゼンテーション層（API）。 |
| `backend/src/presentation/__init__.py` | API 層のパッケージ定義。 |
| `backend/src/presentation/api.py` | FastAPI アプリ生成。 |
| `backend/src/presentation/dependencies.py` | DI 依存解決。 |
| `backend/src/presentation/schemas.py` | API スキーマ定義。 |
| `backend/src/presentation/routers/` | API ルータ群。 |
| `backend/src/presentation/routers/__init__.py` | ルータパッケージ定義。 |
| `backend/src/presentation/routers/health.py` | ヘルスチェック。 |
| `backend/src/presentation/routers/library.py` | 本棚 API。 |
| `backend/src/presentation/routers/search.py` | 検索 API。 |
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
| `frontend/src/` | React アプリのソースコード（DDD/CQRS 構成）。 |
| `frontend/src/domain/` | ドメイン層（エンティティ・リポジトリIF）。 |
| `frontend/src/domain/entities/` | ドメインエンティティ定義。 |
| `frontend/src/domain/repositories/` | リポジトリ抽象。 |
| `frontend/src/domain/search.ts` | 検索クエリ・検索結果の型。 |
| `frontend/src/application/` | アプリケーション層（ユースケース）。 |
| `frontend/src/application/commands/` | コマンド（書き込みユースケース）。 |
| `frontend/src/application/queries/` | クエリ（読み取りユースケース）。 |
| `frontend/src/infrastructure/` | インフラ層（API 連携・DTO 変換）。 |
| `frontend/src/infrastructure/di/` | フロントエンドの DI 構成。 |
| `frontend/src/infrastructure/http/` | fetch 共通処理。 |
| `frontend/src/infrastructure/mappers/` | API DTO とドメイン型の変換。 |
| `frontend/src/infrastructure/repositories/` | API 実装リポジトリ。 |
| `frontend/src/presentation/` | プレゼンテーション層（UI）。 |
| `frontend/src/presentation/App.tsx` | 画面全体のメインコンポーネント。 |
| `frontend/src/presentation/hooks/` | UI 向け hooks。 |
| `frontend/src/presentation/providers/` | DI コンテナの Provider。 |
| `frontend/src/presentation/utils/` | 表示用ユーティリティ。 |
| `frontend/src/components/` | UI コンポーネント群。 |
| `frontend/src/components/figma/` | Figma 由来の部品を置くディレクトリ。 |
| `frontend/src/components/figma/ImageWithFallback.tsx` | 画像読み込み失敗時のフォールバック付き画像コンポーネント。 |
| `frontend/src/main.tsx` | React のエントリポイント。 |
| `frontend/src/index.css` | Tailwind の読み込みを含むグローバル CSS。 |
| `skills/` | Codex 用のスキルディレクトリ。 |
| `skills/.gitkeep` | 空ディレクトリ維持用ファイル。 |
| `.gitignore` | Git の追跡対象外を定義。 |
| `AGENTS.md` | Codex エージェント向けの作業指示。 |
| `Taskfile.yml` | タスクランナー（Task）用のコマンド定義。 |
| `.sops.yaml` | sops 用の暗号化設定。 |
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
| バックエンド | Python | API 実装 | FastAPI で構築 |
| バックエンド | FastAPI | Web API | `/api` を提供 |
| バックエンド | requests | 外部検索 | NDL OpenSearch / 楽天ブックス API / Google Books API を利用 |
| バックエンド | python-dotenv | 環境変数読込 | `.env` をロード |
| バックエンド | datetime (標準ライブラリ) | 日付型 | 検索期間に `date` を利用 |
| バックエンド開発ツール | Ruff | リント/フォーマット | Python 向け |
| バックエンド開発ツール | ty | 型チェック | Python 向け |
| 設計 | DDD / Clean / Onion / CQRS | 層分離 | バックエンド構成指針 |
| 開発ツール | uv | Python 環境 | 仮想環境と依存関係管理 |
| 開発ツール | Task (go-task) | タスクランナー | 開発コマンドの集約 |
| 開発ツール | sops + age | 機密管理 | `.env.enc` の暗号化 |


## コード設計の思想

MangaShelf は保守性と学びやすさを重視し、バックエンドと同様にフロントエンドでも DDD / クリーンアーキテクチャ / オニオンアーキテクチャ / CQRS を意識した層構造を採用しています。

- **依存方向は内向き**: `presentation` → `application` → `domain` の依存だけを許容し、`domain` は外部実装に依存しません。
- **CQRS の分離**: 読み取りは `application/queries`、書き込みは `application/commands` に分割し、UI 側の責務を明確化しています。
- **DTO 変換の集中**: API 由来の DTO とドメイン型の変換は `infrastructure/mappers` に集約します。
- **インフラの差し替え容易性**: `domain/repositories` の抽象に対して `infrastructure/repositories` が実装を持ちます。
- **UI は薄く、hooks に集約**: 状態管理やユースケース呼び出しは `presentation/hooks` にまとめ、UI は描画に専念します。
- **DI による組み立て**: `infrastructure/di` でリポジトリとユースケースを組み立て、`presentation/providers` から注入します。

## .env.enc の運用

- `backend/.env.enc` を暗号化ファイルとして管理し、起動時に自動復号します。
- `backend/.env` は復号後に生成され、Git 管理対象外です。

### 初期セットアップ

1. age の鍵を用意し、`.sops.yaml` の `age` に公開鍵を設定する。
2. `backend/.env` を用意する。
3. 暗号化:

```bash
task env:encrypt
```

### 開発時の起動

`task backend:dev` 実行時に `.env.enc` が自動復号されます。
