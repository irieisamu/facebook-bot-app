# backend/main.py

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from fastapi.responses import PlainTextResponse
from datetime import datetime
from typing import List, Dict, Any
import json

app = FastAPI()

# CORS設定を追加
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # フロントエンドのURL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from dotenv import load_dotenv
load_dotenv()

# FacebookからWebhook認証で送られてくるトークン
VERIFY_TOKEN = os.getenv("FB_VERIFY_TOKEN", "your-verify-token")
# Facebookページアクセストークン（開発モードで取得したもの）
PAGE_ACCESS_TOKEN = os.getenv("FB_PAGE_ACCESS_TOKEN", "your-page-access-token")

# メッセージを保存するためのメモリ内ストレージ
messages_storage: List[Dict[str, Any]] = []

# メッセージモデル
class Message(BaseModel):
    id: str
    sender_id: str
    text: str
    timestamp: str
    is_incoming: bool

# ✅ メッセージ一覧を取得するAPI
@app.get("/api/messages")
async def get_messages():
    """保存されているメッセージ一覧を取得"""
    return {"messages": messages_storage}

# ✅ 特定の送信者のメッセージを取得するAPI
@app.get("/api/messages/{sender_id}")
async def get_messages_by_sender(sender_id: str):
    """特定の送信者のメッセージを取得"""
    sender_messages = [msg for msg in messages_storage if msg["sender_id"] == sender_id]
    return {"messages": sender_messages}

# ✅ 送信者一覧を取得するAPI
@app.get("/api/senders")
async def get_senders():
    """メッセージを送信したユーザーの一覧を取得"""
    sender_ids = list(set([msg["sender_id"] for msg in messages_storage]))
    return {"senders": sender_ids}

# ✅ Webhookの認証（GET）
@app.get("/webhook")
async def verify_webhook(request: Request):
    params = dict(request.query_params)
    print(f"🔍 Webhook verify request: {params}")

    if (
        params.get("hub.mode") == "subscribe"
        and params.get("hub.verify_token") == VERIFY_TOKEN
    ):
        challenge = params.get("hub.challenge")
        print(f"✅ Challenge verified: {challenge}")
        return PlainTextResponse(content=challenge, status_code=200)

    print("❌ Invalid verify_token or mode")
    return PlainTextResponse(content="Invalid verification", status_code=403)

# ✅ Webhookでメッセージを受信（POST）
@app.post("/webhook")
async def receive_message(payload: dict):
    print(f"📩 Received webhook payload: {json.dumps(payload, indent=2)}")
    
    for entry in payload.get("entry", []):
        # ページIDを取得
        page_id = entry.get("id")
        print(f"📄 Page ID: {page_id}")
        
        for messaging_event in entry.get("messaging", []):
            sender_id = messaging_event["sender"]["id"]
            print(f"👤 Sender ID: {sender_id}")
            
            # メッセージイベントの処理
            if "message" in messaging_event:
                message = messaging_event["message"]
                message_text = message.get("text", "")
                message_id = message.get("mid", "")
                timestamp = messaging_event.get("timestamp", int(datetime.now().timestamp()))
                
                print(f"📩 Message from {sender_id}: {message_text}")
                print(f"📝 Message ID: {message_id}")
                print(f"⏰ Timestamp: {timestamp}")

                # メッセージをストレージに保存
                message_data = {
                    "id": f"msg_{len(messages_storage) + 1}_{int(datetime.now().timestamp())}",
                    "sender_id": sender_id,
                    "text": message_text,
                    "timestamp": datetime.fromtimestamp(timestamp).isoformat(),
                    "is_incoming": True,
                    "message_id": message_id,
                    "page_id": page_id
                }
                messages_storage.append(message_data)
                print(f"💾 Saved message: {message_data}")

                # エコー返信（任意）
                await send_message(sender_id, f"You said: {message_text}")
            
            # メッセージ配信確認
            elif "delivery" in messaging_event:
                print(f"✅ Message delivered to {sender_id}")
            
            # メッセージ既読確認
            elif "read" in messaging_event:
                print(f"👁️ Message read by {sender_id}")
            
            # ポストバックイベント（ボタンクリックなど）
            elif "postback" in messaging_event:
                postback = messaging_event["postback"]
                payload = postback.get("payload", "")
                title = postback.get("title", "")
                print(f"🔘 Postback from {sender_id}: {title} - {payload}")
                
                # ポストバックもメッセージとして保存
                message_data = {
                    "id": f"postback_{len(messages_storage) + 1}_{int(datetime.now().timestamp())}",
                    "sender_id": sender_id,
                    "text": f"[Postback] {title}: {payload}",
                    "timestamp": datetime.now().isoformat(),
                    "is_incoming": True,
                    "message_id": "",
                    "page_id": page_id,
                    "type": "postback"
                }
                messages_storage.append(message_data)
    
    return {"status": "ok"}

# ✅ Facebookへ返信を送る関数
async def send_message(recipient_id: str, message_text: str):
    url = f"https://graph.facebook.com/v23.0/me/messages?access_token={PAGE_ACCESS_TOKEN}"
    payload = {
        "recipient": {"id": recipient_id},
        "message": {"text": message_text},
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                # 送信したメッセージもストレージに保存
                sent_message_data = {
                    "id": f"msg_{len(messages_storage) + 1}_{int(datetime.now().timestamp())}",
                    "sender_id": recipient_id,
                    "text": message_text,
                    "timestamp": datetime.now().isoformat(),
                    "is_incoming": False
                }
                messages_storage.append(sent_message_data)
                print(f"✅ Message sent successfully: {sent_message_data}")
            else:
                print(f"❌ Failed to send message: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error sending message: {e}")

# ✅ アプリの状態を確認するAPI
@app.get("/api/status")
async def get_status():
    """アプリの状態を確認"""
    return {
        "status": "running",
        "message_count": len(messages_storage),
        "sender_count": len(set([msg["sender_id"] for msg in messages_storage])),
        "webhook_configured": bool(VERIFY_TOKEN and VERIFY_TOKEN != "your-verify-token"),
        "page_token_configured": bool(PAGE_ACCESS_TOKEN and PAGE_ACCESS_TOKEN != "your-page-access-token"),
        "last_message_time": messages_storage[-1]["timestamp"] if messages_storage else None,
        "webhook_subscriptions": [
            "messages",
            "messaging_postbacks", 
            "messaging_optins",
            "messaging_deliveries",
            "messaging_reads"
        ]
    }

# ✅ Webhookの詳細情報を取得するAPI
@app.get("/api/webhook-info")
async def get_webhook_info():
    """Webhookの設定情報を取得"""
    return {
        "webhook_url": "https://your-ngrok-url.ngrok.io/webhook",
        "verify_token": VERIFY_TOKEN if VERIFY_TOKEN != "your-verify-token" else "未設定",
        "page_access_token_configured": bool(PAGE_ACCESS_TOKEN and PAGE_ACCESS_TOKEN != "your-page-access-token"),
        "required_subscriptions": [
            "messages",
            "messaging_postbacks",
            "messaging_optins"
        ],
        "optional_subscriptions": [
            "messaging_deliveries",
            "messaging_reads"
        ],
        "setup_instructions": [
            "1. Facebook Developer ConsoleでWebhookを設定",
            "2. コールバックURL: https://your-ngrok-url.ngrok.io/webhook",
            "3. 検証トークン: .envファイルのFB_VERIFY_TOKEN",
            "4. 購読フィールド: messages, messaging_postbacks, messaging_optins"
        ]
    }
