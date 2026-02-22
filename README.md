# 📋 Kanban Board

A sleek, modern, and highly interactive **Kanban Board** application built with the latest web technologies. This project focuses on a premium user experience with smooth drag-and-drop interactions, a minimalist design, and a responsive layout.

---

## ✨ Key Features

- **🎯 Fluid Drag & Drop**: Seamlessly move tasks between "To Do", "Doing", and "Done" columns using `@dnd-kit`.
- **➕ Quick Task Creation**: Effortlessly add new tasks with a clean, intuitive input interface.
- **✨ Premium UI/UX**:
  - **Custom Cursor**: Interactive cursor that reacts to your movements.
  - **Glassmorphism**: Subtle shadows and borders for a modern look.
  - **Animated Transitions**: Smooth hover effects and task movements.
- **👤 User Personalization**: Greets you by name, with persistent storage in `localStorage`.
- **📱 Responsive Layout**: Optimized for both desktop and mobile views.
- **🛠️ Tech Stack Integration**: Leveraging Tailwind CSS 4 for cutting-edge styling.

---

## 🚀 Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Drag & Drop**: [@dnd-kit/core](https://dndkit.com/)

---

## 📂 Project Structure

```text
src/
├── components/          # Reusable UI components
│   ├── Board.tsx       # Main board logic & DND context
│   ├── Column.tsx      # Task column container
│   ├── TaskCard.tsx    # Individual draggable task
│   ├── Sidebar.tsx     # Navigation & Project Space
│   ├── Header.tsx      # Main top header
│   └── BoardHeader.tsx # Task input & Board metadata
├── type/               # TypeScript definitions
├── App.tsx             # Main application layout
└── main.tsx            # Entry point
```

---

## 🛠️ Installation & Setup

Follow these steps to get the project running locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AumMule/Kanban-Board.git
   cd kanban-board
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📝 Roadmap

- [ ] Task persistence with a backend (Firebase/Supabase).
- [ ] Editable task titles and descriptions.
- [ ] Task deletion functionality.
- [ ] Due dates and priority tags.
- [ ] Dark mode support.

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

---

## 📜 License

This project is licensed under the MIT License.

---

Made with ❤️ by [Aum Mule](https://github.com/AumMule)
