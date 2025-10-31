# 🤖 AI Chat Application

A modern, full-featured chat application powered by AI, built with Next.js 14. Think ChatGPT, but self-hosted and customizable!

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## ✨ Features

- 💬 **Real-time AI Chat** - Stream responses from OpenAI (or any compatible API)
- 🔐 **Multiple Auth Options** - Email/Password, GitHub, and Google OAuth
- 🎨 **Beautiful UI** - Dark/Light theme with smooth transitions
- 📎 **File Uploads** - Share images and PDFs in your conversations
- 💾 **Persistent Storage** - PostgreSQL database for chat history
- 📝 **Rich Text Support** - Full Markdown rendering with syntax highlighting
- 🐳 **Docker Ready** - One-command deployment with Docker Compose
- 🚀 **Production Ready** - Optimized for self-hosting on your own server

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **State**: Zustand for state management
- **Auth**: NextAuth.js with multiple providers
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI SDK, Vercel AI SDK for streaming
- **Deployment**: Docker & Docker Compose

## 📦 Project Structure

```
chat-ui-nextjs-example/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (chat)/             # Protected chat routes
│   │   ├── api/                # API endpoints
│   │   ├── login/              # Auth pages
│   │   └── layout.tsx          # Root layout
│   ├── components/             # React components
│   │   ├── chat/               # Chat-specific components
│   │   ├── ui/                 # Reusable UI components
│   │   └── providers/          # Context providers
│   ├── lib/                    # Utilities & config
│   ├── hooks/                  # Custom React hooks
│   ├── store/                  # Zustand stores
│   └── types/                  # TypeScript definitions
├── prisma/                     # Database schema
├── public/                     # Static assets
├── docker-compose.yml          # Docker orchestration
├── Dockerfile                  # Container config
└── package.json
```

## 🚀 Quick Start

Let's get you up and running in just a few minutes!

### Prerequisites

- Node.js 20+ (for local development)
- Docker & Docker Compose (for easy deployment)
- An OpenAI API key (or compatible service)

### 1️⃣ Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd chat-ui-nextjs-example

# Install dependencies
npm install --legacy-peer-deps

# Install bcrypt for authentication
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

### 2️⃣ Environment Setup

Copy the example env file and fill in your secrets:

```bash
cp .env.example .env
```

Edit `.env` with your favorite editor:

```env
# Database (default values work with Docker Compose)
DATABASE_URL="postgresql://chatuser:changeme@localhost:5432/chatdb"
POSTGRES_USER=chatuser
POSTGRES_PASSWORD=changeme
POSTGRES_DB=chatdb

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# OpenAI (required)
OPENAI_API_KEY=sk-proj-...
OPENAI_BASE_URL=https://api.openai.com/v1

# OAuth (optional - for GitHub/Google login)
GITHUB_ID=your-github-app-id
GITHUB_SECRET=your-github-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3️⃣ Start the Application

#### Option A: Quick Start (Recommended for Development)

```bash
# Start PostgreSQL in Docker
docker compose up -d postgres

# Run database migrations
npm run db:migrate

# Start the development server
npm run dev
```

Visit http://localhost:3000 and you're ready to chat! 🎉

#### Option B: Full Docker Deployment

```bash
# Build and start everything
docker-compose up --build -d

# Check the logs
docker-compose logs -f nextjs
```

## 🔑 Authentication

### Email/Password (Built-in)

No setup needed! Users can sign up with any email/password combination. First-time users are automatically registered.

### GitHub OAuth (Optional)

1. Go to [GitHub Settings > Developer settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: `AI Chat App`
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret to `.env`

### Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy credentials to `.env`

## 💡 Using the App

### Starting a Chat
- Sign in with email/password or OAuth
- Click "New Chat" in the sidebar
- Start typing your message and hit Enter!

### Switching AI Models
The default model is GPT-4 Turbo. To use a different model, edit `src/lib/openai.ts`:

```typescript
export const DEFAULT_MODEL = "gpt-3.5-turbo"; // or any other model
```

### Using Alternative AI Providers

Works with any OpenAI-compatible API:

**DeepSeek:**
```env
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_API_KEY=your-deepseek-key
```

**Local Ollama:**
```env
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_API_KEY=ollama
```

**Groq:**
```env
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_API_KEY=your-groq-key
```

## 📝 Development Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm run start              # Start production server
npm run lint               # Run linter

# Database
npm run db:generate        # Generate Prisma client
npm run db:migrate         # Run migrations
npm run db:push           # Push schema changes
npm run db:studio         # Open Prisma Studio GUI
```

## 🐳 Production Deployment

### Deploy with Docker Compose

Perfect for VPS, dedicated servers, or home labs:

1. **Update environment variables** for production:
```env
NEXTAUTH_URL=https://your-domain.com
```

2. **Start the containers:**
```bash
docker-compose up -d
```

3. **Set up a reverse proxy** (Nginx example):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. **Add SSL with Let's Encrypt:**
```bash
sudo certbot --nginx -d your-domain.com
```

### Deploy to Cloud Platforms

- **Vercel**: Works out of the box (without Docker)
- **Railway**: Direct GitHub integration
- **DigitalOcean App Platform**: Auto-deploys from GitHub
- **AWS/GCP/Azure**: Use container services with our Docker image

## 🔧 Configuration

### Customize File Upload Limits

In `.env`:
```env
MAX_FILE_SIZE=20971520  # 20MB in bytes
```

### Add Custom AI Models

Edit `src/lib/openai.ts`:
```typescript
export const AVAILABLE_MODELS = [
  { id: "gpt-4-turbo-preview", name: "GPT-4 Turbo" },
  { id: "gpt-4", name: "GPT-4" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  { id: "claude-3-opus", name: "Claude 3 Opus" },
  // Add your models here
];
```

### Customize Theme Colors

Edit `src/app/globals.css` to match your brand:
```css
:root {
  --primary: 222.2 47.4% 11.2%;  /* Your primary color */
  --background: 0 0% 100%;        /* Background color */
  /* More theme variables... */
}
```

## 🐛 Troubleshooting

### "Cannot connect to database"
- Make sure PostgreSQL is running: `docker-compose ps`
- Check credentials in `.env` match `docker-compose.yml`
- Password in `DATABASE_URL` must match `POSTGRES_PASSWORD`
- Try restarting: `docker-compose restart postgres`

### "Authentication failed"
- Regenerate `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- Verify callback URLs match your domain
- Check OAuth app credentials are correct

### "AI not responding"
- Verify your `OPENAI_API_KEY` is valid
- Check API quota/credits
- Try switching to a different model
- Look for errors in: `docker-compose logs nextjs`

### "Port 3000 is already in use"
- The app will auto-switch to port 3001
- Or stop the conflicting process: `lsof -i :3000`

### "Weird characters in UI"
- This is usually an encoding issue
- Make sure your terminal uses UTF-8
- Try restarting the dev server

## 📊 Monitoring

```bash
# View logs
docker-compose logs -f          # All services
docker-compose logs -f nextjs   # Just the app
docker-compose logs -f postgres # Just the database

# Check status
docker-compose ps

# Resource usage
docker stats
```

## 💾 Backup & Restore

### Backup your database:
```bash
docker-compose exec postgres pg_dump -U chatuser chatdb > backup.sql
```

### Restore from backup:
```bash
docker-compose exec -T postgres psql -U chatuser chatdb < backup.sql
```

## 🔒 Security Best Practices

- ✅ Always use HTTPS in production
- ✅ Keep your `NEXTAUTH_SECRET` secure and unique
- ✅ Regularly update dependencies
- ✅ Use environment variables for all secrets
- ✅ Enable rate limiting for production
- ✅ Regular backups of your database

## 🤝 Contributing

Found a bug? Have an idea? Contributions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

MIT License - feel free to use this project for anything you like!

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI powered by [OpenAI](https://openai.com/)
- Database by [PostgreSQL](https://www.postgresql.org/)

## 💬 Support

Need help?
- Open an [issue](https://github.com/yourusername/chat-ui-nextjs-example/issues)
- Check existing [discussions](https://github.com/yourusername/chat-ui-nextjs-example/discussions)
- Star ⭐ the project if you find it useful!

---

Made with ❤️ using Next.js, TypeScript, and Docker