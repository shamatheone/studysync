# 🎓 StudySync – Smart Productivity for Students

> **Organize. Focus. Achieve.**

A fully client-side student productivity web app with no dependencies, no build step, and no backend required. Just open `index.html` in any browser.

---

## 📁 File Structure

```
studysync/
├── index.html    ← Main HTML (all 8 pages)
├── styles.css    ← All CSS with CSS variables + responsive design
├── scripts.js    ← All JavaScript (timer, tasks, charts, auth)
└── README.md     ← This file
```

---

## ✨ Features

| Feature | Details |
|---|---|
| 📋 Task Manager | Add, filter, complete, delete tasks with priority & deadline |
| ⏱️ Pomodoro Timer | 25m focus / 5m short break / 15m long break with animated ring |
| 📊 Progress Tracker | Bar chart, pie chart, subject progress bars |
| 🌙 Dark Mode | Toggles and persists via localStorage |
| 💾 Local Storage | All data (tasks, user, hours, pomodoros) saved in browser |
| 🔐 Login / Signup | Simple auth; name used for personalized dashboard |
| 💬 Daily Quotes | Random motivational quote on each dashboard visit |
| ⌨️ Keyboard Shortcut | `Space` to start/pause timer on the Timer page |

---

## 🚀 How to Run

### Option 1 – Open Directly
Double-click `index.html`. Works in Chrome, Firefox, Edge, Safari.

### Option 2 – Local Dev Server
```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve .
```
Then visit `http://localhost:8000`

### Option 3 – Deploy (no backend needed)
Upload all 3 files to any static host:
- **GitHub Pages** – push to a repo, enable Pages
- **Netlify** – drag-and-drop the folder
- **Vercel** – `vercel deploy`
- **Any web host** – upload via FTP/cPanel

---

## 🎨 Customization

All design tokens live in `styles.css` under `:root`:

```css
:root {
  --accent:  #e84855;   /* Primary red  */
  --accent2: #3d5a80;   /* Blue         */
  --green:   #2d9e6b;   /* Success      */
  --accent3: #f4a261;   /* Orange       */
}
```

Change these to re-theme the entire app instantly.

---

## 🗄️ Data Storage

All data is stored in the browser's `localStorage` under these keys:

| Key | Contents |
|---|---|
| `ss_tasks` | Array of task objects |
| `ss_user` | `{ name, email }` of logged-in user |
| `ss_hours` | Array of 7 floats (Mon–Sun study hours) |
| `ss_pomodoros` | Integer count of completed sessions |
| `ss_theme` | `"light"` or `"dark"` |

---

## 💼 Resume Description

> Developed a full-stack student productivity web application with task management, Pomodoro timer, and analytics dashboard using vanilla HTML, CSS, and JavaScript with localStorage persistence.

---

*StudySync — Built with ❤️ for students everywhere.*
