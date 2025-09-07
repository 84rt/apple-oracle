# 🚀 Multi-LLM Chat Comparison Platform

A modern, professional chat interface that allows you to compare responses from multiple AI models side-by-side. Built with Next.js 15, Supabase, and the latest web technologies.

## ✨ Features

- **Multi-Model Chat**: Compare responses from GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, Grok Beta, and DeepSeek
- **Side-by-Side Comparison**: Desktop grid layout and mobile swipeable cards
- **System Prompt Management**: Built-in prompts + custom prompt creation
- **Chat Modes**: Continuous conversation or single-question mode
- **User Authentication**: Email/password + Google OAuth via Supabase Auth
- **API Key Management**: Secure storage with Supabase Vault encryption
- **Subscription Management**: Stripe integration for premium features
- **Mobile-First Design**: Responsive UI with smooth gestures
- **Real-time Updates**: Live chat history and model responses

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4 + Radix UI primitives
- **Backend**: Supabase (Auth, Database, Storage)
- **Payments**: Stripe
- **State Management**: React hooks + Context
- **TypeScript**: Full type safety
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Supabase account ([supabase.com](https://supabase.com))
- A Stripe account ([stripe.com](https://stripe.com)) - optional for subscriptions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd llm-apple
npm install
```

### 2. Environment Setup

Copy the environment template:

```bash
cp env.template .env.local
```

### 3. Supabase Setup

1. **Create a new Supabase project** at [supabase.com/dashboard](https://supabase.com/dashboard)

2. **Run the database schema**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Run the SQL to create all tables and policies

3. **Configure authentication**:
   - Go to Authentication > Settings
   - Enable Email/Password authentication
   - Optional: Enable Google OAuth provider
   - Add redirect URLs: `http://localhost:3000/auth/callback`

4. **Get your credentials**:
   - Go to Settings > API
   - Copy your Project URL and anon key
   - Copy your service role key (keep this secret!)

5. **Update `.env.local`**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### 4. Stripe Setup (Optional)

1. **Create a Stripe account** and get your API keys
2. **Create products and prices** in your Stripe dashboard
3. **Set up webhook endpoint**: `https://your-domain.com/api/stripe/webhook`
4. **Update `.env.local`**:
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 5. LLM API Keys (Optional)

Users can provide their own API keys through the UI, but you can set platform defaults:

```bash
# OpenAI (GPT models): https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your_openai_api_key_here

# Anthropic (Claude models): https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here

# Google AI (Gemini models): https://aistudio.google.com/app/apikey
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# xAI (Grok models): https://console.x.ai/
XAI_API_KEY=xai-your_xai_api_key_here

# DeepSeek: https://platform.deepseek.com/api_keys
DEEPSEEK_API_KEY=sk-your_deepseek_api_key_here
```

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── auth/             # Authentication components
│   │   ├── chat/             # Chat interface components
│   │   ├── sidebar/          # Sidebar components
│   │   ├── api-keys/         # API key management
│   │   ├── subscription/     # Subscription components
│   │   └── error/            # Error handling components
│   ├── lib/                  # Utility libraries
│   │   ├── llm/             # LLM provider integrations
│   │   ├── supabase/        # Supabase clients
│   │   ├── constants.ts     # App constants
│   │   └── utils.ts         # Utility functions
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript type definitions
├── supabase/
│   └── schema.sql           # Database schema
├── env.template             # Environment variables template
├── middleware.ts            # Next.js middleware for auth
└── vercel.json             # Vercel deployment config
```

## 🔐 Authentication Flow

1. Users sign up/in via email or Google OAuth
2. Supabase handles authentication and session management
3. Middleware protects authenticated routes
4. User profiles are automatically created on first sign-in

## 🤖 LLM Integration

The platform supports 5 major LLM providers:

- **OpenAI**: GPT-4o (latest GPT-4 model)
- **Anthropic**: Claude 3.5 Sonnet
- **Google**: Gemini 1.5 Pro
- **xAI**: Grok Beta
- **DeepSeek**: DeepSeek V3

Each provider has a dedicated integration class with error handling and response formatting.

## 💾 Database Schema

Key tables:
- `profiles`: User profile information
- `chats`: Chat sessions
- `messages`: User messages
- `model_responses`: AI model responses
- `system_prompts`: Custom system prompts
- `user_api_keys`: Encrypted API key storage

## 🔒 Security Features

- Row Level Security (RLS) policies on all tables
- Encrypted API key storage using Supabase Vault
- CSRF protection via Supabase Auth
- Secure cookie handling for sessions
- Input sanitization and validation

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect your GitHub repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** with automatic builds on push

### Environment Variables for Production

Update these in your production environment:

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### Stripe Webhook Setup

1. **Create webhook endpoint** in Stripe dashboard
2. **Set URL**: `https://your-domain.com/api/stripe/webhook`
3. **Select events**: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. **Copy webhook secret** to `STRIPE_WEBHOOK_SECRET`

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Style

- ESLint configuration with Next.js rules
- TypeScript strict mode enabled
- Tailwind CSS for styling
- Radix UI for accessible components

## 🔧 Configuration

### Customizing Models

Update `src/lib/constants.ts` to modify supported models:

```typescript
export const MODELS = {
  'your-model': {
    name: 'your-model',
    displayName: 'Your Model',
    provider: 'Your Provider',
    color: 'bg-blue-500',
    enabled: true,
    hasApiKey: false
  }
}
```

### Adding New LLM Providers

1. Create a new provider class in `src/lib/llm/providers/`
2. Extend the `BaseLLMProvider` class
3. Add the provider to `LLMManager`
4. Update the constants and types

## 🆘 Troubleshooting

### Common Issues

**Authentication not working:**
- Check Supabase URL and keys in `.env.local`
- Verify redirect URLs in Supabase dashboard
- Ensure middleware is properly configured

**API calls failing:**
- Verify LLM API keys are correct
- Check rate limits and quotas
- Review error logs in browser console

**Database errors:**
- Ensure schema.sql has been run
- Check RLS policies are enabled
- Verify user permissions

### Getting Help

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Review Supabase and Stripe documentation
3. Check browser console for errors

## 📄 License

MIT License - see LICENSE file for details.

---

Built with ❤️ using Next.js, Supabase, and modern web technologies.
