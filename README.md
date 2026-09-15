# Visual Workflow Builder for GitHub Actions / Workflows

An interactive visual block-based DSL editor built with **Blockly** to configure GitHub Actions workflows. It compiles visual blocks into clean, syntactically correct, and standard YAML configuration files in real-time.

---

## 👥 Authors
*   **Abdulqavi Mansuri** (128267)
*   **Aiyaan Hasan** (128336)

---

## 🚀 Key Features of the Prototype
1.  **Block-based DSL:** Drag-and-drop workflow configuration.
2.  **Live YAML Compilation:** Real-time generation of GitHub Actions configuration.
3.  **Visual Syntax Constraints:** Only triggers can snap into the Trigger input, and only jobs/steps can snap into their respective parent blocks. This prevents invalid syntax structure by construction.
4.  **Dark Mode UI:** Responsive, high-fidelity developer dashboard styling.

---

## ⚙️ Quick Start

### 1. Install dependencies
From this directory, run:
```bash
npm install
```

### 2. Start the dev server
Run the following to start the local Vite development server:
```bash
npm run dev
```

### 3. Open in Browser
Open the URL printed in the terminal (typically **`http://localhost:5173`**) to view and test the editor.

---

