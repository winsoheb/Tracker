# Office Time Tracker

A personal Flask web app to log your office work, track time, and see where your
hours go. Runs locally on your machine at **http://127.0.0.1:7771**.

## Features

- **Two ways to log time** — live start/stop timers, or manual entry (by duration
  or by start/end times) for logging after the fact.
- **Multiple timers at once** — start a timer for each task you're juggling; every
  running task shows in “Running now” with its own live clock. Stop any one when
  that task is done to record its time, while the others keep running.
- **Categories** — pick from a preset list or type a new one on the fly; new ones
  are saved automatically. Manage the list in Settings.
- **Shift & break** — set your shift length (default 8 hours), start/end times, and
  a default break; record break minutes per task.
- **Insights dashboard**:
  - Time by category (doughnut chart)
  - Daily / weekly trends (work vs. break)
  - Shift vs. actual per day, with utilization %
  - Top tasks that consumed the most time
  - Range switch: today / this week / this month / last 30 days
- **Work log** — filter by date range, edit or delete any entry.
- **Reports** — generate a report for a single day, this week, last 7 days, this
  month, last 30 days, or a custom From–To range. Preview it on screen (summary,
  by category, by day, top tasks, all entries) and export to CSV — either the full
  entry list or a category/day summary.

All data is stored locally in a `timetracker.db` SQLite file created next to
`app.py` on first run. Nothing leaves your machine.

## Setup & run

You already have a `venv` in this folder. From a terminal in the project folder:

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

**Windows (Command Prompt):**
```cmd
venv\Scripts\activate.bat
pip install -r requirements.txt
python app.py
```

Then open **http://127.0.0.1:7771** in your browser.

To stop the app, press `Ctrl+C` in the terminal.

## Project structure

```
app.py                     Flask backend, routes, SQLite schema
requirements.txt           Python dependencies (Flask)
templates/
  base.html                Shared layout + nav
  index.html               Dashboard: timer, manual entry, today's log
  entries.html             Work log with date filter + inline edit
  insights.html            Charts dashboard
  reports.html             Report builder with date ranges + CSV export
  settings.html            Shift, break, and category management
static/
  css/style.css            Styling
  js/chart.umd.min.js      Chart.js (bundled, works offline)
timetracker.db             Your data (created automatically on first run)
```

## Notes

- The port is set to **7771** in `app.py` (`PORT = 7771`).
- Chart.js is bundled locally, so charts work without an internet connection.
- To reset all data, stop the app and delete `timetracker.db`; a fresh one is
  created on the next run.
