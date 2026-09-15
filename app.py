"""
Office Time Tracker
A personal Flask app to log work tasks, track time (live timer or manual entry),
manage an 8-hour shift with break time, and see where your time goes.

Run:  python app.py
Then open http://127.0.0.1:7771
"""

import os
import io
import csv
import sqlite3
from datetime import datetime, date, timedelta

from flask import (
    Flask,
    g,
    jsonify,
    redirect,
    render_template,
    request,
    url_for,
    Response,
)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "timetracker.db")
PORT = 7771

app = Flask(__name__)

DEFAULT_CATEGORIES = [
    "Email",
    "Meetings",
    "Development",
    "Documentation",
    "Planning",
    "Support",
    "Admin",
    "Breaks",
]

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            shift_hours REAL NOT NULL DEFAULT 8,
            shift_start TEXT NOT NULL DEFAULT '09:00',
            shift_end   TEXT NOT NULL DEFAULT '17:00',
            default_break_minutes INTEGER NOT NULL DEFAULT 60
        );

        CREATE TABLE IF NOT EXISTS categories (
            id   INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS entries (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            task           TEXT NOT NULL,
            category       TEXT NOT NULL DEFAULT 'Uncategorized',
            work_date      TEXT NOT NULL,
            start_time     TEXT,
            end_time       TEXT,
            duration_secs  INTEGER NOT NULL DEFAULT 0,
            break_minutes  INTEGER NOT NULL DEFAULT 0,
            notes          TEXT DEFAULT '',
            created_at     TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS running_timers (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            task       TEXT NOT NULL,
            category   TEXT NOT NULL,
            notes      TEXT DEFAULT '',
            started_at TEXT NOT NULL
        );

        -- legacy single-timer table (kept only for one-time migration)
        CREATE TABLE IF NOT EXISTS active_timer (
            id         INTEGER PRIMARY KEY CHECK (id = 1),
            task       TEXT NOT NULL,
            category   TEXT NOT NULL,
            notes      TEXT DEFAULT '',
            started_at TEXT NOT NULL
        );
        """
    )
    # migrate any existing single active timer into running_timers
    legacy = db.execute("SELECT * FROM active_timer WHERE id = 1").fetchone()
    if legacy is not None:
        db.execute(
            "INSERT INTO running_timers (task, category, notes, started_at) "
            "VALUES (?, ?, ?, ?)",
            (legacy["task"], legacy["category"], legacy["notes"], legacy["started_at"]),
        )
        db.execute("DELETE FROM active_timer WHERE id = 1")
    # seed a settings row
    row = db.execute("SELECT id FROM settings WHERE id = 1").fetchone()
    if row is None:
        db.execute("INSERT INTO settings (id) VALUES (1)")
    # seed categories
    count = db.execute("SELECT COUNT(*) AS c FROM categories").fetchone()["c"]
    if count == 0:
        db.executemany(
            "INSERT OR IGNORE INTO categories (name) VALUES (?)",
            [(c,) for c in DEFAULT_CATEGORIES],
        )
    db.commit()
    db.close()


def get_settings():
    row = get_db().execute("SELECT * FROM settings WHERE id = 1").fetchone()
    return dict(row)


def get_categories():
    rows = get_db().execute("SELECT name FROM categories ORDER BY name").fetchall()
    return [r["name"] for r in rows]


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------


def fmt_hms(seconds):
    seconds = int(seconds or 0)
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    if h:
        return f"{h}h {m}m"
    if m:
        return f"{m}m {s}s"
    return f"{s}s"


app.jinja_env.filters["hms"] = fmt_hms


def today_str():
    return date.today().isoformat()


# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------


@app.route("/")
def index():
    db = get_db()
    settings = get_settings()
    categories = get_categories()
    timers = db.execute(
        "SELECT * FROM running_timers ORDER BY started_at ASC"
    ).fetchall()

    today = today_str()
    entries = db.execute(
        "SELECT * FROM entries WHERE work_date = ? ORDER BY id DESC", (today,)
    ).fetchall()
    total_secs = sum(e["duration_secs"] for e in entries)
    total_break = sum(e["break_minutes"] for e in entries)

    shift_secs = settings["shift_hours"] * 3600
    remaining = shift_secs - total_secs

    return render_template(
        "index.html",
        settings=settings,
        categories=categories,
        timers=timers,
        entries=entries,
        today=today,
        total_secs=total_secs,
        total_break=total_break,
        shift_secs=shift_secs,
        remaining=remaining,
        now=datetime.now().strftime("%H:%M"),
    )


@app.route("/entries")
def entries_page():
    db = get_db()
    # optional date range filter
    start = request.args.get("start") or (date.today() - timedelta(days=13)).isoformat()
    end = request.args.get("end") or today_str()
    rows = db.execute(
        "SELECT * FROM entries WHERE work_date BETWEEN ? AND ? "
        "ORDER BY work_date DESC, id DESC",
        (start, end),
    ).fetchall()
    total = sum(r["duration_secs"] for r in rows)
    return render_template(
        "entries.html",
        entries=rows,
        start=start,
        end=end,
        categories=get_categories(),
        total=total,
    )


@app.route("/insights")
def insights_page():
    return render_template("insights.html", settings=get_settings())


@app.route("/reports")
def reports_page():
    today = today_str()
    return render_template("reports.html", today=today, settings=get_settings())


@app.route("/settings")
def settings_page():
    return render_template(
        "settings.html", settings=get_settings(), categories=get_categories()
    )


# ---------------------------------------------------------------------------
# Timer actions
# ---------------------------------------------------------------------------


@app.route("/timer/start", methods=["POST"])
def timer_start():
    db = get_db()
    task = (request.form.get("task") or "").strip()
    category = (request.form.get("category") or "Uncategorized").strip()
    notes = (request.form.get("notes") or "").strip()
    if not task:
        return redirect(url_for("index"))
    # multiple timers can run at once — just add a new one
    db.execute(
        "INSERT INTO running_timers (task, category, notes, started_at) "
        "VALUES (?, ?, ?, ?)",
        (task, category, notes, datetime.now().isoformat(timespec="seconds")),
    )
    _ensure_category(category)
    db.commit()
    return redirect(url_for("index"))


@app.route("/timer/<int:timer_id>/stop", methods=["POST"])
def timer_stop(timer_id):
    db = get_db()
    timer = db.execute(
        "SELECT * FROM running_timers WHERE id = ?", (timer_id,)
    ).fetchone()
    if timer is None:
        return redirect(url_for("index"))
    started = datetime.fromisoformat(timer["started_at"])
    ended = datetime.now()
    duration = max(0, int((ended - started).total_seconds()))
    break_minutes = int(request.form.get("break_minutes") or 0)
    db.execute(
        "INSERT INTO entries (task, category, work_date, start_time, end_time, "
        "duration_secs, break_minutes, notes, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            timer["task"],
            timer["category"],
            started.date().isoformat(),
            started.strftime("%H:%M"),
            ended.strftime("%H:%M"),
            duration,
            break_minutes,
            timer["notes"],
            ended.isoformat(timespec="seconds"),
        ),
    )
    db.execute("DELETE FROM running_timers WHERE id = ?", (timer_id,))
    db.commit()
    return redirect(url_for("index"))


@app.route("/timer/<int:timer_id>/cancel", methods=["POST"])
def timer_cancel(timer_id):
    db = get_db()
    db.execute("DELETE FROM running_timers WHERE id = ?", (timer_id,))
    db.commit()
    return redirect(url_for("index"))


# ---------------------------------------------------------------------------
# Manual entries
# ---------------------------------------------------------------------------


def _ensure_category(name):
    name = (name or "").strip()
    if not name:
        return
    get_db().execute("INSERT OR IGNORE INTO categories (name) VALUES (?)", (name,))


def _parse_duration(form):
    """Accept either explicit hours/minutes or start/end times."""
    start_time = (form.get("start_time") or "").strip()
    end_time = (form.get("end_time") or "").strip()
    hours = form.get("hours")
    minutes = form.get("minutes")

    if hours or minutes:
        h = int(hours or 0)
        m = int(minutes or 0)
        return h * 3600 + m * 60, start_time, end_time

    if start_time and end_time:
        try:
            fmt = "%H:%M"
            t1 = datetime.strptime(start_time, fmt)
            t2 = datetime.strptime(end_time, fmt)
            secs = int((t2 - t1).total_seconds())
            if secs < 0:  # crosses midnight
                secs += 24 * 3600
            return secs, start_time, end_time
        except ValueError:
            return 0, start_time, end_time
    return 0, start_time, end_time


@app.route("/entries/add", methods=["POST"])
def entries_add():
    db = get_db()
    task = (request.form.get("task") or "").strip()
    if not task:
        return redirect(request.referrer or url_for("index"))
    category = (request.form.get("category") or "Uncategorized").strip() or "Uncategorized"
    work_date = request.form.get("work_date") or today_str()
    duration, start_time, end_time = _parse_duration(request.form)
    break_minutes = int(request.form.get("break_minutes") or 0)
    notes = (request.form.get("notes") or "").strip()

    _ensure_category(category)
    db.execute(
        "INSERT INTO entries (task, category, work_date, start_time, end_time, "
        "duration_secs, break_minutes, notes, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            task,
            category,
            work_date,
            start_time,
            end_time,
            duration,
            break_minutes,
            notes,
            datetime.now().isoformat(timespec="seconds"),
        ),
    )
    db.commit()
    return redirect(request.referrer or url_for("index"))


@app.route("/entries/<int:entry_id>/update", methods=["POST"])
def entries_update(entry_id):
    db = get_db()
    existing = db.execute(
        "SELECT * FROM entries WHERE id = ?", (entry_id,)
    ).fetchone()
    if existing is None:
        return redirect(request.referrer or url_for("entries_page"))

    task = (request.form.get("task") or "").strip()
    category = (request.form.get("category") or "Uncategorized").strip() or "Uncategorized"
    work_date = request.form.get("work_date") or today_str()
    break_minutes = int(request.form.get("break_minutes") or 0)
    notes = (request.form.get("notes") or "").strip()

    # duration comes from the hours/minutes fields on the edit form;
    # fall back to the existing duration if neither is supplied.
    hours = request.form.get("hours")
    minutes = request.form.get("minutes")
    if hours is not None or minutes is not None:
        duration = int(hours or 0) * 3600 + int(minutes or 0) * 60
    else:
        duration = existing["duration_secs"]

    # keep the original start time; shift the end time to match the new duration
    start_time = existing["start_time"]
    end_time = existing["end_time"]
    if start_time:
        try:
            t1 = datetime.strptime(start_time, "%H:%M")
            end_time = (t1 + timedelta(seconds=duration)).strftime("%H:%M")
        except ValueError:
            pass

    _ensure_category(category)
    db.execute(
        "UPDATE entries SET task=?, category=?, work_date=?, start_time=?, "
        "end_time=?, duration_secs=?, break_minutes=?, notes=? WHERE id=?",
        (task, category, work_date, start_time, end_time, duration,
         break_minutes, notes, entry_id),
    )
    db.commit()
    return redirect(request.referrer or url_for("entries_page"))


@app.route("/entries/<int:entry_id>/delete", methods=["POST"])
def entries_delete(entry_id):
    db = get_db()
    db.execute("DELETE FROM entries WHERE id = ?", (entry_id,))
    db.commit()
    return redirect(request.referrer or url_for("entries_page"))


# ---------------------------------------------------------------------------
# Settings + categories
# ---------------------------------------------------------------------------


@app.route("/settings/save", methods=["POST"])
def settings_save():
    db = get_db()
    shift_hours = float(request.form.get("shift_hours") or 8)
    shift_start = request.form.get("shift_start") or "09:00"
    shift_end = request.form.get("shift_end") or "17:00"
    default_break = int(request.form.get("default_break_minutes") or 60)
    db.execute(
        "UPDATE settings SET shift_hours=?, shift_start=?, shift_end=?, "
        "default_break_minutes=? WHERE id=1",
        (shift_hours, shift_start, shift_end, default_break),
    )
    db.commit()
    return redirect(url_for("settings_page"))


@app.route("/categories/add", methods=["POST"])
def categories_add():
    name = (request.form.get("name") or "").strip()
    if name:
        _ensure_category(name)
        get_db().commit()
    return redirect(request.referrer or url_for("settings_page"))


@app.route("/categories/delete", methods=["POST"])
def categories_delete():
    name = (request.form.get("name") or "").strip()
    if name:
        get_db().execute("DELETE FROM categories WHERE name = ?", (name,))
        get_db().commit()
    return redirect(request.referrer or url_for("settings_page"))


# ---------------------------------------------------------------------------
# Insights API
# ---------------------------------------------------------------------------


def _range_bounds(range_key):
    today = date.today()
    if range_key == "today":
        return today, today
    if range_key == "week":
        start = today - timedelta(days=today.weekday())  # Monday
        return start, today
    if range_key == "month":
        return today.replace(day=1), today
    if range_key == "30days":
        return today - timedelta(days=29), today
    # default: last 7 days
    return today - timedelta(days=6), today


@app.route("/api/insights")
def api_insights():
    db = get_db()
    range_key = request.args.get("range", "week")
    start, end = _range_bounds(range_key)
    start_s, end_s = start.isoformat(), end.isoformat()
    settings = get_settings()

    rows = db.execute(
        "SELECT * FROM entries WHERE work_date BETWEEN ? AND ?",
        (start_s, end_s),
    ).fetchall()

    total_secs = sum(r["duration_secs"] for r in rows)
    total_break = sum(r["break_minutes"] for r in rows)

    # by category
    by_cat = {}
    for r in rows:
        by_cat[r["category"]] = by_cat.get(r["category"], 0) + r["duration_secs"]
    by_cat = dict(sorted(by_cat.items(), key=lambda kv: kv[1], reverse=True))

    # by day (with break minutes)
    by_day = {}
    d = start
    while d <= end:
        by_day[d.isoformat()] = {"work": 0, "break": 0}
        d += timedelta(days=1)
    for r in rows:
        wd = r["work_date"]
        if wd not in by_day:
            by_day[wd] = {"work": 0, "break": 0}
        by_day[wd]["work"] += r["duration_secs"]
        by_day[wd]["break"] += r["break_minutes"] * 60

    # top tasks
    by_task = {}
    for r in rows:
        by_task[r["task"]] = by_task.get(r["task"], 0) + r["duration_secs"]
    top_tasks = sorted(by_task.items(), key=lambda kv: kv[1], reverse=True)[:10]

    # shift vs actual
    num_days_with_data = len([d for d, v in by_day.items() if v["work"] > 0])
    shift_target_secs = settings["shift_hours"] * 3600 * max(num_days_with_data, 0)

    return jsonify(
        {
            "range": range_key,
            "start": start_s,
            "end": end_s,
            "total_secs": total_secs,
            "total_break_minutes": total_break,
            "shift_hours": settings["shift_hours"],
            "days_worked": num_days_with_data,
            "shift_target_secs": shift_target_secs,
            "by_category": {
                "labels": list(by_cat.keys()),
                "seconds": list(by_cat.values()),
            },
            "by_day": {
                "labels": list(by_day.keys()),
                "work_secs": [v["work"] for v in by_day.values()],
                "break_secs": [v["break"] for v in by_day.values()],
            },
            "top_tasks": [
                {"task": t, "seconds": s} for t, s in top_tasks
            ],
        }
    )


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------


def _clean_date(value, fallback):
    """Validate a YYYY-MM-DD string; return fallback if malformed/missing."""
    try:
        return datetime.strptime(value, "%Y-%m-%d").date().isoformat()
    except (ValueError, TypeError):
        return fallback


def _report_range():
    """Resolve start/end (YYYY-MM-DD) from ?start=&end= query params."""
    today = date.today()
    start = _clean_date(request.args.get("start"), today.isoformat())
    end = _clean_date(request.args.get("end"), today.isoformat())
    if start > end:
        start, end = end, start
    return start, end


def _report_data(start_s, end_s):
    db = get_db()
    rows = db.execute(
        "SELECT * FROM entries WHERE work_date BETWEEN ? AND ? "
        "ORDER BY work_date ASC, id ASC",
        (start_s, end_s),
    ).fetchall()

    total = sum(r["duration_secs"] for r in rows)
    total_break = sum(r["break_minutes"] for r in rows)

    by_cat = {}
    for r in rows:
        by_cat[r["category"]] = by_cat.get(r["category"], 0) + r["duration_secs"]
    by_cat = dict(sorted(by_cat.items(), key=lambda kv: kv[1], reverse=True))

    by_day = {}
    for r in rows:
        d = by_day.setdefault(r["work_date"], {"work": 0, "break": 0, "count": 0})
        d["work"] += r["duration_secs"]
        d["break"] += r["break_minutes"]
        d["count"] += 1

    by_task = {}
    for r in rows:
        by_task[r["task"]] = by_task.get(r["task"], 0) + r["duration_secs"]
    top_tasks = sorted(by_task.items(), key=lambda kv: kv[1], reverse=True)

    return rows, total, total_break, by_cat, by_day, top_tasks


@app.route("/api/report")
def api_report():
    start_s, end_s = _report_range()
    settings = get_settings()
    rows, total, total_break, by_cat, by_day, top_tasks = _report_data(start_s, end_s)
    days_worked = len(by_day)
    shift_target = settings["shift_hours"] * 3600 * days_worked

    return jsonify(
        {
            "start": start_s,
            "end": end_s,
            "total_secs": total,
            "total_break_minutes": total_break,
            "entry_count": len(rows),
            "days_worked": days_worked,
            "shift_hours": settings["shift_hours"],
            "shift_target_secs": shift_target,
            "avg_per_day_secs": (total / days_worked) if days_worked else 0,
            "by_category": [
                {"category": c, "seconds": s} for c, s in by_cat.items()
            ],
            "by_day": [
                {"date": d, "work_secs": v["work"],
                 "break_minutes": v["break"], "count": v["count"]}
                for d, v in sorted(by_day.items())
            ],
            "top_tasks": [
                {"task": t, "seconds": s} for t, s in top_tasks[:15]
            ],
            "entries": [
                {
                    "date": r["work_date"],
                    "task": r["task"],
                    "category": r["category"],
                    "start_time": r["start_time"] or "",
                    "end_time": r["end_time"] or "",
                    "duration_secs": r["duration_secs"],
                    "break_minutes": r["break_minutes"],
                    "notes": r["notes"] or "",
                }
                for r in rows
            ],
        }
    )


def _hm(seconds):
    seconds = int(seconds or 0)
    return f"{seconds // 3600}h {(seconds % 3600) // 60}m"


@app.route("/reports/export.csv")
def reports_export_csv():
    start_s, end_s = _report_range()
    report_type = request.args.get("type", "entries")
    rows, total, total_break, by_cat, by_day, top_tasks = _report_data(start_s, end_s)

    buf = io.StringIO()
    writer = csv.writer(buf)

    if report_type == "summary":
        writer.writerow(["Time Tracker report", f"{start_s} to {end_s}"])
        writer.writerow([])
        writer.writerow(["Category", "Duration (h:m)", "Duration (hours)", "Share %"])
        for c, s in by_cat.items():
            share = (s / total * 100) if total else 0
            writer.writerow([c, _hm(s), round(s / 3600, 2), f"{share:.1f}"])
        writer.writerow([])
        writer.writerow(["Date", "Entries", "Work (h:m)", "Work (hours)", "Break (min)"])
        for d, v in sorted(by_day.items()):
            writer.writerow(
                [d, v["count"], _hm(v["work"]), round(v["work"] / 3600, 2), v["break"]]
            )
        writer.writerow([])
        writer.writerow(["Total work", _hm(total), round(total / 3600, 2)])
        writer.writerow(["Total break (min)", total_break])
        filename = f"timetracker_summary_{start_s}_to_{end_s}.csv"
    else:
        writer.writerow(
            ["Date", "Task", "Category", "Start", "End",
             "Duration (h:m)", "Duration (hours)", "Break (min)", "Notes"]
        )
        for r in rows:
            writer.writerow(
                [
                    r["work_date"],
                    r["task"],
                    r["category"],
                    r["start_time"] or "",
                    r["end_time"] or "",
                    _hm(r["duration_secs"]),
                    round(r["duration_secs"] / 3600, 2),
                    r["break_minutes"],
                    r["notes"] or "",
                ]
            )
        writer.writerow([])
        writer.writerow(
            ["TOTAL", "", "", "", "", _hm(total), round(total / 3600, 2), total_break, ""]
        )
        filename = f"timetracker_entries_{start_s}_to_{end_s}.csv"

    output = buf.getvalue()
    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


if __name__ == "__main__":
    init_db()
    print(f" * Office Time Tracker running at http://127.0.0.1:{PORT}")
    app.run(host="127.0.0.1", port=PORT, debug=True)
