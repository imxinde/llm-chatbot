# LLM Chatbot

A modern LLM chatbot application built with React and Express, powered by OpenRouter API. Features real-time streaming responses, multiple model support, and a clean monorepo architecture.

## Features

- **Real-time Streaming** - Server-Sent Events (SSE) for typewriter-style responses
- **Multi-Model Support** - Switch between different LLM models via OpenRouter
- **Model Selector** - Browse and select from available models
- **Modern Stack** - React 19, Express, TypeScript, pnpm Monorepo
- **Type-Safe** - Shared types across frontend and backend with OpenAPI spec

## Tech Stack

| Layer           | Technology                            |
| --------------- | ------------------------------------- |
| Frontend        | React 19, Vite 7, TypeScript          |
| Backend         | Express 4, Node.js 18+, TypeScript    |
| Package Manager | pnpm 10 (Monorepo)                    |
| API Spec        | OpenAPI 3.0.3                         |
| LLM Provider    | OpenRouter API                        |
| Code Quality    | ESLint 9, Prettier, Husky, Commitlint |

## Project Structure

```
llm-chatbot/
├── apps/
│   ├── frontend/           # React frontend application
│   │   └── src/
│   │       ├── components/ # UI components
│   │       ├── context/    # React context (state management)
│   │       ├── api/        # API client
│   │       └── styles/     # CSS styles
│   └── backend/            # Express API server
│       └── src/
│           ├── routes/     # API routes
│           └── services/   # Business logic
├── packages/
│   ├── shared/             # Shared types and constants
│   └── api-spec/           # OpenAPI specification
├── eslint.config.js        # ESLint configuration
├── .prettierrc             # Prettier configuration
└── package.json            # Root package.json
```

## Prerequisites

- Node.js >= 18
- pnpm >= 10
- OpenRouter API key ([Get one here](https://openrouter.ai/keys))

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/imxinde/llm-chatbot.git
cd llm-chatbot
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env` and add your OpenRouter API key:

```env
OPENROUTER_API_KEY=your_api_key_here
PORT=3000
NODE_ENV=development
```

### 4. Start development servers

```bash
pnpm dev
```

This starts both frontend (http://localhost:5173) and backend (http://localhost:3000) in parallel.

## Available Scripts

| Command             | Description                   |
| ------------------- | ----------------------------- |
| `pnpm dev`          | Start all development servers |
| `pnpm dev:frontend` | Start frontend only           |
| `pnpm dev:backend`  | Start backend only            |
| `pnpm build`        | Build all packages            |
| `pnpm start`        | Start production server       |
| `pnpm lint`         | Run ESLint                    |
| `pnpm lint:fix`     | Fix ESLint issues             |
| `pnpm format`       | Format code with Prettier     |
| `pnpm format:check` | Check code formatting         |

## API Endpoints

| Method | Endpoint      | Description                           |
| ------ | ------------- | ------------------------------------- |
| `POST` | `/api/chat`   | Send chat message, returns SSE stream |
| `GET`  | `/api/models` | Get available LLM models              |

### POST /api/chat

**Request:**

```json
{
  "messages": [{ "role": "user", "content": "Hello!" }],
  "model": "openai/gpt-3.5-turbo"
}
```

**Response:** Server-Sent Events stream

```
data: {"content":"Hello"}
data: {"content":" there"}
data: {"content":"!"}
data: [DONE]
```

### GET /api/models

**Response:**

```json
{
  "models": [
    {
      "id": "openai/gpt-3.5-turbo",
      "name": "GPT-3.5 Turbo",
      "context_length": 16385
    }
  ]
}
```

## Environment Variables

| Variable             | Required | Description                    | Default       |
| -------------------- | -------- | ------------------------------ | ------------- |
| `OPENROUTER_API_KEY` | Yes      | OpenRouter API key             | -             |
| `PORT`               | No       | Server port                    | `3000`        |
| `NODE_ENV`           | No       | Environment                    | `development` |
| `ALLOWED_ORIGINS`    | No       | CORS origins (comma-separated) | `*`           |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

### Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
