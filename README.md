# Multi-LLM Chat Comparison Platform

A professional platform for comparing responses from multiple AI models side-by-side. Think "Postman for LLMs" - one input, multiple outputs, instant comparison.

## Features

- **Multi-Model Comparison**: Compare responses from GPT-5, Grok-4, Claude 4, Gemini 2.5 Pro, and DeepSeek
- **Side-by-Side Interface**: Clean, professional layout for easy response comparison
- **System Prompts**: Customizable system prompts that apply to all models
- **Chat Modes**: Continuous conversation or single-question mode
- **Mobile Responsive**: Swipeable cards on mobile with gesture navigation
- **Secure API Management**: Encrypted API key storage with Supabase Vault
- **Subscription Model**: Free trial with Stripe integration for unlimited access

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Database, Vault)
- **Payment**: Stripe
- **Deployment**: Vercel

## Getting Started

1. Clone the repository and install dependencies:
```bash
git clone <your-repo-url>
cd llm-apple
npm install
```

2. Copy the environment template and configure your keys:
```bash
cp env.template .env.local
```

3. Set up your Supabase project and update the environment variables

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the platform

## Environment Variables

See `env.template` for all required environment variables. You'll need:
- Supabase project credentials
- Stripe keys for payment processing
- Optional: LLM API keys for platform-provided access

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
├── lib/                # Utilities and configurations
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions
```

## License

MIT License - see LICENSE file for details.
