import { useState, useEffect } from "react";
import Link from "next/link";

interface WebhookStatus {
  isConfigured: boolean;
  url: string;
  verifyToken: string;
  lastVerified: string | null;
}

interface AppStatus {
  status: string;
  message_count: number;
  sender_count: number;
  webhook_configured: boolean;
  page_token_configured: boolean;
}

export default function SettingsPage() {
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>({
    isConfigured: false,
    url: "",
    verifyToken: "",
    lastVerified: null
  });
  const [appStatus, setAppStatus] = useState<AppStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAppStatus();
    fetchWebhookStatus();
  }, []);

  const fetchAppStatus = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/status");
      if (response.ok) {
        const data = await response.json();
        setAppStatus(data);
      }
    } catch (error) {
      console.error("Error fetching app status:", error);
    }
  };

  const fetchWebhookStatus = async () => {
    // 実際の実装ではAPIから取得
    setTimeout(() => {
      setWebhookStatus({
        isConfigured: true,
        url: "https://your-domain.com/webhook",
        verifyToken: "your-verify-token",
        lastVerified: "2024-01-15 10:30:00"
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([fetchAppStatus(), fetchWebhookStatus()]);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">設定</h1>
            <p className="text-gray-600 mt-2">アプリの設定とWebhook状況</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
            >
              {isLoading ? "更新中..." : "更新"}
            </button>
            <Link 
              href="/" 
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              ホームに戻る
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* アプリケーション状態 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">アプリケーション状態</h2>
            
            {appStatus ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    appStatus.status === "running" ? "bg-green-500" : "bg-red-500"
                  }`}></div>
                  <span className="font-medium">
                    {appStatus.status === "running" ? "稼働中" : "停止中"}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    受信メッセージ数
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    {appStatus.message_count} 件
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    送信者数
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    {appStatus.sender_count} 人
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook設定
                  </label>
                  <div className={`p-3 border rounded-lg text-sm ${
                    appStatus.webhook_configured 
                      ? "bg-green-50 border-green-200 text-green-800" 
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}>
                    {appStatus.webhook_configured ? "設定済み" : "未設定"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ページアクセストークン
                  </label>
                  <div className={`p-3 border rounded-lg text-sm ${
                    appStatus.page_token_configured 
                      ? "bg-green-50 border-green-200 text-green-800" 
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}>
                    {appStatus.page_token_configured ? "設定済み" : "未設定"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          {/* Webhook設定 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Facebook Webhook設定</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    webhookStatus.isConfigured ? "bg-green-500" : "bg-red-500"
                  }`}></div>
                  <span className="font-medium">
                    {webhookStatus.isConfigured ? "設定済み" : "未設定"}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webhook URL
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
                    {webhookStatus.url || "未設定"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verify Token
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
                    {webhookStatus.verifyToken || "未設定"}
                  </div>
                </div>

                {webhookStatus.lastVerified && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      最終検証日時
                    </label>
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                      {webhookStatus.lastVerified}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    Webhook設定を更新
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 環境変数設定 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">環境変数設定</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  FB_PAGE_ACCESS_TOKEN
                </label>
                <div className={`p-3 border rounded-lg font-mono text-sm ${
                  process.env.FB_PAGE_ACCESS_TOKEN 
                    ? "bg-green-50 border-green-200 text-green-800" 
                    : "bg-red-50 border-red-200 text-red-800"
                }`}>
                  {process.env.FB_PAGE_ACCESS_TOKEN ? "設定済み" : "未設定"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  FB_VERIFY_TOKEN
                </label>
                <div className={`p-3 border rounded-lg font-mono text-sm ${
                  process.env.FB_VERIFY_TOKEN 
                    ? "bg-green-50 border-green-200 text-green-800" 
                    : "bg-red-50 border-red-200 text-red-800"
                }`}>
                  {process.env.FB_VERIFY_TOKEN ? "設定済み" : "未設定"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NEXT_PUBLIC_API_URL
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm">
                  {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
                </div>
              </div>
            </div>
          </div>

          {/* システム情報 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">システム情報</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  アプリバージョン
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  v1.0.0
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  フレームワーク
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  Next.js 15.4.6
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  バックエンド
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  FastAPI + Python
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  稼働時間
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  開始: {new Date().toLocaleString("ja-JP")}
                </div>
              </div>
            </div>
          </div>

          {/* 設定ガイド */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">設定ガイド</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">1. Facebook Developer Console</h3>
                <p className="text-sm text-blue-700">
                  Facebook Developer Consoleでアプリを作成し、Messenger製品を追加してください。
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">2. Webhook設定</h3>
                <p className="text-sm text-green-700">
                  ngrokでローカル環境を公開し、Webhook URLを設定してください。
                </p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-medium text-purple-800 mb-2">3. アクセストークン</h3>
                <p className="text-sm text-purple-700">
                  Page Access Tokenを取得し、環境変数に設定してください。
                </p>
              </div>

              <div className="pt-4">
                <a 
                  href="https://developers.facebook.com/docs/messenger-platform/getting-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                >
                  Facebook Messenger Platform ドキュメント →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 