import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabaseAdmin } from '@/lib/supabase'
import { extractTextFromPDF } from '@/lib/pdf'
import { getSession } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  console.log('File upload request received')
  try {
    const session = await getSession()
    console.log('Session:', session ? 'Found' : 'Not found')
    if (!session) {
      console.error('Unauthorized: No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if environment variables are configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase environment variables not configured')
      return NextResponse.json(
        { error: 'Server not configured. Please set up Supabase environment variables.' },
        { status: 500 }
      )
    }

    if (!process.env.DATABASE_URL) {
      console.error('Database URL not configured')
      return NextResponse.json(
        { error: 'Server not configured. Please set up DATABASE_URL environment variable.' },
        { status: 500 }
      )
    }

    console.log('Parsing form data...')
    const formData = await request.formData()
    console.log('Form data keys:', [...formData.keys()])
    
    const file = formData.get('file') as File | null
    console.log('File from form data:', file ? {
      name: file.name,
      size: file.size,
      type: file.type
    } : 'No file found')

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      )
    }

    console.log('Processing PDF:', file.name, 'Size:', file.size)

    // Convert file to buffer
    console.log('Converting file to buffer...')
    let buffer: Buffer
    try {
      const bytes = await file.arrayBuffer()
      buffer = Buffer.from(bytes)
      console.log('File converted to buffer, size:', buffer.length, 'bytes')
    } catch (bufferError) {
      console.error('Error converting file to buffer:', bufferError)
      return NextResponse.json(
        { error: 'Failed to process file. The file might be corrupted.' },
        { status: 400 }
      )
    }

    console.log('Extracting text from PDF...')
    // Extract text from PDF
    let text = ''
    try {
      text = await extractTextFromPDF(buffer)
      console.log('Text extracted successfully. Length:', text.length)
    } catch (pdfError) {
      console.error('PDF extraction error:', pdfError)
      return NextResponse.json(
        { error: 'Failed to extract text from PDF. Make sure the file is a valid PDF.' },
        { status: 500 }
      )
    }

    console.log('Uploading to Supabase Storage...')
    const bucketName = 'pdfs'
    const fileName = `${Date.now()}-${file.name}`
    
    try {
      // Check if bucket exists, create if it doesn't
      const { data: bucketExists } = await supabaseAdmin.storage.getBucket(bucketName)
      if (!bucketExists) {
        console.log(`Bucket '${bucketName}' not found, creating...`)
        const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: '50MB',
          allowedMimeTypes: ['application/pdf'],
        })
        
        if (createError) {
          console.error('Error creating bucket:', createError)
          throw new Error(`Failed to create bucket: ${createError.message}`)
        }
        console.log(`Bucket '${bucketName}' created successfully`)
      }

      // Upload the file
      console.log(`Uploading file to bucket '${bucketName}':`, fileName)
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(fileName, buffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Failed to upload file: ${uploadError.message}`)
      }
      
      console.log('File uploaded successfully:', uploadData)
      
      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file')
      }

      console.log('Saving to database...')
      
      // Create the document using Prisma's create method
      const document = await prisma.document.create({
        data: {
          userId: session.userId,
          title: file.name.replace(/\.pdf$/i, ''),
          fileName: file.name,
          fileUrl: urlData.publicUrl,
          fileSize: file.size,
          content: text,
        },
        select: {
          id: true,
          title: true,
          fileName: true,
          fileUrl: true,
          fileSize: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      console.log('Document created successfully:', document.id);
      
      // Update progress in a separate try-catch to not fail the whole operation if this fails
      try {
        await prisma.$executeRaw`
          INSERT INTO "Progress" ("id", "userId", "date", "documentsRead", "studyTime", "questionsAnswered", "focusSessions")
          VALUES (gen_random_uuid(), ${session.userId}::uuid, CURRENT_DATE, 1, 0, 0, 0)
          ON CONFLICT ("userId", "date") 
          DO UPDATE SET "documentsRead" = "Progress"."documentsRead" + 1
        `;
        console.log('Progress updated successfully');
      } catch (progressError) {
        console.error('Error updating progress (non-critical):', progressError);
        // Continue even if progress update fails
      }
      
      // Return the created document
      return NextResponse.json({
        id: document.id,
        title: document.title,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString()
      });
    } catch (error) {
      console.error('Database error:', error);
      let errorMessage = 'Failed to save to database.';
      let errorDetails = undefined;
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Prisma error code:', error.code);
        console.error('Prisma error meta:', error.meta);
        
        if (error.code === 'P2002') {
          errorMessage = 'A document with this name already exists.';
        } else if (error.code === 'P1001') {
          errorMessage = 'Cannot connect to the database. Please check your connection.';
        } else if (error.code === 'P1012') {
          errorMessage = 'Database schema is not up to date. Please run migrations.';
        }
        
        errorDetails = error.message;
      } else if (error instanceof Error) {
        errorDetails = error.message;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? errorDetails : undefined 
        },
        { status: 500 }
      );
    }

    // This code is unreachable as we're already returning from the try block
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  } catch (error) {
    console.error('Error processing PDF:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to process PDF: ${errorMessage}` },
      { status: 500 }
    )
  }
}
