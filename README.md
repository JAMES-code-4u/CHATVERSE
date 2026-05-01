# chatVerse — Complete Setup & Implementation Guide
💬 ChatVerse – Real-Time Chat Application

ChatVerse is a modern, full-stack real-time chat application built to deliver seamless communication with a clean UI and powerful features. It supports instant messaging, live updates, and interactive user experiences.

🚀 Features
⚡ Real-Time Messaging using WebSockets
🔐 Secure Authentication with JWT
📞 Audio/Video Calling support
🟢 Online/Offline Status Tracking
💬 Private & Group Chats
🎨 Customizable UI (Dark/Light Mode)
🔔 Instant Notifications
📁 Media Sharing (Images, Files, etc.)
⚙️ User Settings Panel
🛠️ Tech Stack
Frontend
React.js
Context API
Axios
Socket.IO Client
Backend
Node.js
Express.js
Socket.IO
MongoDB
🔐 Authentication

ChatVerse uses JWT (JSON Web Tokens) for secure user authentication and session management.

## Project Structure

```
chatverse/
├── backend/
│   ├── middleware/
│   │   └── auth.js              ← JWT protection middleware
│   ├── models/
│   │   ├── User.js              ← User schema (bcrypt passwords)
│   │   └── Message.js           ← Message schema (text/image/audio/video/file)
│   ├── routes/
│   │   ├── auth.js              ← POST /register, POST /login, GET /me
│   │   ├── users.js             ← GET /users, PUT /avatar, POST /contacts
│   │   └── messages.js          ← GET /:userId, POST /send, POST /upload
│   ├── socket/
│   │   └── socketHandler.js     ← All real-time: chat, WebRTC signaling, typing
│   ├── uploads/                 ← Auto-created: images, audio, videos, files
│   ├── .env.example
│   ├── package.json
│   └── server.js               ← Express + Socket.io + MongoDB entry
│
└── frontend/
    ├── public/
    │   └── index.html           ← Tailwind CDN + Google Fonts + Material Symbols
    └── src/
        ├── context/
        │   ├── AuthContext.js   ← Login/register/logout global state
        │   └── SocketContext.js ← Socket.io connection + online users
        ├── components/
        │   ├── CallModal.js     ← WebRTC video/voice call + screen sharing
        │   └── IncomingCallAlert.js ← Incoming call notification UI
        ├── pages/
        │   ├── LoginPage.js     ← Auth page (login + register)
        │   └── ChatPage.js      ← Main chat UI (exact design match)
        ├── App.js               ← React Router setup
        └── index.js             ← App entry point
```

---

## Prerequisites

- **Node.js** v18+ — https://nodejs.org
- **MongoDB** running locally OR a free MongoDB Atlas cluster — https://mongodb.com/atlas
- **npm** (comes with Node.js)

---

## Step 1 — Backend Setup

```bash
# Navigate to backend
cd chatverse/backend

# Install dependencies
npm install

# Change .env.example to .env
rename ".env.example" to ".env"
```


```

> **MongoDB Atlas?** Replace MONGO_URI with your Atlas connection string:
> `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/chatverse`

```bash
# Create upload directories
mkdir -p uploads/avatars uploads/images uploads/audio uploads/videos uploads/files

# Start backend in dev mode
npm run dev

# Expected output:
# ✅ MongoDB connected
# 🚀 Server running on port 5000
```

---

## Step 2 — Frontend Setup

```bash
# Navigate to frontend
cd chatverse/frontend

# Install dependencies
npm install

# Start React dev server
npm start

# App opens at http://localhost:3000
```

---

## Step 3 — How Each Feature Works

### 1. Authentication (Login Page)
- **Register**: POST `/api/auth/register` → creates user, returns JWT
- **Login**: POST `/api/auth/login` → validates bcrypt password, returns JWT
- JWT stored in `localStorage`, sent with every API request as `Authorization: Bearer <token>`
- Auto-login on page refresh via `/api/auth/me`

### 2. Real-Time Messaging
- On connect, Socket.io authenticates via JWT in `handshake.auth.token`
- **Send message**: `socket.emit('sendMessage', { receiverId, content, type })`
- **Receive message**: `socket.on('receiveMessage', msg => ...)`
- Messages persisted in MongoDB `messages` collection
- Unread badge counts fetched from `/api/messages/unread/count`

### 3. File Sharing (Photos, Audio, Video, ZIP/Files)
- Files uploaded via `POST /api/messages/upload` (multipart/form-data)
- Multer routes files by MIME type:
  - Images → `uploads/images/`
  - Audio → `uploads/audio/`
  - Videos → `uploads/videos/`
  - Everything else → `uploads/files/`
- Max file size: **50 MB**
- Served statically via `/uploads/...`

### 4. Video Call (WebRTC + simple-peer)
Flow:
```
Caller clicks video icon
  → getUserMedia(video+audio)
  → SimplePeer(initiator:true)
  → socket.emit('callUser', { userToCall, signalData, callType:'video' })

Receiver gets socket.on('incomingCall')
  → IncomingCallAlert shown
  → Accept → getUserMedia → SimplePeer(initiator:false)
  → p.signal(callData.signal)
  → socket.emit('answerCall', { signal })

Caller gets socket.on('callAccepted')
  → p.signal(signal) → P2P established!
```

### 5. Voice Call
Same as Video Call but `getUserMedia({ audio: true, video: false })`.
`callType: 'voice'` passed through signal chain.

### 6. Screen Sharing (During Video Call)
```js
// Inside CallModal.js
const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
// Replace video track in peer connection
const sender = peer._pc.getSenders().find(s => s.track?.kind === 'video')
sender.replaceTrack(screenStream.getVideoTracks()[0])
```
- Remote user's display automatically updates (no re-negotiation needed)
- Stops when user clicks "Stop sharing" or closes the system share dialog

### 7. AI Voice Messaging
- Uses browser's `MediaRecorder` API to capture mic audio
- **Hold mic button** → records; **release** → stops and uploads as `audio/webm`
- Message appears in chat as an `<audio>` player with "AI" badge
- To enhance with real AI: pipe the audio blob to OpenAI Whisper (transcription) or ElevenLabs (synthesis) before sending

### 8. Typing Indicators
```js
// Sender emits
socket.emit('typing', { receiverId, isTyping: true })
// After 1.5s inactivity
socket.emit('typing', { receiverId, isTyping: false })

// Receiver sees animated dots
socket.on('userTyping', ({ userId, isTyping }) => setPartnerTyping(isTyping))
```

### 9. Online/Offline Status
- On socket connect: user's status set to `"online"` in DB
- `io.emit('onlineUsers', [...])` broadcasts to all clients
- On disconnect: set to `"offline"`, update `lastSeen`
- Green dot shown in conversation list and chat header

---

## Step 4 — Adding Real AI Voice (Optional Enhancement)

Install `openai` in backend:
```bash
cd backend && npm install openai
```

Add to `routes/messages.js` after receiving audio upload:
```js
const OpenAI = require('openai')
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Transcribe
const transcription = await openai.audio.transcriptions.create({
  file: fs.createReadStream(req.file.path),
  model: 'whisper-1',
})
// Save transcription as message content
message.content = transcription.text
```

Add to `.env`:
```env
OPENAI_API_KEY=sk-...
```

---

## Step 5 — Production Deployment

### Backend (Railway / Render / VPS)
```bash
# Set environment variables in your hosting dashboard
# PORT, MONGO_URI (Atlas), JWT_SECRET, CLIENT_URL (your frontend domain)

npm start
```

### Frontend (Vercel / Netlify)
```bash
# Set environment variable
REACT_APP_SERVER_URL=https://your-backend-url.com

npm run build
# Deploy the /build folder
```

### CORS
Update `CLIENT_URL` in backend `.env` to your deployed frontend URL.

---

## Quick Troubleshooting

| Issue | Fix |
|-------|-----|
| Camera/mic not working | Must be on HTTPS or localhost; check browser permissions |
| WebRTC fails over internet | Deploy a TURN server (Twilio, Metered.ca) and pass iceServers to SimplePeer |
| MongoDB connection refused | Start MongoDB: `mongod --dbpath /data/db` |
| CORS error | Ensure `CLIENT_URL` in backend `.env` matches frontend origin exactly |
| File uploads not visible | Backend serves `/uploads` statically; check `REACT_APP_SERVER_URL` points to backend |

---

## TURN Server (Required for WebRTC over the internet)

For calls to work across different networks (not just localhost), add TURN server credentials:

**In `CallModal.js`**, update SimplePeer creation:
```js
const p = new SimplePeer({
  initiator: true,
  trickle: false,
  stream: s,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      {
        urls: 'turn:your-turn-server.com:3478',
        username: 'your-username',
        credential: 'your-credential',
      }
    ]
  }
})
```

Free TURN servers: **Metered.ca** (https://www.metered.ca/tools/openrelay/)

---

## Summary of API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ✗ | Create account |
| POST | `/api/auth/login` | ✗ | Login, get JWT |
| GET | `/api/auth/me` | ✓ | Get current user |
| GET | `/api/users` | ✓ | List/search users |
| GET | `/api/users/:id` | ✓ | Get user by ID |
| PUT | `/api/users/avatar` | ✓ | Upload avatar |
| GET | `/api/messages/:userId` | ✓ | Get conversation |
| POST | `/api/messages/send` | ✓ | Send text message |
| POST | `/api/messages/upload` | ✓ | Upload file/media |
| GET | `/api/messages/unread/count` | ✓ | Unread counts |

## Summary of Socket Events

| Event (emit) | Direction | Description |
|--------------|-----------|-------------|
| `sendMessage` | Client→Server | Send a message |
| `receiveMessage` | Server→Client | Incoming message |
| `messageSent` | Server→Client | Confirm sent |
| `typing` | Client→Server | Typing status |
| `userTyping` | Server→Client | Partner typing |
| `markRead` | Client→Server | Mark messages read |
| `callUser` | Client→Server | Initiate call |
| `incomingCall` | Server→Client | Notify of call |
| `answerCall` | Client→Server | Accept call |
| `callAccepted` | Server→Client | Call answered |
| `rejectCall` | Client→Server | Decline call |
| `callRejected` | Server→Client | Call declined |
| `endCall` | Client→Server | End active call |
| `callEnded` | Server→Client | Call ended |
| `iceCandidate` | Both | WebRTC ICE exchange |
| `screenShare` | Client→Server | Toggle screen share |
| `onlineUsers` | Server→Client | Online user list |
