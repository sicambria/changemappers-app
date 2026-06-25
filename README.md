# Changemappers

![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-24.0.0-green)
![Next.js](https://img.shields.io/badge/Next.js-16.2.1-black)
![React](https://img.shields.io/badge/React-19.2.3-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38b2ac)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Prisma](https://img.shields.io/badge/Prisma-7.7-2d3748)

**Changemappers** is a modern, community-driven platform built to empower change. Leveraging the latest web technologies, it provides a robust interface for mapping, real-time collaboration, and community engagement.

## 🚀 Features

-   **Modern Tech Stack**: Built with Next.js 16 (App Router), React 19, and TailwindCSS v4.
-   **Interactive Maps**: Integrated high-performance mapping using Leaflet and React-Leaflet.
-   **Real-time Updates**: Powered by Socket.io for instant community interaction.
-   **Internationalization (i18n)**: Full multi-language support (i18next).
-   **Robust Database**: PostgreSQL with Prisma 7 and the `pg` adapter for type-safe database interactions.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 16](https://nextjs.org/)
-   **UI Library**: [React 19](https://react.dev/)
-   **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/)
-   **ORM**: [Prisma](https://www.prisma.io/)
-   **Code Quality**: [ESLint](https://eslint.org/)
-   **Icons**: [Lucide React](https://lucide.dev/)

## 🏁 Getting Started

### Prerequisites

-   Node.js `24.0.0` (see `.nvmrc`)
-   npm (see `packageManager` in `package.json`)
-   A PostgreSQL database
-   Git

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/sicambria/changemappers-app.git
    cd changemappers-app
    ```

2.  **Install dependencies**
    ```bash
    npm ci
    ```

3.  **Environment Setup**
    Copy `.env.example` to `.env` and fill in the values for your environment.
    ```bash
    cp .env.example .env          # Linux/macOS
    # Copy-Item .env.example .env # Windows PowerShell
    ```

4.  **Database Setup**
    Generate the Prisma client and apply migrations to your configured database.
    ```bash
    npm run db:generate
    npm run db:migrate:deploy
    ```

5.  **Run the Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

6.  **Run a Production Build Locally**
    ```bash
    # Build and run with local-testing security bypass
    npm run prod:local
    ```
    *Note: `prod:local` sets `SKIP_PROD_CHECKS` so the production build runs locally without full production security requirements (SSL, Sentry, etc).*

## 📜 Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the local development server (custom Next.js + Socket.IO server) after environment checks. |
| `npm run dev:full` | Alias for the full local development boot path. |
| `npm run dev:prep` | Validates the environment, applies deployed migrations, generates the Prisma client, and builds the route registry. |
| `npm run build` | Builds the application for production. |
| `npm run build:prep` | Pre-build environment validation and Prisma client generation. |
| `npm run start` | Starts the production application. |
| `npm run prod:local` | Builds and runs the production app locally with the local-testing security bypass. |
| `npm run db:generate` | Generates the Prisma client. |
| `npm run db:migrate:deploy` | Applies committed Prisma migrations to the configured database. |
| `npm run db:migrate` | Runs a Prisma development migration. |
| `npm run db:reset` | Resets the database (drops, recreates, re-applies migrations). |
| `npm run db:push` | Pushes the Prisma schema to the database without a migration. |
| `npm run db:studio` | Opens Prisma Studio. |
| `npm run lint` | Runs ESLint. |
| `npm run typecheck` | Runs the TypeScript compiler in no-emit mode. |
| `npm run health` | Runs environment and database connectivity checks. |
| `npm run cleanup` | Safely clears build artifacts and stale processes. |
| `npm run reset:hard` | "Nuclear Reset": wipes modules/cache and performs a fresh install. |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

Changemappers is a dual-licensed, anti-extractive commons:

- **Code** is licensed under the **GNU Affero General Public License v3 (or later)** — see [`LICENSE`](./LICENSE) (`AGPL-3.0-or-later`).
- **Content / knowledge commons** (documentation, curated taxonomy and governance prose) is licensed under **Creative Commons Attribution-ShareAlike 4.0 International** — see [`LICENSE-CONTENT`](./LICENSE-CONTENT) (`CC-BY-SA-4.0`).

The full canonical license texts live in the `LICENSE` and `LICENSE-CONTENT` files at the repository root.
