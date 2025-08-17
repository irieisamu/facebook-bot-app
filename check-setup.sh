#!/bin/bash

# Facebook Bot App 設定確認スクリプト
echo "🔍 Facebook Bot App 設定を確認します..."

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
    echo ""
    log_info "=== 環境変数ファイルの確認 ==="
    
    if [ -f "backend/.env" ]; then
        log_success "✓ backend/.env ファイルが存在します"
        
        # トークンの確認
        if grep -q "FB_VERIFY_TOKEN" backend/.env; then
            log_success "✓ FB_VERIFY_TOKEN が設定されています"
        else
            log_error "✗ FB_VERIFY_TOKEN が設定されていません"
        fi
        
        if grep -q "FB_PAGE_ACCESS_TOKEN" backend/.env; then
            log_success "✓ FB_PAGE_ACCESS_TOKEN が設定されています"
        else
            log_error "✗ FB_PAGE_ACCESS_TOKEN が設定されていません"
        fi
    else
        log_error "✗ backend/.env ファイルが見つかりません"
    fi
    
    if [ -f "frontend/.env.local" ]; then
        log_success "✓ frontend/.env.local ファイルが存在します"
    else
        log_warning "⚠ frontend/.env.local ファイルが見つかりません"
    fi
}

# ngrok の確認
check_ngrok() {
    echo ""
    log_info "=== ngrok の確認 ==="
    
    if command -v ngrok &> /dev/null; then
        log_success "✓ ngrok がインストールされています"
        
        # バージョン確認
        ngrok_version=$(ngrok version 2>/dev/null | head -n1)
        log_info "ngrok バージョン: $ngrok_version"
        
        # 認証確認
        if ngrok config check &> /dev/null; then
            log_success "✓ ngrok の認証が設定されています"
        else
            log_warning "⚠ ngrok の認証が設定されていません"
            log_info "以下のコマンドで認証トークンを設定してください："
            echo "ngrok config add-authtoken YOUR_AUTH_TOKEN"
        fi
    else
        log_error "✗ ngrok がインストールされていません"
        log_info "インストール方法:"
        echo "macOS: brew install ngrok"
        echo "Windows: choco install ngrok"
        echo "Linux: sudo apt install ngrok"
    fi
}

# 依存関係の確認
check_dependencies() {
    echo ""
    log_info "=== 依存関係の確認 ==="
    
    # Python
    if command -v python3 &> /dev/null; then
        python_version=$(python3 --version)
        log_success "✓ Python: $python_version"
    else
        log_error "✗ Python3 がインストールされていません"
    fi
    
    # Node.js
    if command -v node &> /dev/null; then
        node_version=$(node --version)
        log_success "✓ Node.js: $node_version"
    else
        log_error "✗ Node.js がインストールされていません"
    fi
    
    # Yarn
    if command -v yarn &> /dev/null; then
        yarn_version=$(yarn --version)
        log_success "✓ Yarn: $yarn_version"
    else
        log_error "✗ Yarn がインストールされていません"
    fi
}

# ポートの確認
check_ports() {
    echo ""
    log_info "=== ポートの確認 ==="
    
    # ポート8000
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "⚠ ポート8000が使用中です"
    else
        log_success "✓ ポート8000は利用可能です"
    fi
    
    # ポート3000
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "⚠ ポート3000が使用中です"
    else
        log_success "✓ ポート3000は利用可能です"
    fi
}

# Facebook設定の確認
check_facebook_setup() {
    echo ""
    log_info "=== Facebook設定の確認 ==="
    
    log_info "以下の項目を確認してください："
    echo ""
    echo "1. Facebook Developer Console:"
    echo "   - アプリが作成されているか"
    echo "   - Messenger製品が追加されているか"
    echo "   - ページがリンクされているか"
    echo "   - ページアクセストークンが生成されているか"
    echo ""
    echo "2. Facebookページ:"
    echo "   - ページが存在するか"
    echo "   - 管理者または編集者権限があるか"
    echo "   - メッセージングが有効になっているか"
    echo ""
    echo "3. Webhook設定:"
    echo "   - ngrok URLが設定されているか"
    echo "   - Verify Tokenが一致しているか"
    echo "   - 購読フィールドが設定されているか"
    echo ""
}

# 起動テスト
test_startup() {
    echo ""
    log_info "=== 起動テスト ==="
    
    read -p "起動テストを実行しますか？ (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "バックエンドの起動テスト..."
        
        # バックエンドの起動テスト
        cd backend
        if [ -f ".env" ]; then
            source .env 2>/dev/null
            timeout 10s uvicorn main:app --host 0.0.0.0 --port 8000 > /dev/null 2>&1 &
            BACKEND_PID=$!
            sleep 3
            
            if curl -s http://localhost:8000/api/status > /dev/null; then
                log_success "✓ バックエンドが正常に起動しました"
            else
                log_error "✗ バックエンドの起動に失敗しました"
            fi
            
            kill $BACKEND_PID 2>/dev/null
        else
            log_error "✗ .envファイルが見つからないためテストできません"
        fi
        cd ..
    fi
}

# メイン処理
main() {
    echo "=========================================="
    echo "  Facebook Bot App 設定確認スクリプト"
    echo "=========================================="
    
    check_env_files
    check_ngrok
    check_dependencies
    check_ports
    check_facebook_setup
    test_startup
    
    echo ""
    echo "=========================================="
    log_info "設定確認が完了しました"
    echo "=========================================="
    echo ""
    echo "📋 次のステップ:"
    echo "1. Facebook Developer Consoleでページをリンク"
    echo "2. ページアクセストークンを生成"
    echo "3. Webhookを設定"
    echo "4. ./start-dev.sh で開発環境を起動"
    echo ""
}

# スクリプトを実行
main 