# QuizMaster

> A modern, mobile-friendly quiz platform built with React, TypeScript, Vite, and LibSQL.

![QuizMaster Logo](https://via.placeholder.com/150)

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Overview
QuizMaster is a fully-featured quiz application that allows administrators to create, manage, and review quizzes, while students can register, take quizzes, and view their results. The project emphasizes accessibility, responsiveness, and a clean user experience.

## Features
- Admin dashboard to **create**, **delete**, and **view** quizzes and responses
- Student registration and quiz-taking flow with support for multiple-choice, true/false, and subjective questions
- Real-time scoring and detailed feedback
- Mobile-first design with Tailwind CSS
- Persistent storage using LibSQL (Turso) and secure UUID-based IDs
- Single-page application with React Router for seamless navigation

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide React icons
- **State Management**: React Context API
- **Database**: LibSQL (Turso) via `@libsql/client`
- **Routing**: React Router DOM
- **Build & Dev**: Vite
- **Deployment**: Netlify (with `netlify.toml` configuration)

## Prerequisites
- Node.js >= 16
- npm or yarn package manager
- A Turso (LibSQL) database instance with an auth token

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/quizmaster.git
   cd quizmaster
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

## Environment Variables
Create a `.env` file in the project root and add:
```ini
VITE_DB_AUTH_TOKEN=your_turso_auth_token_here
``` 

> **Note**: Do **not** commit your `.env` with real credentials. It is added to `.gitignore`.

## Running Locally
Start the development server:
```bash
npm run dev
# or
yarn dev
```
Open your browser at `http://localhost:8080` (or the port you configured in `vite.config.ts`).

## Building for Production
To build a production-ready bundle:
```bash
npm run build
# or
yarn build
```
The compiled assets will be in the `dist/` directory.

## Deployment
This project is configured for Netlify:
- A `netlify.toml` file sets the build command to `npm run build` and publishes the `dist/` folder.
- SPA support via redirects to `index.html`.

Push your code to GitHub and link your repository to Netlify for continuous deployment.

## Project Structure
```
quizmaster/
├─ src/
│  ├─ components/        # React UI components
│  ├─ context/           # React Context providers
│  ├─ lib/               # Database client and queries
│  ├─ data/              # Sample data files
│  ├─ types/             # TypeScript interfaces
│  ├─ App.tsx            # Main application component
│  ├─ main.tsx           # React DOM entry
│  └── index.css         # Tailwind imports & custom styles
├─ public/               # Static assets (favicon, logo)
├─ .gitignore
├─ netlify.toml
├─ package.json
├─ tailwind.config.js
├─ vite.config.ts
└─ README.md
```

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repo
2. Create a new branch (`git checkout -b feature/my-new-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/my-new-feature`)
5. Open a Pull Request

Ensure your changes include relevant tests and documentation updates.

## License
This project is licensed under the [MIT License](LICENSE). 