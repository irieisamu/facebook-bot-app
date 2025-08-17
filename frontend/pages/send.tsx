import { useState } from "react";
import Link from "next/link";

export default function SendPage() {
  const [recipientId, setRecipientId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");

  const sendMessage = async () => {
    if (!recipientId.trim() || !message.trim()) {
      setStatus("送信先IDとメッセージを入力してください");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, message }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setStatus("✅ メッセージを送信しました");
        setMessage(""); // メッセージをクリア
      } else {
        setStatus(`❌ エラー: ${data.error || "送信に失敗しました"}`);
      }
    } catch (error) {
      setStatus("❌ ネットワークエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">メッセージ送信</h1>
            <p className="text-gray-600 mt-2">新しいメッセージを送信</p>
          </div>
          <Link 
            href="/" 
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ホームに戻る
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold mb-6">メッセージ送信フォーム</h2>
            
            <div className="space-y-6">
              {/* 送信先ID */}
              <div>
                <label htmlFor="recipientId" className="block text-sm font-medium text-gray-700 mb-2">
                  送信先ID (PSID)
                </label>
                <input
                  id="recipientId"
                  type="text"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  placeholder="例: 123456789012345"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Facebookページにメッセージを送信したユーザーのPSIDを入力してください
                </p>
              </div>

              {/* メッセージ内容 */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  メッセージ内容
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="送信するメッセージを入力してください..."
                  rows={6}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-500">
                    最大2000文字まで送信可能
                  </p>
                  <span className={`text-sm ${
                    message.length > 1800 ? "text-red-500" : "text-gray-500"
                  }`}>
                    {message.length}/2000
                  </span>
                </div>
              </div>

              {/* 送信ボタン */}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !recipientId.trim() || !message.trim() || message.length > 2000}
                  className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      送信中...
                    </div>
                  ) : (
                    "メッセージを送信"
                  )}
                </button>

                {status && (
                  <span className={`text-sm font-medium ${
                    status.includes("✅") ? "text-green-600" : "text-red-600"
                  }`}>
                    {status}
                  </span>
                )}
              </div>
            </div>

            {/* 注意事項 */}
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">注意事項</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 送信先IDは有効なFacebook PSIDである必要があります</li>
                <li>• ユーザーが過去にページにメッセージを送信している必要があります</li>
                <li>• 24時間以内にユーザーがページとやり取りしていない場合、送信できません</li>
                <li>• メッセージは即座に送信されます</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 