# AGENTS.md

## プロジェクト概要
- MangaShelf のフロントエンドは `frontend/` 配下（Vite + React + TypeScript + Tailwind）
- 現在リポジトリにはバックエンド実装はない

## 主要コマンド
`frontend/` で実行。
- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run format`
- `npm run format:check`
- `npm run typecheck`

## 設計方針
- 初学者が追える読みやすさを重視する
- UI は関数コンポーネント + hooks で組み立てる
- スタイリングは Tailwind を基本とし、グローバル CSS は `frontend/src/index.css` に限定する
- アイコンは `lucide-react`、アニメーションは `motion/react` を使う
- 再利用コンポーネントは `frontend/src/components/`、Figma 由来は `frontend/src/components/figma/` に置く
- `docs/requirements.md` の必須要件（検索・絞り込み・アプリ化）を優先する
- `docs/tech-selection.md` は将来の方針。実装と不一致がある場合は現行コードを優先する

## ドキュメント更新
- ファイルやディレクトリを追加・変更した場合は `README.md` の「ディレクトリ構造」「構成説明」「技術スタック」に追記・更新する
