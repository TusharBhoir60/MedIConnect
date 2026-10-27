# JanVaani IVR — JanArogya MH 🇮🇳

Twilio se automated outbound call — Marathi / Hindi / English menu,
DTMF input capture, appointment booking, SMS confirmation, call log.

---

## Architecture

```
Doctor Dashboard (Next.js)
        │
        │  POST /api/ivr/call  (trigger call)
        ▼
  Twilio REST API  ──────────────────────────────┐
        │  dials patient phone                    │
        ▼                                         │
   Patient answers                               │
        │                                         │
        │  POST /voice  (greeting + menu)         │
        ▼                                         │
  Express IVR Server  ◄──────────────────────────┘
  (twilio-ivr/server.js)
        │
        ├─ POST /handle-input  (DTMF 1-4, 0)
        ├─ POST /book-slot     (slot picker)
        ├─ POST /status        (call status callback)
        ├─ GET  /responses     (JSON log)
        └─ GET  /responses/html (visual log table)
```

---

## Setup (ek baar)

```bash
cd twilio-ivr
npm install
cp .env.example .env
# .env mein apni values bharo
```

---

## Chalane ke steps

### Step 1 — ngrok se public URL lo

```bash
ngrok http 3000
```
Output:  `Forwarding  https://xxxx.ngrok-free.app -> http://localhost:3000`

---

### Step 2 — .env update karo

```
WEBHOOK_BASE_URL=https://xxxx.ngrok-free.app
```

Next.js `.env.local` mein bhi add karo (doctor dashboard trigger ke liye):
```
TWILIO_ACCOUNT_SID=ACxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxx
TWILIO_FROM_NUMBER=+1XXXXXXXXXX
TWILIO_IVR_BASE_URL=https://xxxx.ngrok-free.app
```

---

### Step 3 — IVR server start karo

```bash
npm start
```

---

### Step 4 — Call trigger karo

Default (env se number lega):
```bash
npm run call
```

Custom patient:
```bash
node make-call.js --to=+918XXXXXXXXX --name="Meera Madavi" --lang=mr
```

Lang options: `mr` (Marathi, default) · `hi` (Hindi) · `en` (English)

---

## IVR Menu

> "Namaskar [naam] tai. Mi JanVaani ahe, PHC Armori cha AI sahayak."

| Key | Action |
|-----|--------|
| **1** | Doctor & OPD hours |
| **2** | Medicine availability |
| **3** | Book appointment (slot select) |
| **4** | Referral / lab status |
| **0** | Repeat menu |

Slot select ke baad → SMS confirmation patient ko jaati hai.

---

## Call logs dekho

```
http://localhost:3000/responses/html   ← Visual table
http://localhost:3000/responses        ← Raw JSON
```

---

## responses.json entry example

```json
{
  "timestamp": "2026-09-01T10:30:00.000Z",
  "callSid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "caller": "+918384041061",
  "patientName": "Meera Madavi",
  "lang": "mr",
  "digit": "3-1",
  "intent": "appointment_booked",
  "slot": "09:00–09:20",
  "date": "2026-09-02",
  "finalStatus": "completed",
  "duration": "42"
}
```

---

## Twilio Trial Note

- Free trial mein sirf **verified numbers** pe call ja sakti hai
- Number verify karo: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
- `TWILIO_TO_NUMBER` mein wही number dalo jo verified ho
