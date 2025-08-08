// frontend/pages/messages.tsx

import { useState } from "react";

export default function MessagesPage() {
  const [recipientId, setRecipientId] = useState(""); // 受信者PSID（開発では手動入力）
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const sendMessage = async () => {
    const res = await fetch("/api/send-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId, message }),
    });
    const data = await res.json();
    setStatus(data.status || "送信完了");
  };

  return (
    <main style={{ padding: 32 }}>
      <h1>Facebook メッセージ送信テスト</h1>

      <div style={{ marginBottom: 16 }}>
        <label>送信先PSID:</label>
        <br />
        <input
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          style={{ width: "300px" }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>メッセージ内容:</label>
        <br />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          style={{ width: "300px" }}
        />
      </div>

      <button onClick={sendMessage}>送信</button>

      {status && <p>✅ {status}</p>}
    </main>
  );
}
