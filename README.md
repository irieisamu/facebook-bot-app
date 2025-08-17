# Facebook ボット管理アプリ

Facebook ページからのメッセージを受信し、アプリ側で表示・返信できる Web アプリケーションです。

## 🚀 機能

- **メッセージ受信**: Facebook ページからのメッセージを Webhook で受信
- **メッセージ表示**: 受信したメッセージを管理画面で確認
- **メッセージ返信**: ユーザーへの返信メッセージを送信
- **新規送信**: 特定のユーザー ID に対して新しいメッセージを送信
- **設定管理**: Webhook 設定とアプリ設定の確認

## 📋 前提条件

- **Node.js** (v18 以上)
- **Python** (v3.8 以上)
- **Facebook Developer Account**
- **Facebook ページ** (メッセンジャー機能が有効)
- **ngrok** (開発環境でのローカル公開用)

## 🛠️ セットアップ

### 1. ngrok のインストールと設定

#### 1.1. ngrok のインストール

**macOS (Homebrew):**
```bash
brew install ngrok
```

**macOS (手動インストール):**
```bash
# ngrok公式サイトからダウンロード
# https://ngrok.com/download
# ダウンロードしたファイルを解凍してPATHに追加
```

**Windows:**
```bash
# Chocolateyを使用
choco install ngrok

# または公式サイトからダウンロード
# https://ngrok.com/download
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install ngrok

# または公式サイトからダウンロード
# https://ngrok.com/download
```

#### 1.2. ngrok アカウントの設定

1. [ngrok公式サイト](https://ngrok.com/) でアカウントを作成
2. ダッシュボードから認証トークンを取得
3. 認証トークンを設定：

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

#### 1.3. ngrok の動作確認

```bash
# テスト用のHTTPサーバーを起動
python -m http.server 8000

# 別のターミナルでngrokを起動
ngrok http 8000
```

正常に動作すると、以下のような画面が表示されます：

```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       51ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:8000
```

### 2. 環境変数の設定

#### バックエンド用 (.env)

`backend/.env` ファイルを作成し、以下の内容を設定してください：

```env
# Facebook API設定
FB_VERIFY_TOKEN=your-verify-token-here
FB_PAGE_ACCESS_TOKEN=your-page-access-token-here

# サーバー設定
HOST=0.0.0.0
PORT=8000
```

#### フロントエンド用 (.env.local)

`frontend/.env.local` ファイルを作成し、以下の内容を設定してください：

```env
# Facebook API設定
FB_PAGE_ACCESS_TOKEN=your-page-access-token-here

# Next.js設定
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Facebook Developer Console での設定

#### 3.1. アプリの作成

1. [Facebook Developer Console](https://developers.facebook.com/) にアクセス
2. 「マイアプリ」→「アプリを作成」をクリック
3. 「その他」を選択し、アプリ名を入力
4. アプリを作成

#### 3.2. Messenger 製品の追加

1. 作成したアプリのダッシュボードで「製品を追加」をクリック
2. 「Messenger」を検索して追加
3. 「設定」をクリック

#### 3.3. ページの接続

1. 「ページを追加」をクリック
2. 管理している Facebook ページを選択
3. ページアクセストークンを生成（後で使用）

#### 3.4. Webhook の設定

1. **ngrok でローカル環境を公開**（重要）：
   ```bash
   # バックエンドを起動した後、新しいターミナルで
   ngrok http 8000
   ```
   
2. 生成された URL をコピー（例：`https://abc123.ngrok.io`）

3. Facebook Developer Console で：
   - 「Webhook」セクションで「Webhook を設定」をクリック
   - **コールバック URL**: `https://abc123.ngrok.io/webhook`
   - **検証トークン**: `.env`ファイルで設定した `FB_VERIFY_TOKEN`
   - 「検証して保存」をクリック

4. **購読フィールド**で以下を選択：
   - `messages`
   - `messaging_postbacks`
   - `messaging_optins`

#### 3.5. アクセストークンの取得

1. 「ページアクセストークン」セクションで「トークンを生成」をクリック
2. 生成されたトークンをコピー
3. `.env`ファイルの `FB_PAGE_ACCESS_TOKEN` に設定

### 4. アプリの起動

#### バックエンドの起動

```bash
# バックエンドディレクトリに移動
cd backend

# 依存関係のインストール
pip install -r requirements.txt

# サーバーの起動
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

バックエンドは `http://localhost:8000` で起動します。

#### フロントエンドの起動

新しいターミナルウィンドウで：

```bash
# フロントエンドディレクトリに移動
cd frontend

# 依存関係のインストール
yarn install

# 開発サーバーの起動
yarn run dev
```

フロントエンドは `http://localhost:3000` で起動します。

#### ngrok の起動

バックエンドが起動した後、新しいターミナルウィンドウで：

```bash
ngrok http 8000
```

## 📱 使用方法

### 1. ダッシュボード

アプリにアクセスすると、以下の機能が利用できます：

- **メッセージ管理**: 受信メッセージの確認と返信
- **メッセージ送信**: 新しいメッセージの送信
- **設定**: Webhook 設定とアプリ設定の確認

### 2. メッセージ管理

1. 「メッセージを確認」をクリック
2. 左側の送信者一覧からユーザーを選択
3. メッセージ履歴を確認
4. 下部のフォームで返信を入力
5. 「送信」ボタンで返信

### 3. 新規メッセージ送信

1. 「メッセージを送信」をクリック
2. 送信先 ID（PSID）を入力
3. メッセージ内容を入力
4. 「メッセージを送信」ボタンで送信

## 🔧 技術スタック

### フロントエンド

- **Next.js 15.4.6**: React フレームワーク
- **TypeScript**: 型安全性
- **Tailwind CSS**: スタイリング
- **React 19.1.0**: UI ライブラリ

### バックエンド

- **FastAPI**: Python Web フレームワーク
- **Uvicorn**: ASGI サーバー
- **httpx**: HTTP クライアント
- **python-dotenv**: 環境変数管理

### 開発ツール

- **ngrok**: ローカル環境の公開
- **yarn**: パッケージマネージャー

## 📁 プロジェクト構造

```
facebook-bot-app/
├── backend/
│   ├── main.py              # FastAPIアプリケーション
│   ├── requirements.txt     # Python依存関係
│   └── .env                 # 環境変数（要作成）
├── frontend/
│   ├── src/app/
│   │   └── page.tsx         # メインダッシュボード
│   ├── pages/
│   │   ├── messages.tsx     # メッセージ管理ページ
│   │   ├── send.tsx         # メッセージ送信ページ
│   │   ├── settings.tsx     # 設定ページ
│   │   └── api/
│   │       └── send-message.ts  # メッセージ送信API
│   ├── package.json         # Node.js依存関係
│   └── .env.local           # 環境変数（要作成）
└── README.md               # このファイル
```

## 🔒 セキュリティ

- 環境変数は `.env` ファイルで管理
- Facebook API トークンは適切に保護
- Webhook 認証で不正なリクエストを防止
- ngrok は開発環境でのみ使用

## 🐛 トラブルシューティング

### よくある問題

1. **ngrok 関連のエラー**

   - ngrok が起動していない
   - 認証トークンが設定されていない
   - ポートが既に使用されている

   **解決方法:**
   ```bash
   # ngrokの状態確認
   ngrok version
   
   # 認証トークンの確認
   ngrok config check
   
   # 別のポートで試す
   ngrok http 8001
   ```

2. **Webhook 認証エラー**

   - Verify Token が正しく設定されているか確認
   - Facebook Developer Console の設定を確認
   - ngrok URL が正しく設定されているか確認

3. **メッセージ送信エラー**

   - Page Access Token が有効か確認
   - ユーザーが過去にページにメッセージを送信しているか確認
   - 24時間以内にユーザーがページとやり取りしているか確認

4. **環境変数エラー**

   - `.env`ファイルが正しい場所にあるか確認
   - 環境変数の値が正しく設定されているか確認

5. **メッセージが受信されない**

   - ngrok が起動しているか確認
   - Webhook URL が正しく設定されているか確認
   - Facebook ページにメッセージを送信してみる
   - バックエンドのログを確認

### ログの確認

バックエンドのログで詳細なエラー情報を確認できます：

```bash
# バックエンドディレクトリで
uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level debug
```

ngrok の Web インターフェースでリクエストを確認できます：

```bash
# ngrok起動後、ブラウザでアクセス
http://localhost:4040
```

### テスト方法

1. **ngrok のテスト**：
   ```bash
   # テスト用サーバーを起動
   python -m http.server 8000
   
   # ngrokで公開
   ngrok http 8000
   
   # 生成されたURLにアクセスして動作確認
   ```

2. **Webhook のテスト**：
   - Facebook ページにメッセージを送信
   - バックエンドのログで受信確認
   - フロントエンドでメッセージ表示確認

3. **送信のテスト**：
   - 設定ページで送信者 ID を確認
   - メッセージ送信ページでテスト送信

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. ngrok の接続状況
2. Facebook Developer Console の設定
3. 環境変数の設定
4. ネットワーク接続
5. ログファイル

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 🔄 更新履歴

- **v1.0.0**: 初期リリース
  - メッセージ受信・送信機能
  - 管理画面 UI
  - Webhook 設定
  - ngrok 対応
