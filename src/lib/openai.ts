import OpenAI from 'openai'

// Initialize Groq with your API key (using OpenAI SDK with custom base URL)
const apiKey = process.env.GROQ_API_KEY || ''
console.log('[Groq] Initializing with API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING')

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.groq.com/openai/v1',
})

export async function generateAnswer(
  question: string,
  context: string | null,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> {
  console.log('[generateAnswer] Starting...')
  console.log('[generateAnswer] Question:', question.substring(0, 100))
  console.log('[generateAnswer] Has context:', !!context)
  console.log('[generateAnswer] Conversation history length:', conversationHistory.length)

  try {
    // Build system prompt based on whether we have document context
    const systemPrompt = context
      ? `You are a helpful study buddy assistant. The student has uploaded a PDF document and you must use it to answer their questions.

IMPORTANT: The full text of their PDF document is provided below. You MUST read and reference this document when answering their questions.

When answering questions:
- PRIMARY: Answer based on the PDF document content provided below
- If the answer is in the document, clearly reference specific parts of it
- If the question cannot be answered from the document, say so explicitly and then provide general knowledge
- Be thorough and cite specific information from the document
- Use examples from the document when helpful

PDF DOCUMENT CONTENT:
${context}

Remember: The student expects you to have read and understood their PDF document. Reference it directly in your answers.`
      : `You are a helpful study buddy assistant. You help students learn and understand various topics.

When answering questions:
- Provide clear, accurate, and helpful answers
- Be concise but thorough
- Use examples when helpful
- Encourage learning and understanding
- If the student needs help with a specific document, suggest they upload it so you can provide more targeted assistance
- You can help with homework, exam preparation, concept clarification, and general learning support`

    // Build messages array for OpenAI
    console.log('[generateAnswer] Building messages for OpenAI')
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: question,
      },
    ]
    console.log('[generateAnswer] Built messages array with', messages.length, 'messages')

    // Call Groq API
    console.log('[generateAnswer] Calling Groq API with llama-3.3-70b-versatile...')
    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    })
    console.log('[generateAnswer] Received response from Groq')

    const text = completion.choices[0]?.message?.content || ''
    console.log('[generateAnswer] Response text length:', text.length)

    return text || 'Sorry, I could not generate a response.'
  } catch (error: unknown) {
    console.error('[generateAnswer] ERROR occurred!')

    const err = error as { constructor?: { name: string }; message?: string; status?: number }
    console.error('[generateAnswer] Error type:', err?.constructor?.name)
    console.error('[generateAnswer] Error message:', err?.message)
    console.error('[generateAnswer] Error status:', err?.status)
    console.error('[generateAnswer] Full error:', JSON.stringify(error, null, 2))

    // Provide more specific error messages
    if (err?.message?.includes('API key')) {
      throw new Error('Invalid Groq API key. Please check your .env file and ensure GROQ_API_KEY is set correctly.')
    }
    if (err?.message?.includes('quota') || err?.message?.includes('rate_limit')) {
      throw new Error('Groq API quota exceeded or rate limit reached. Please check your usage at https://console.groq.com')
    }
    if (err?.status === 401) {
      throw new Error('Unauthorized: Please check your Groq API key.')
    }

    const errorMessage = err?.message || 'Unknown error'
    throw new Error(`Failed to generate answer: ${errorMessage}`)
  }
}

export async function generateTitle(firstMessage: string): Promise<string> {
  console.log('[generateTitle] Starting for message:', firstMessage.substring(0, 50))

  try {
    const prompt = `Generate a short, concise title (max 5 words) for this conversation based on the first message: "${firstMessage}". Only respond with the title, nothing else.`

    console.log('[generateTitle] Calling Groq API...')
    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 20,
    })

    const text = completion.choices[0]?.message?.content || ''
    console.log('[generateTitle] Generated title:', text)

    return text.trim() || 'New Chat'
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('[generateTitle] ERROR:', err?.message)
    console.error('[generateTitle] Full error:', error)
    return 'New Chat'
  }
}
