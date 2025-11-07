# Quick Setup Guide

Follow these steps to get your Study Buddy AI app running:

## 1. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Storage** → Create a bucket named `pdfs` (make it public)
3. Get your credentials from **Project Settings**:
   - API: Get URL, anon key, and service role key
   - Database: Get connection strings (URI and Direct)

## 2. Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create a new API key

## 3. Configure Environment Variables

Edit `.env.local` with your credentials:

```env
DATABASE_URL="your-supabase-database-url"
DIRECT_URL="your-supabase-direct-url"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
OPENAI_API_KEY="your-openai-key"
```

## 4. Set Up Database

```bash
# Quick setup (runs both generate and migrate)
npm run setup

# Or run individually:
npm run db:generate
npm run db:migrate
```

## 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Troubleshooting

- **Database errors**: Make sure you completed step 4
- **Upload errors**: Check that the `pdfs` bucket exists in Supabase Storage
- **AI errors**: Verify your OpenAI API key and billing setup

For detailed instructions, see [README.md](./README.md)
