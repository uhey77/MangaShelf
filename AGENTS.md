# AGENTS.md

## 応答方針
- 回答は日本語で行うこと。

## プロジェクト概要
- MangaShelf のフロントエンドは `frontend/` 配下（Vite + React + TypeScript + Tailwind）
- MangaShelf のバックエンドは `backend/` 配下（Python + FastAPI）

## 主要コマンド
リポジトリ直下で実行。
- `task -l`
- `task check`
- `task frontend:install`
- `task frontend:dev`
- `task frontend:build`
- `task frontend:preview`
- `task frontend:lint`
- `task frontend:format`
- `task frontend:format-check`
- `task frontend:typecheck`
- `task frontend:check`
- `task backend:install`
- `task backend:dev`
- `task backend:lint`
- `task backend:format`
- `task backend:format-check`
- `task backend:typecheck`
- `task backend:check`

## 設計方針
- 初学者が追える読みやすさを重視する
- UI は関数コンポーネント + hooks で組み立てる
- スタイリングは Tailwind を基本とし、グローバル CSS は `frontend/src/index.css` に限定する
- アイコンは `lucide-react`、アニメーションは `motion/react` を使う
- 再利用コンポーネントは `frontend/src/components/`、Figma 由来は `frontend/src/components/figma/` に置く
- `docs/requirements.md` の必須要件（検索・絞り込み・アプリ化）を優先する
- `docs/tech-selection.md` は将来の方針。実装と不一致がある場合は現行コードを優先する
- バックエンドは FastAPI をベースにし、`uv` で依存関係を管理する

## コード設計の思想
- DDD / クリーンアーキテクチャ / オニオンアーキテクチャ / CQRS を意識し、層を分離する
- 依存方向は内向き（`presentation` → `application` → `domain`）で保つ
- 読み取りは `application/queries`、書き込みは `application/commands` に分離する
- API DTO とドメイン型の変換は `infrastructure/mappers` に集約する
- リポジトリの抽象は `domain/repositories` に置き、実装は `infrastructure/repositories` に置く
- UI は薄く保ち、ユースケース呼び出しと状態管理は `presentation/hooks` に集約する
- `infrastructure/di` でユースケースを組み立て、`presentation/providers` で注入する

## ドキュメント更新
- ファイルやディレクトリを追加・変更した場合は `README.md` の「ディレクトリ構造」「構成説明」「技術スタック」に追記・更新する
