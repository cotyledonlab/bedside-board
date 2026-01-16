<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=waving&color=0:020617,100:0f172a&height=200&section=header&text=bedside-board&fontSize=50&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Personal%20health%20dashboard%20for%20hospital%20patients&descAlignY=55&descSize=16">
  <img alt="bedside-board header" src="https://capsule-render.vercel.app/api?type=waving&color=0:020617,100:0f172a&height=200&section=header&text=bedside-board&fontSize=50&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Personal%20health%20dashboard%20for%20hospital%20patients&descAlignY=55&descSize=16">
</picture>

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-WAL-003B57?style=flat-square&logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)

**A simple, touch-friendly dashboard to track daily health status during hospital stays.**

*Track mood, symptoms, medical events, and questions for your care team—all in one place.*

</div>

---

## ✨ Features

### 📊 Health Tracking
- **Mood tracker** — Quick emoji-based mood logging (😫 😔 😐 🙂 😄)
- **Custom metrics** — Track pain, anxiety, energy, or any metric that matters to you
- **Daily notes** — Record symptoms, thoughts, and observations

### 🩺 Medical Event Logging
- **One-tap logging** — Quickly log obs, bloods, ECG, scans, doctor rounds, medications, and meals
- **Timestamped entries** — Every event is recorded with the exact time
- **Customizable events** — Add your own event types in settings

### ❓ Questions for Your Team
- **Track questions** — Write down questions as you think of them
- **Mark as answered** — Check off questions after speaking with your care team
- **Never forget** — All your questions are saved and ready for the next round

### 📋 Daily Summary
- **Copy to clipboard** — Generate a formatted summary to share with nurses or doctors
- **Hospital day counter** — Shows "Day X in hospital" based on your admission date
- **Historical view** — Navigate back to previous days to review your journey

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ 
- npm or yarn

### Development

```bash
# Clone the repository
git clone https://github.com/cotyledonlab/bedside-board.git
cd bedside-board

# Install dependencies
npm install

# Start development servers (frontend + backend)
npm run dev
```

The app will be available at `http://localhost:5173` with the API running on port `3001`.

### Production Build

```bash
# Build frontend and server
npm run build
npm run build:server

# Start production server
NODE_ENV=production npm start
```

---

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker compose up -d
```

The app will be available on port `3000` with persistent SQLite storage in a Docker volume.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `DB_PATH` | `./data/bedside.db` | SQLite database path |
| `VITE_API_URL` | _(empty)_ | API base URL for frontend |

---

## 🏗️ Architecture

```
bedside-board/
├── src/                  # React frontend
│   ├── App.tsx          # Main dashboard component
│   ├── Settings.tsx     # Settings modal
│   └── storage.ts       # API client & utilities
├── server/              # Express backend
│   ├── index.ts         # API server
│   └── db.ts            # SQLite database layer
└── data/                # SQLite database (auto-created)
```

**Tech Stack:**
- **Frontend:** React 19, Vite 6, TypeScript
- **Backend:** Express.js, better-sqlite3
- **Database:** SQLite with WAL mode for reliability
- **Deployment:** Docker with multi-stage builds

---

## 📱 Usage Tips

1. **Set your admission date** — This enables the "Day X" counter
2. **Customize your metrics** — Use ⚙️ Settings to add/remove what you want to track
3. **Log events as they happen** — Tap the event buttons right after obs, meals, etc.
4. **Write questions immediately** — Add questions as you think of them so you don't forget
5. **Copy the summary** — Use 📋 Copy before doctor rounds to share your status

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

## 📄 License

This project is part of [cotyledonlab](https://github.com/cotyledonlab).

---

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=waving&color=0:020617,100:0f172a&height=100&section=footer">
  <img alt="footer" src="https://capsule-render.vercel.app/api?type=waving&color=0:020617,100:0f172a&height=100&section=footer">
</picture>
