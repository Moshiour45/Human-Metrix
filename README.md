# 🧠 Human-Metrix

A collection of browser-based cognitive and reflex mini-games designed to test and train human performance metrics — including reaction time, memory, typing speed, aim, and more.

---

## 📁 Project Structure

```
Human-Metrix/
├── dist/                    # Compiled/build output
├── Game Logic/              # JavaScript game logic modules
│   ├── AimTrainer.js
│   ├── MindGrid.js
│   ├── NumberMemory.js
│   ├── ReactionTime.js
│   └── TypingSpeed.js
├── Games/                   # HTML pages for each game
│   ├── AimTrainer.html
│   ├── MindGrid.html
│   ├── NumberMemory.html
│   ├── ReactionTime.html
│   └── TypingSpeed.html
├── Images/                  # Static assets
│   └── logo.png
├── src/                     # Source styles and entry point
│   └── input.css
├── index.html               # Main landing/home page
├── script.js                # Global scripts
├── package.json
├── package-lock.json
└── .gitignore
```

---

## 🎮 Games

| Game | Description |
|------|-------------|
| **Aim Trainer** | Test your mouse accuracy and targeting speed |
| **Mind Grid** | Challenge your visual memory with grid patterns |
| **Number Memory** | Memorize and recall increasingly long number sequences |
| **Reaction Time** | Measure how fast you respond to visual stimuli |
| **Typing Speed** | Test your words-per-minute and typing accuracy |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/Moshiour45/Human-Metrix.git

# Navigate into the project directory
cd Human-Metrix

# Install dependencies
npm install
```

### Running the Project

```bash
# Start development server
npm run build
```

Then open your browser and visit `http://localhost:3000` (or whichever port is configured).

### Build

```bash
# Build for production
npm run build
```

Output will be placed in the `dist/` folder.

---

## 🛠️ Tech Stack

- **HTML5** — Game pages and structure
- **CSS3** — Styling via `src/input.css` (likely Tailwind CSS)
- **Vanilla JavaScript** — Game logic modules
- **Node.js / npm** — Build tooling and dependency management

---

## 👥 Contributors

This project is built and maintained by:

* [**Moshiour Rahman**](https://github.com/Moshiour45)
* [**Zihad Hossain**](https://github.com/ZihadHossain32)
* [**Abdullah AL Jayed Joseph**](https://github.com/jihad141004)

---
## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 📬 Contact

Have suggestions or found a bug? Open an issue or reach out via GitHub.