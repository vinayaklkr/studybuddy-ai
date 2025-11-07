# Study Buddy AI

An AI-powered study companion built with Next.js that helps students learn from their PDF documents. Upload your study materials and ask questions to get instant, intelligent answers.

## Features

- **PDF Upload & Processing**: Upload PDF documents and automatically extract text content
- **AI-Powered Q&A**: Ask questions about your documents and get intelligent answers
- **General Knowledge**: Ask questions beyond the document content
- **Chat Sessions**: Maintain multiple chat sessions per document
- **Beautiful UI**: Modern, responsive interface built with Shadcn UI and Tailwind CSS
- **Persistent Storage**: Documents and chats saved to Supabase PostgreSQL database

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL) with Prisma ORM
- **AI**: OpenAI GPT-4o-mini
- **PDF Processing**: pdf-parse
- **Storage**: Supabase Storage for PDF files

## Prerequisites

Before you begin, ensure you have:

- Node.js 20.15.0 or higher
- npm or yarn
- A Supabase account (free tier is fine)
- An OpenAI API key

## Setup Instructions

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Go to **Project Settings** > **API** and copy:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Project API Key / anon public (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)
4. Go to **Project Settings** > **Database** and copy:
   - Connection String (URI) for `DATABASE_URL`
   - Connection String (Direct) for `DIRECT_URL`
5. Create a storage bucket:
   - Go to **Storage** in the left sidebar
   - Click **New bucket**
   - Name it `pdfs`
   - Make it **public** (or configure your own access policies)
   - Click **Create bucket**

### 2. OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (you won't be able to see it again)

### 3. Environment Variables

Update the `.env.local` file in the root directory with your credentials:

```env
# Database
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# OpenAI
OPENAI_API_KEY="sk-..."
```

### 4. Database Migration

Run Prisma migrations to create the database tables:

```bash
npx prisma migrate dev --name init
```

This will create three tables:
- `documents`: Stores PDF metadata and extracted text
- `chat_sessions`: Stores chat sessions for each document
- `messages`: Stores individual messages in chat sessions

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Upload a PDF**: Click "Upload PDF" in the sidebar or on the welcome screen
2. **Wait for Processing**: The app will extract text from your PDF (may take a few seconds)
3. **Start a Chat**: Click "Start New Chat" or the "+" button
4. **Ask Questions**: Type your question and press Enter or click Send
5. **Get Answers**: The AI will respond based on your document and general knowledge

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── chat/         # Chat message handling
│   │   ├── documents/    # Document upload and management
│   │   └── sessions/     # Chat session management
│   ├── globals.css       # Global styles
│   └── page.tsx          # Main page
├── components/
│   ├── ui/               # Shadcn UI components
│   ├── ChatArea.tsx      # Chat interface
│   ├── Sidebar.tsx       # Document and session sidebar
│   ├── StudyBuddyApp.tsx # Main app component
│   └── WelcomeScreen.tsx # Welcome screen
├── lib/
│   ├── openai.ts         # OpenAI integration
│   ├── pdf.ts            # PDF processing utilities
│   ├── prisma.ts         # Prisma client
│   └── supabase.ts       # Supabase client
└── types/
    └── index.ts          # TypeScript types

prisma/
└── schema.prisma         # Database schema
```

## Features Explained

### PDF Processing
- Uploaded PDFs are stored in Supabase Storage
- Text is extracted using pdf-parse library
- Both metadata and content are saved to PostgreSQL

### AI Responses
- Uses OpenAI's GPT-4o-mini model for cost-effective responses
- Maintains conversation history for context
- Can answer questions both about the document and general knowledge
- Automatically generates chat titles from first message

### Database Schema
- **Documents**: Stores PDF info and extracted text
- **ChatSessions**: Multiple chat sessions per document
- **Messages**: All user and AI messages with full history

## Troubleshooting

### "Failed to upload document"
- Check that your Supabase storage bucket named "pdfs" exists and is public
- Verify your Supabase credentials in `.env.local`

### "Failed to generate answer"
- Verify your OpenAI API key is correct
- Check that you have credits/billing set up in OpenAI
- Check the browser console for detailed error messages

### Database errors
- Make sure you ran `npx prisma migrate dev --name init`
- Verify your database connection strings in `.env.local`
- Try running `npx prisma generate` again

### Node version warnings
- The app requires Node.js 20.16.0 or higher for pdf-parse
- Update Node.js if you see engine warnings

## Future Enhancements

Potential features to add:
- User authentication
- Document sharing
- Export chat history
- Support for more file formats (DOCX, TXT, etc.)
- Vector embeddings for better context retrieval
- Multi-language support
- Document highlighting and annotations

## License

MIT

## Contributing

Feel free to open issues or submit pull requests!
