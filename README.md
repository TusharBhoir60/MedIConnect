# Bharat Byte | JanArogya

**SIH26133**

JanArogya is a multilingual, low-connectivity healthcare coordination prototype for rural Maharashtra. It connects an ASHA worker's home visit with the PHC Medical Officer (MO), while using voice, SMS-style updates and an automated JanVaani IVR to keep patients in the care loop.

> This repository contains a hackathon/demo prototype. The default data is seeded locally and the authentication, notifications and integrations must be hardened before production use.

## Problem

ASHA workers often collect important information during home visits, but low connectivity, fragmented records and delayed escalation make it difficult for PHC staff to act quickly. JanArogya provides one workflow for:

- recording structured and voice-based home-visit notes;
- queuing submissions when signal is unavailable;
- allowing the doctor to review, triage and advise remotely;
- tracking referrals, follow-ups, laboratory orders and medicine stockouts;
- escalating emergencies with an acknowledgement SLA; and
- reaching patients in Marathi, Hindi or English through JanVaani IVR.

## Main Workflows

### ASHA PWA

Open `/asha` on a phone or install it from the browser menu.

- Dashboard for assigned patients, visits and pending work
- Patient registration and patient detail view
- Home-visit workflow with notes, voice recording and attachments
- Urgency tags: routine, urgent and emergency
- Offline queue indicator and sync flow for low-signal areas
- Follow-up tasks and care plans for ANC, immunisation and NCD care
- Referral creation and referral status tracking through facility closure
- Emergency raising and escalation to the PHC / Rural Hospital / 108
- Lab order coordination and medicine stockout reporting
- ASHA earnings view
- Marathi, Hindi and English language switch

### PHC Doctor Desk

Open `/doctor` on desktop or mobile.

- Review submitted ASHA visits
- Triage as non-emergency, emergency or district-hospital referral
- Add doctor advice and automatically create follow-up work
- View patient history, ABHA-style identifier and care plan
- Track referrals and their outcomes
- Order diagnostics and update result status
- View facility hours, queue, doctors, medicines and diagnostics
- Monitor stockout reports
- Review emergency cases and acknowledge or escalate them
- Trigger JanVaani calls for patient follow-up

### JanVaani IVR

The IVR supports Marathi (`mr`), Hindi (`hi`) and English (`en`). A patient can receive a call, choose a language using DTMF, hear a personalised health prompt and choose a response or appointment slot. In live mode, Twilio handles the phone call and the Express service handles the IVR callbacks.

Without Twilio credentials, `/api/ivr/call` intentionally runs in demo mode and returns the generated script preview instead of placing a call.

## Route Map

| Route | Purpose |
| --- | --- |
| `/` | Product landing page and portal links |
| `/asha` | ASHA dashboard |
| `/asha/login` | Demo ASHA login form |
| `/asha/patients/:id` | Patient profile |
| `/asha/visit` | Record a home visit |
| `/asha/workflow` | Visit and care workflow |
| `/asha/tasks` | Follow-up tasks |
| `/asha/follow-up` | Follow-up management |
| `/asha/referrals` | Referral tracking |
| `/asha/emergency` | Emergency cases |
| `/asha/earnings` | ASHA earnings |
| `/doctor` | PHC doctor dashboard |
| `/doctor/patient/:id` | Doctor patient view |
| `/doctor/abha` | ABHA-style patient lookup/flow |
| `/doctor/referrals` | Doctor referral management |
| `/doctor/facility` | PHC facility overview |

## Tech Stack

- Next.js 14 App Router
- React 18 and TypeScript
- Tailwind CSS 3 with PostCSS
- `lucide-react` for icons
- Browser `localStorage` for the demo store	
- Service worker and web manifest for the ASHA PWA
- Twilio REST API and TwiML for live calls
- Express, Twilio and `dotenv` in `twilio-ivr/`

## Getting Started

### Main Next.js app

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Available scripts:

```bash
npm run dev       # development server
npm run build     # production build
npm run start     # serve the production build
```

The app starts with seeded demo records. Changes are persisted in the browser under the `janarogya-v3` localStorage key. Clear that key or browser site data to reset the demo state.

### Demo login

The ASHA login form accepts any non-empty phone number and OTP. It is a UI/demo authentication flow and does not validate a real OTP.

## Live JanVaani / Twilio Setup

The IVR has two parts: Next.js API routes trigger calls and `twilio-ivr/` contains the Express callback server.

1. Install the IVR service dependencies:

	```bash
	cd twilio-ivr
	npm install
	```

2. Start the public tunnel and note its HTTPS URL:

	```bash
	ngrok http 3000
	```

3. Add the following values to the main app's `.env.local`:

	```env
	NEXT_PUBLIC_BASE_URL=https://<public-nextjs-url>
	TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
	TWILIO_AUTH_TOKEN=your_twilio_auth_token
	TWILIO_FROM_NUMBER=+1XXXXXXXXXX
	TWILIO_IVR_BASE_URL=https://<public-ivr-url>
	# Set this only for a Twilio trial account when needed
	TWILIO_TRIAL_ACCOUNT=true
	```

4. Configure the IVR service environment as described in [`twilio-ivr/README.md`](twilio-ivr/README.md), then start it:

	```bash
	npm start
	```

5. Verify the Next.js endpoint:

	```bash
	curl http://localhost:3000/api/ivr/health
	```

For a Twilio trial account, the destination phone number must be verified in the Twilio Console. Never commit `.env.local` or any Twilio credentials.

## IVR API Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/ivr/health` | GET | Reachability and configuration check |
| `/api/ivr/call` | POST | Trigger a demo or live outbound call |
| `/api/ivr/voice` | GET/POST | Initial language selection prompt |
| `/api/ivr/voice/lang` | GET/POST | Apply selected language |
| `/api/ivr/voice/answer` | GET/POST | Process patient response |
| `/api/ivr/voice/slot` | GET/POST | Collect appointment slot selection |
| `/api/ivr/book` | POST | Book an appointment from the IVR flow |
| `/api/ivr/action` | POST | Process IVR actions |
| `/api/ivr/complete` | POST | Receive call completion callback |

Example request:

```bash
curl -X POST http://localhost:3000/api/ivr/call \
  -H 'Content-Type: application/json' \
  -d '{"to":"+918XXXXXXXXX","name":"Meera Madavi","lang":"mr","complaint":"fever","urgency":"routine"}'
```

## Data and Privacy Notes

- Seed data is defined in `lib/seed.ts` and is loaded into the client-side store.
- The prototype persists health-related demo data in browser localStorage; this is not suitable for production PHI/PII storage.
- IVR appointment state in `lib/ivrStore.ts` is process-local memory. A multi-instance deployment needs a database or Redis.
- Production deployment should add real authentication, authorisation, encryption, audit logs, consent, retention rules, secure file storage, server-side validation and verified ABDM/ABHA integration.
- Use HTTPS for all public callbacks and keep Twilio secrets server-side.

## Project Structure

```text
app/                  Next.js pages and IVR API routes
components/           ASHA/doctor shells, navigation and shared UI
lib/types.ts          Domain models and status types
lib/seed.ts           Demo PHC, patient and workflow data
lib/store.tsx         Client store and local persistence
lib/ivrStore.ts       Process-local IVR appointment state
public/               Service worker, manifest and PWA assets
twilio-ivr/           Express IVR callback server and call utility
```

## Team / Submission

**Team:** Bharat Byte  
**SIH Problem ID:** SIH26133  
**Project:** JanArogya
