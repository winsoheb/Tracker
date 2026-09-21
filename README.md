# WorkOrbit v1.0

A premium, futuristic productivity application built to help you log your office work, track time, and visualize where your hours go.

## 🚀 Features (Version 1.0)

- **Live Multi-Timer Dashboard**: Start, pause, and stop multiple tasks concurrently. Timers utilize `framer-motion` for smooth layout animations.
- **Manual Time Entry**: Forgot to start a timer? Log entries manually specifying duration or start/end times.
- **Day-by-Day Reports**: Filter your time entries (Today, Last 7 Days, Last 30 Days) and view them grouped by day with daily total calculations.
- **Data Insights**: Interactive dashboard displaying total time and a time-by-category breakdown.
- **Focus Mode**: Expand any active timer into a distraction-free, fullscreen "Focus Mode" with a massive clock display.
- **Global Command Palette**: Navigate the app instantly using the `Alt + K` keyboard shortcut.
- **Dark/Light Mode**: Full system-aware theming with a sleek glassmorphism design (translucency, glowing gradients, neon accents).
- **Data Export**: Export any filtered date range of time entries directly to CSV.

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + custom glassmorphism utilities (`index.css`)
- **Animations**: Framer Motion
- **Database**: SQLite (via Prisma ORM)
- **Deployment**: Docker + GitHub Actions (CI/CD to Linux Server)

## 🐳 Deployment (Docker & CI/CD)

The application is fully containerized and includes an automated CI/CD pipeline.

### Prerequisites for Server deployment:
1. Docker and Docker Compose installed.
2. A GitHub Personal Access Token (or SSH Key) configured in GitHub Secrets.

### Automated Deployment:
Any code pushed to the `main` branch automatically triggers `.github/workflows/deploy.yml`. 
1. **Build & Push**: The Docker image is built using Next.js `standalone` mode and pushed to `ghcr.io`.
2. **Deploy via SSH**: The action SSHs into your server, pulls the new image, and restarts the container using `docker-compose.yml`. 
3. **Data Persistence**: The SQLite `dev.db` file is safely stored in a persistent Docker volume (`sqlite_data`).

### Local Load Testing
A `k6` load testing script is included in `load-tests/basic-load.js`.
```bash
k6 run -e TARGET_URL=http://localhost:3000 load-tests/basic-load.js
```

## 💻 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Generate the Prisma Client and migrate the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.
