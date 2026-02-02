# Accord - Decision Logging App

Accord is a micro-SaaS productivity tool for remote teams to log and retrieve important decisions that often get lost in chat. It acts as an intervention layer, appearing in Slack or ChatGPT to prompt users to summarize decisions.

## Project Structure

```
decide/
├── src/                    # Backend API (Express.js)
├── web/                    # Next.js frontend
├── slack/                  # Slack Bolt.js integration
└── extension/              # Chrome extension for ChatGPT
```

## Getting Started

### Prerequisites

- Node.js v20+
- PostgreSQL database
- Slack App (for Slack integration)
- Chrome/Edge browser (for extension)

### Backend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your database and JWT settings
   ```

3. Run migrations:
   ```bash
   node src/db/migrate.js
   ```

4. Start the backend:
   ```bash
   npm run dev:backend
   ```

### Web Frontend Setup

1. Navigate to web directory:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

### Slack Integration Setup

1. Create a Slack App at https://api.slack.com/apps
2. Enable Socket Mode
3. Add required scopes: `chat:write`, `commands`, `im:history`, `channels:history`
4. Install to workspace

5. Configure the Slack bot:
   ```bash
   cd slack
   npm install
   cp .env.example .env
   # Add your Slack tokens to .env
   ```

6. Start the Slack bot:
   ```bash
   npm run dev
   ```

### Chrome Extension Setup

1. Build the extension:
   ```bash
   cd extension
   npm install
   npm run build
   ```

2. Load in Chrome:
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension/dist` folder

3. Configure:
   - Click the extension icon
   - Enter your API URL and credentials
   - Click "Connect"

## API Endpoints

### Authentication
- `POST /api/auth/login` - Get JWT token

### Decisions
- `GET /api/decisions` - List decisions (with search/filter)
- `POST /api/decisions` - Create a new decision
- `GET /api/decisions/:id` - Get decision by ID
- `GET /api/decisions/:id/history` - Get decision history
- `POST /api/decisions/:id/supersede` - Create a new version of a decision

### Health
- `GET /health` - Health check

## Tech Stack

- **Backend**: Express.js, PostgreSQL, JWT
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, React Query
- **Slack**: Bolt.js
- **Extension**: Chrome Manifest V3, TypeScript

## Design

The UI follows Apple-style glassmorphism aesthetics:
- Frosted glass effects with backdrop blur
- Soft shadows and subtle borders
- Clean typography with system fonts
- Floating action buttons
- Responsive layout

## License

Private
# Accord
