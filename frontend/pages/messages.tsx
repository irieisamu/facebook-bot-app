// frontend/pages/messages.tsx

import { useState, useEffect } from "react";
import Link from "next/link";

interface Message {
  id: string;
  sender_id: string;
  text: string;
  timestamp: string;
  is_incoming: boolean;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedSender, setSelectedSender] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 実際のAPIからメッセージを取得
  const fetchMessages = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/messages");
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        console.error("Failed to fetch messages:", response.status);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setStatus("❌ メッセージの取得に失敗しました");
    }
  };

  // 送信者一覧を取得
  const fetchSenders = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/senders");
      if (response.ok) {
        const data = await response.json();
        return data.senders || [];
      }
    } catch (error) {
      console.error("Error fetching senders:", error);
    }
    return [];
  };

  // 初回読み込みと定期的な更新
  useEffect(() => {
    fetchMessages();
    
    // 30秒ごとにメッセージを更新
    const interval = setInterval(fetchMessages, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // 送信者IDの一覧を取得
  const senderIds = [...new Set(messages.map(msg => msg.sender_id))];

  // 選択された送信者のメッセージをフィルタリング
  const filteredMessages = selectedSender 
    ? messages.filter(msg => msg.sender_id === selectedSender)
    : messages;

  const sendReply = async () => {
    if (!selectedSender || !replyText.trim()) {
      setStatus("送信先とメッセージを入力してください");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          recipientId: selectedSender, 
          message: replyText 
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setReplyText("");
        setStatus("✅ メッセージを送信しました");
        // メッセージ一覧を更新
        setTimeout(fetchMessages, 1000);
      } else {
        setStatus(`❌ エラー: ${data.error || "送信に失敗しました"}`);
      }
    } catch (error) {
      setStatus("❌ ネットワークエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMessages();
    setIsRefreshing(false);
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString("ja-JP");
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">メッセージ管理</h1>
            <p className="text-gray-600 mt-2">受信メッセージの確認と返信</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
            >
              {isRefreshing ? "更新中..." : "更新"}
            </button>
            <Link 
              href="/" 
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              ホームに戻る
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 送信者リスト */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">送信者一覧</h2>
            {senderIds.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p>まだメッセージがありません</p>
                <p className="text-sm">Facebookページにメッセージを送信してください</p>
              </div>
            ) : (
              <div className="space-y-2">
                {senderIds.map(senderId => (
                  <button
                    key={senderId}
                    onClick={() => setSelectedSender(senderId)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSender === senderId
                        ? "bg-blue-100 border-blue-300 border"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-medium text-gray-800">ID: {senderId}</div>
                    <div className="text-sm text-gray-500">
                      {messages.filter(msg => msg.sender_id === senderId).length} 件のメッセージ
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* メッセージ表示エリア */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            {selectedSender ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    送信者: {selectedSender}
                  </h2>
                  <button
                    onClick={() => setSelectedSender("")}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    すべて表示
                  </button>
                </div>

                {/* メッセージリスト */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {filteredMessages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.is_incoming ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                          message.is_incoming
                            ? "bg-gray-100 text-gray-800"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        <div className="text-sm">{message.text}</div>
                        <div className={`text-xs mt-1 ${
                          message.is_incoming ? "text-gray-500" : "text-blue-100"
                        }`}>
                          {formatTimestamp(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 返信フォーム */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium mb-3">返信を送信</h3>
                  <div className="space-y-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="返信メッセージを入力してください..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                    />
                    <div className="flex justify-between items-center">
                      <button
                        onClick={sendReply}
                        disabled={isLoading || !replyText.trim()}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? "送信中..." : "送信"}
                      </button>
                      {status && (
                        <span className={`text-sm ${
                          status.includes("✅") ? "text-green-600" : "text-red-600"
                        }`}>
                          {status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {messages.length === 0 ? "メッセージがありません" : "メッセージを選択してください"}
                </h3>
                <p className="text-gray-500">
                  {messages.length === 0 
                    ? "Facebookページにメッセージを送信すると、ここに表示されます"
                    : "左側の送信者一覧からメッセージを確認したい送信者を選択してください"
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
