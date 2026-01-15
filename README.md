# G-Note: Global Folder Manager

ワークスペースに依存せず、任意のフォルダをサイドバーで一元管理できるVSCode拡張機能です。

## 機能

- **グローバルフォルダ管理**: 複数のフォルダを登録し、どのワークスペースからでもアクセス可能
- **ファイル操作**: 新規作成、名前変更、削除をツリービューから直接実行
- **永続化**: 登録したフォルダはVSCodeを再起動しても保持
- **安全機能**: 削除時の確認ダイアログ、ファイル名の予約文字チェック

## インストール

### 開発版として実行
1. このリポジトリをクローン
2. `npm install` で依存関係をインストール
3. VSCodeでフォルダを開く
4. `F5` キーでExtension Development Hostを起動

### VSIXからインストール
```bash
npm run compile
npx vsce package
code --install-extension g-note-0.1.0.vsix
```

## 使い方

### フォルダの登録
1. サイドバーの「G-Note」アイコンをクリック
2. ツールバーの `+` ボタンをクリック
3. 登録したいフォルダを選択

### ファイル/フォルダ操作
ツリービューで右クリックしてコンテキストメニューから操作:

| 操作 | 説明 |
|------|------|
| New File... | 新規ファイル作成 |
| New Folder... | 新規フォルダ作成 |
| Rename... | 名前変更 |
| Delete... | 削除（確認あり） |
| Reveal in File Explorer | OSのファイルエクスプローラで開く |
| Remove Folder from List | 登録解除（ルートフォルダのみ） |
| Refresh | 表示を更新 |

## コマンド一覧

| コマンド | 説明 |
|----------|------|
| `G-Note: Add Folder` | フォルダを登録 |
| `G-Note: Remove Folder` | フォルダを登録解除 |
| `G-Note: New File` | 新規ファイル作成 |
| `G-Note: New Folder` | 新規フォルダ作成 |
| `G-Note: Rename` | 名前変更 |
| `G-Note: Delete` | 削除 |
| `G-Note: Refresh` | 表示を更新 |

## 技術仕様

- **永続化**: `globalState` に登録フォルダを保存
- **ログ出力**: Output Channel「G-Note」に詳細ログを出力
- **ファイル名検証**: Windows予約文字 (`<>:"/\|?*`) のチェック

## 将来の機能（予定）

- [ ] ドラッグ&ドロップによる移動/コピー
- [ ] 複数選択
- [ ] ファイル内検索
- [ ] フォルダのエイリアス（表示名）設定
- [ ] 自動更新（ファイルウォッチ）
- [ ] 国際化（i18n）

## 開発

```bash
# 依存関係インストール
npm install

# コンパイル
npm run compile

# ウォッチモード
npm run watch

# Lint
npm run lint

# フォーマット
npm run format
```

## ライセンス

MIT
