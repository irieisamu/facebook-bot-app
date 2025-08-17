#!/bin/bash

# Facebook Bot App 開発環境起動スクリプト
echo "🚀 Facebook Bot App 開発環境を起動します..."

# 色付きのログ関数
log_info() {
    echo -e "\033[34m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[32m[SUCCESS]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

log_warning() {
    echo -e "\033[33m[WARNING]\033[0m $1"
}

# 環境変数ファイルの確認
check_env_files() {
    log_info "環境変数ファイルを確認中..."
    
    if [ ! -f "backend/.env" ]; then
        log_error "backend/.env ファイルが見つかりません"
        log_info "以下の内容で backend/.env を作成してください："
        echo ""
        echo "FB_VERIFY_TOKEN=your-verify-token-here"
        echo "FB_PAGE_ACCESS_TOKEN=your-page-access-token-here"
        echo "HOST=0.0.0.0"
        echo "PORT=8000"
        echo ""
        exit 1
    fi
    
    if [ ! -f "frontend/.env.local" ]; then
        log_warning "frontend/.env.local ファイルが見つかりません"
        log_info "以下の内容で frontend/.env.local を作成してください："
        echo ""
        echo "FB_PAGE_ACCESS_TOKEN=your-page-access-token-here"
        echo "NEXT_PUBLIC_API_URL=http://localhost:8000"
        echo ""
    fi
    
    log_success "環境変数ファイルの確認完了"
}

# ngrok の確認
check_ngrok() {
    log_info "ngrok の確認中..."
    
    if ! command -v ngrok &> /dev/null; then
        log_error "ngrok がインストールされていません"
        log_info "以下のコマンドで ngrok をインストールしてください："
        echo ""
        echo "macOS: brew install ngrok"
        echo "Windows: choco install ngrok"
        echo "Linux: sudo apt install ngrok"
        echo ""
        log_info "または公式サイトからダウンロード: https://ngrok.com/download"
        exit 1
    fi
    
    # ngrok の認証確認
    if ! ngrok config check &> /dev/null; then
        log_warning "ngrok の認証トークンが設定されていません"
        log_info "以下のコマンドで認証トークンを設定してください："
        echo ""
        echo "ngrok config add-authtoken YOUR_AUTH_TOKEN"
        echo ""
        log_info "認証トークンは https://dashboard.ngrok.com/get-started/your-authtoken で取得できます"
    fi
    
    log_success "ngrok の確認完了"
}

# バックエンドの起動
start_backend() {
    log_info "バックエンドを起動中..."
    
    cd backend
    
    # Python 依存関係のインストール
    if [ ! -d "venv" ]; then
        log_info "仮想環境を作成中..."
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    
    log_info "依存関係をインストール中..."
    pip install -r requirements.txt
    
    log_success "バックエンドを起動しました (http://localhost:8000)"
    log_info "バックエンドのログを確認するには: tail -f backend.log"
    
    # バックエンドを起動（ログファイルに出力）
    uvicorn main:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
    BACKEND_PID=$!
    
    cd ..
}

# フロントエンドの起動
start_frontend() {
    log_info "フロントエンドを起動中..."
    
    cd frontend
    
    # Node.js 依存関係のインストール
    if [ ! -d "node_modules" ]; then
        log_info "依存関係をインストール中..."
        yarn install
    fi
    
    log_success "フロントエンドを起動しました (http://localhost:3000)"
    log_info "フロントエンドのログを確認するには: tail -f frontend.log"
    
    # フロントエンドを起動（ログファイルに出力）
    yarn dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    cd ..
}

# ngrok の起動
start_ngrok() {
    log_info "ngrok を起動中..."
    
    # 少し待ってから ngrok を起動
    sleep 3
    
    log_success "ngrok を起動しました"
    log_info "ngrok の Web インターフェース: http://localhost:4040"
    log_info "ngrok URL を Facebook Developer Console の Webhook に設定してください"
    
    # ngrok を起動
    ngrok http 8000 > ngrok.log 2>&1 &
    NGROK_PID=$!
}

# プロセスの停止
cleanup() {
    log_info "プロセスを停止中..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    if [ ! -z "$NGROK_PID" ]; then
        kill $NGROK_PID 2>/dev/null
    fi
    
    log_success "すべてのプロセスを停止しました"
    exit 0
}

# シグナルハンドラーを設定
trap cleanup SIGINT SIGTERM

# メイン処理
main() {
    echo "=========================================="
    echo "  Facebook Bot App 開発環境起動スクリプト"
    echo "=========================================="
    echo ""
    
    # 環境チェック
    check_env_files
    check_ngrok
    
    echo ""
    log_info "開発環境を起動中..."
    echo ""
    
    # 各サービスを起動
    start_backend
    start_frontend
    start_ngrok
    
    echo ""
    echo "=========================================="
    log_success "開発環境の起動が完了しました！"
    echo "=========================================="
    echo ""
    echo "🌐 アプリケーション:"
    echo "   - フロントエンド: http://localhost:3000"
    echo "   - バックエンド:   http://localhost:8000"
    echo "   - ngrok:         http://localhost:4040"
    echo ""
    echo "📝 ログファイル:"
    echo "   - バックエンド:   tail -f backend.log"
    echo "   - フロントエンド: tail -f frontend.log"
    echo "   - ngrok:         tail -f ngrok.log"
    echo ""
    echo "🛑 停止するには Ctrl+C を押してください"
    echo ""
    
    # プロセスが終了するまで待機
    wait
}

# スクリプトを実行
main 