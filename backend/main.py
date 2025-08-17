# backend/main.py

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from fastapi.responses import PlainTextResponse, JSONResponse
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import json

app = FastAPI()

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # フロントエンドのURL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from dotenv import load_dotenv
load_dotenv()

VERIFY_TOKEN = os.getenv("FB_VERIFY_TOKEN", "your-verify-token")
PAGE_ACCESS_TOKEN = os.getenv("FB_PAGE_ACCESS_TOKEN", "your-page-access-token")

# メモリ内ストレージ（デモ用）
messages_storage: List[Dict[str, Any]] = []

class Message(BaseModel):
    id: str
    sender_id: str
    text: str
    timestamp: str
    is_incoming: bool

# ---- 追加：timestampユーティリティ ----
def ts_to_iso8601(ts: Any) -> Optional[str]:
    """
    Meta Webhookのtimestampは通常ミリ秒。秒/ミリ秒を自動判定してISO8601(UTC)へ。
    不正値は None を返す。
    """
    try:
        val = float(ts)
    except (TypeError, ValueError):
        return None
    # ~2001年以降のmsは1e12を超える
    if val > 1e12:
        val /= 1000.0
    try:
        return datetime.fromtimestamp(val, tz=timezone.utc).isoformat()
    except (OverflowError, OSError, ValueError):
        return None
# -------------------------------------

# ✅ メッセージ一覧
@app.get("/api/messages")
async def get_messages():
    return {"messages": messages_storage}

# ✅ 送信者ごと
@app.get("/api/messages/{sender_id}")
async def get_messages_by_sender(sender_id: str):
    sender_messages = [msg for msg in messages_storage if msg["sender_id"] == sender_id]
    return {"messages": sender_messages}

# ✅ 送信者一覧
@app.get("/api/senders")
async def get_senders():
    sender_ids = list({msg["sender_id"] for msg in messages_storage})
    return {"senders": sender_ids}

# ✅ Webhook認証
@app.get("/webhook")
async def verify_webhook(request: Request):
    params = dict(request.query_params)
    print(f"🔍 Webhook verify request: {params}")

    if (
        params.get("hub.mode") == "subscribe"
        and params.get("hub.verify_token") == VERIFY_TOKEN
    ):
        challenge = params.get("hub.challenge", "")
        print(f"✅ Challenge verified: {challenge}")
        return PlainTextResponse(content=challenge, status_code=200)

    print("❌ Invalid verify_token or mode")
    return PlainTextResponse(content="Invalid verification", status_code=403)

# ✅ Webhook受信
@app.post("/webhook")
async def receive_message(payload: dict):
    """
    例外が起きても Meta に 200 を返して再送ループを防ぐ。
    """
    try:
        print(f"📩 Received webhook payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")

        for entry in payload.get("entry", []):
            page_id = entry.get("id")
            entry_time_iso = ts_to_iso8601(entry.get("time"))
            print(f"📄 Page ID: {page_id}")
            if entry_time_iso:
                print(f"🕒 Entry time: {entry_time_iso}")

            for messaging_event in entry.get("messaging", []):
                sender_id = messaging_event.get("sender", {}).get("id")
                recipient_id = messaging_event.get("recipient", {}).get("id")
                event_ts_iso = ts_to_iso8601(messaging_event.get("timestamp"))
                print(f"👤 Sender ID: {sender_id}")
                if event_ts_iso:
                    print(f"⏰ Event Timestamp: {event_ts_iso}")

                # メッセージ
                if "message" in messaging_event:
                    message = messaging_event.get("message", {})
                    message_text = message.get("text", "")
                    message_id = message.get("mid", "")

                    print(f"📩 Message from {sender_id}: {message_text}")
                    print(f"📝 Message ID: {message_id}")

                    message_data = {
                        "id": f"msg_{len(messages_storage) + 1}_{int(datetime.now().timestamp())}",
                        "sender_id": sender_id or "",
                        "text": message_text,
                        "timestamp": event_ts_iso or datetime.now(timezone.utc).isoformat(),
                        "is_incoming": True,
                        "message_id": message_id,
                        "page_id": page_id,
                        "recipient_id": recipient_id,
                        "entry_time": entry_time_iso,
                    }
                    messages_storage.append(message_data)
                    print(f"💾 Saved message: {message_data}")

                    # エコー返信（任意）
                    if sender_id:
                        await send_message(sender_id, f"You said: {message_text}")

                # 配信確認
                elif "delivery" in messaging_event:
                    print(f"✅ Delivery event: {messaging_event.get('delivery')}")

                # 既読
                elif "read" in messaging_event:
                    print(f"👁️ Read event: {messaging_event.get('read')}")

                # ポストバック
                elif "postback" in messaging_event:
                    postback = messaging_event.get("postback", {})
                    pl = postback.get("payload", "")
                    title = postback.get("title", "")
                    print(f"🔘 Postback from {sender_id}: {title} - {pl}")

                    pb_message = {
                        "id": f"postback_{len(messages_storage) + 1}_{int(datetime.now().timestamp())}",
                        "sender_id": sender_id or "",
                        "text": f"[Postback] {title}: {pl}",
                        "timestamp": event_ts_iso or datetime.now(timezone.utc).isoformat(),
                        "is_incoming": True,
                        "message_id": "",
                        "page_id": page_id,
                        "recipient_id": recipient_id,
                        "type": "postback",
                        "entry_time": entry_time_iso,
                    }
                    messages_storage.append(pb_message)

    except Exception as e:
        # ここでスタックトレースを出しつつ200を返す（Metaの再送を避ける）
        import traceback
        print("❌ Exception while handling webhook:")
        traceback.print_exc()

    # どんな場合も200
    return JSONResponse(content={"status": "ok"}, status_code=200)

# ✅ Facebookへ返信
async def send_message(recipient_id: str, message_text: str):
    url = f"https://graph.facebook.com/v23.0/me/messages?access_token={PAGE_ACCESS_TOKEN}"
    payload = {
        "recipient": {"id": recipient_id},
        "message": {"text": message_text},
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(url, json=payload)
            if response.status_code == 200:
                sent_message_data = {
                    "id": f"msg_{len(messages_storage) + 1}_{int(datetime.now().timestamp())}",
                    "sender_id": recipient_id,  # 受信者＝相手のPSID（こちら視点では送信先）
                    "text": message_text,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "is_incoming": False
                }
                messages_storage.append(sent_message_data)
                print(f"✅ Message sent successfully: {sent_message_data}")
            else:
                print(f"❌ Failed to send message: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error sending message: {e}")

# ✅ 状態確認
@app.get("/api/status")
async def get_status():
    return {
        "status": "running",
        "message_count": len(messages_storage),
        "sender_count": len({msg["sender_id"] for msg in messages_storage}),
        "webhook_configured": bool(VERIFY_TOKEN and VERIFY_TOKEN != "your-verify-token"),
        "page_token_configured": bool(PAGE_ACCESS_TOKEN and PAGE_ACCESS_TOKEN != "your-page-access-token"),
        "last_message_time": messages_storage[-1]["timestamp"] if messages_storage else None,
        "webhook_subscriptions": [
            "messages",
            "messaging_postbacks",
            "messaging_optins",
            "messaging_deliveries",
            "messaging_reads",
        ],
    }

# ✅ Webhook情報
@app.get("/api/webhook-info")
async def get_webhook_info():
    return {
        "webhook_url": "https://your-ngrok-url.ngrok.io/webhook",
        "verify_token": VERIFY_TOKEN if VERIFY_TOKEN != "your-verify-token" else "未設定",
        "page_access_token_configured": bool(PAGE_ACCESS_TOKEN and PAGE_ACCESS_TOKEN != "your-page-access-token"),
        "required_subscriptions": ["messages", "messaging_postbacks", "messaging_optins"],
        "optional_subscriptions": ["messaging_deliveries", "messaging_reads"],
        "setup_instructions": [
            "1. Facebook Developer ConsoleでWebhookを設定",
            "2. コールバックURL: https://your-ngrok-url.ngrok.io/webhook",
            "3. 検証トークン: .envファイルのFB_VERIFY_TOKEN",
            "4. 購読フィールド: messages, messaging_postbacks, messaging_optins",
        ],
    }
