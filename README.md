# 📋 Kanban Board

A modern, comprehensive productivity application built with React, TypeScript, and Vite. Beyond just a board, it features a focus timer, goal planning, and analytics to help you manage your tasks effectively.

---

## ✨ Key Features

- **🎯 Fluid Drag & Drop**: Seamlessly move tasks between columns using `@dnd-kit`, now fully optimized for mobile devices with smooth touch support.
- **⏱️ Focus Timer**: Built-in pomodoro-style timer to keep you on track, featuring a distraction-free fullscreen mode.
- **🎯 Goals & Planning**: Set high-level goals that automatically generate actionable plans and checklists for your board.
- **📊 Analytics Dashboard**: Gain insights into your productivity with built-in task analytics and completion metrics.
- **📝 Advanced Task Details**: Rich `TaskDetailsModal` for in-depth editing of task descriptions, subtasks, and metadata.
- **📤 Export Tasks**: Easily export tasks for a specified day directly from the main board.
- **✨ Premium UI/UX**:
  - Smooth animations and transitions powered by `framer-motion`.
  - Beautiful iconography via `lucide-react`.
  - Custom interactive cursor and modern aesthetics (`clsx`, `tailwind-merge`, and Tailwind CSS 4).

---

## 🚀 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Drag & Drop**: [@dnd-kit/core](https://dndkit.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📁 Project Structure

```text
src/
├── components/        # Feature-rich UI components
│   ├── Board.tsx              # Core drag-and-drop board & export logic
│   ├── FocusTimer.tsx         # Fullscreen-capable productivity timer
│   ├── Goals.tsx              # Goal setting and automatic checklist planning
│   ├── Analytics.tsx          # Productivity metrics and insights
│   ├── TaskDetailsModal.tsx   # Detailed task inspection and editing
│   ├── CustomCursor.tsx       # Interactive UI cursor
│   └── ...                    # Reusable components (Header, Sidebar, Column, TaskCard)
├── lib/               # Utility functions
├── type/              # TypeScript definitions
├── App.tsx            # Main application layout & routing
└── main.tsx           # Entry point
```

---

## 🔧 Quick Start

Clone and run locally:

```bash
git clone https://github.com/AumMule/Kanban-Board.git
cd kanban-board
npm install
npm run dev
```

Available scripts:

```bash
npm run dev     # start dev server (Vite)
npm run build   # build for production
npm run preview # preview the production build
npm run lint    # run ESLint
```

---

## 🤝 Contributing

Contributions welcome — open an issue or submit a PR. For code changes:

1. Fork the repo
2. Create a feature branch
3. Run tests / lint
4. Open a PR with a clear description

---

## 📜 License

MIT — see LICENSE for details.

---

Made with ❤️ by [Aum Mule](https://github.com/AumMule)
