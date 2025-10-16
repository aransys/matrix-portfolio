# Matrix Portfolio

🌐 **Live Site:** [https://matrix-portfolio-zeta.vercel.app/](https://matrix-portfolio-zeta.vercel.app/)

A sleek, Matrix-themed developer portfolio built with Astro, featuring dynamic theme switching inspired by the Matrix trilogy.

## ✨ Features

- 🎨 **Matrix Trilogy Themes** - Switch between Matrix (green), Reloaded (blue), and Revolutions (orange) color schemes
- 💊 **Dynamic Theme Switcher** - Smooth color transitions across all components
- 📱 **Fully Responsive** - Optimized for desktop, tablet, and mobile
- 🍔 **Mobile Hamburger Menu** - Clean navigation on smaller screens
- ⬆️ **Scroll to Top Button** - Convenient navigation for long pages
- 🌧️ **Matrix Rain Effect** - Animated background with falling code
- ⚡ **Fast Performance** - Built with Astro for optimal speed
- ♿ **Accessible** - Semantic HTML and ARIA labels

## 🚀 Project Structure

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Contact.astro
│   │   ├── Hero.astro
│   │   ├── Navigation.astro
│   │   ├── Projects.astro
│   │   ├── ScrollToTop.astro
│   │   ├── Skills.astro
│   │   └── ThemeSwitcher.astro
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |

## 🎨 Theme System

The portfolio includes three Matrix-inspired themes:

- **Matrix (Green)** - Classic Matrix aesthetic with green code
- **Reloaded (Blue)** - Default theme inspired by the Architect's room
- **Revolutions (Orange)** - Machine City-inspired orange/gold tones

Theme preferences are saved in localStorage and persist across sessions.

## 🛠️ Built With

- [Astro](https://astro.build) - Static Site Generator
- CSS3 with Custom Properties
- Vanilla JavaScript
- JetBrains Mono Font

## 📦 Deployment

Deployed on [Vercel](https://vercel.com) with automatic deployments from GitHub.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Made with 💚 and inspired by The Matrix
