# backend/main.py

from fastapi import FastAPI, Request
from pydantic import BaseModel
import httpx
import os
from fastapi.responses import PlainTextResponse

app = FastAPI()
from dotenv import load_dotenv
load_dotenv()

# FacebookからWebhook認証で送られてくるトークン
VERIFY_TOKEN = os.getenv("FB_VERIFY_TOKEN", "your-verify-token")
# Facebookページアクセストークン（開発モードで取得したもの）
PAGE_ACCESS_TOKEN = os.getenv("FB_PAGE_ACCESS_TOKEN", "your-page-access-token")

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
    for entry in payload.get("entry", []):
        for messaging_event in entry.get("messaging", []):
            sender_id = messaging_event["sender"]["id"]
            if "message" in messaging_event:
                message_text = messaging_event["message"].get("text", "")
                print(f"📩 Message from {sender_id}: {message_text}")

                # エコー返信（任意）
                await send_message(sender_id, f"You said: {message_text}")
    return {"status": "ok"}

# ✅ Facebookへ返信を送る関数
async def send_message(recipient_id: str, message_text: str):
    url = f"https://graph.facebook.com/v19.0/me/messages?access_token={PAGE_ACCESS_TOKEN}"
    payload = {
        "recipient": {"id": recipient_id},
        "message": {"text": message_text},
    }
    async with httpx.AsyncClient() as client:
        await client.post(url, json=payload)
