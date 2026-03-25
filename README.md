<p align="center">
  <a href="https://vitejs.dev" target="blank"><img src="https://vitejs.dev/logo.svg" width="100" alt="Vite Logo" /></a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://nestjs.com" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="100" alt="NestJS Logo" /></a>
</p>

<h1 align="center">FluxCRM</h1>

<p align="center">
  A modern full-stack CRM platform built with <a href="https://vitejs.dev" target="_blank">Vite + React</a> on the frontend and <a href="https://nestjs.com" target="_blank">NestJS</a> on the backend.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/vite-7.3.1-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/react-19.2.0-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/nestjs-11.0.1-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/mongodb-mongoose-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/styling-TailwindCSS-38bdf8?logo=tailwindcss&logoColor=white" alt="Tailwind" />
</p>

---

## 📋 Table of Contents

- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Auth API](#-auth-api)
- [Running Tests](#-running-tests)
- [Tech Stack](#️-tech-stack)
- [Deployment](#-deployment)

---

## 📁 Project Structure

```
FluxCRM/
├── client/                        # Frontend — Vite + React 19 + Tailwind
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── server/                        # Backend — NestJS 11 + MongoDB
    ├── src/
    │   ├── auth/
    │   │   ├── auth.controller.ts
    │   │   ├── auth.service.ts
    │   │   └── auth.module.ts
    │   ├── users/
    │   │   ├── dto/
    │   │   ├── schemas/
    │   │   ├── users.controller.ts
    │   │   ├── users.service.ts
    │   │   └── users.module.ts
    │   ├── app.module.ts
    │   ├── app.controller.ts
    │   ├── app.service.ts
    │   └── main.ts
    ├── test/
    ├── nest-cli.json
    ├── tsconfig.json
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- [Nest.js](https://nestjs.com/) v18+
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)

---

### 1. Clone the Repository

```bash
git clone https://github.com/Vanshvala23/FluxCRM.git
cd FluxCRM
```

---

### 2. Setup the Backend (NestJS)

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fluxcrm
JWT_SECRET=your_jwt_secret_here
```

```bash
# development
npm run start

# watch mode (recommended)
npm run start:dev

# production
npm run start:prod
```

Backend runs on: `http://localhost:5000`

> 📖 Swagger API docs available at `http://localhost:5000/api` (powered by `@nestjs/swagger`)

---

### 3. Setup the Frontend (Vite + React)

```bash
cd ../client
npm install
```

Create a `.env` file in the `client/` directory:

```env
VITE_API_URL=http://localhost:5000
```

```bash
# development with HMR
npm run dev

# production build
npm run build

# preview production build
npm run preview
```

Frontend runs on: `http://localhost:5173`

---

## 🔐 Auth API

Base URL: `http://localhost:5000`

#### Register

```http
POST /auth/register
```

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Login

```http
POST /auth/login
```

```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> All protected routes require `Authorization: Bearer <access_token>` in the request header.

---

## 🧪 Running Tests

### Backend

```bash
cd server

# unit tests
npm run test

# watch mode
npm run test:watch

# e2e tests
npm run test:e2e

# coverage report
npm run test:cov
```

---

## 🛠️ Tech Stack

### Frontend (`/client`)

| Package | Version | Purpose |
|---|---|---|
| React | ^19.2.0 | UI framework |
| Vite | ^7.3.1 | Build tool & dev server |
| React Router DOM | ^7.13.1 | Client-side routing |
| Tailwind CSS | ^3.4.19 | Utility-first styling |
| Axios | ^1.13.6 | HTTP client |
| Recharts | ^3.7.0 | Charts & data visualization |
| Framer Motion | ^12.34.4 | Animations |
| Lucide React | ^0.576.0 | Icon library |
| React Big Calendar | ^1.19.4 | Calendar component |
| Moment.js | ^2.30.1 | Date formatting |

### Backend (`/server`)

| Package | Version | Purpose |
|---|---|---|
| NestJS | ^11.0.1 | Web framework |
| Mongoose | ^9.2.3 | MongoDB ODM |
| @nestjs/jwt | ^11.0.2 | JWT authentication |
| @nestjs/passport | ^11.0.5 | Auth middleware |
| passport-jwt | ^4.0.1 | JWT strategy |
| bcryptjs | ^3.0.3 | Password hashing |
| @nestjs/swagger | ^11.2.6 | API documentation |
| class-validator | ^0.14.4 | DTO validation |
| class-transformer | ^0.5.1 | Object transformation |

---

## 📦 Deployment

### Frontend (Vercel / Netlify)

```bash
cd client
npm run build
# Deploy the dist/ folder
```

### Backend (Railway / Render / AWS)

```bash
cd server
npm run build
npm run start:prod
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add: your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

<p align="center">Built with ❤️ by <a href="https://github.com/Vanshvala23">Vansh Vala</a> using Vite + NestJS</p>
