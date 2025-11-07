// @ts-ignore - pdf2json doesn't have perfect TypeScript support
import PDFParser from 'pdf2json'

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const pdfParser = new PDFParser()

      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('Error parsing PDF:', errData.parserError)
        reject(new Error('Failed to extract text from PDF'))
      })

      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          let text = ''

          // Extract text from all pages
          if (pdfData.Pages) {
            pdfData.Pages.forEach((page: any) => {
              if (page.Texts) {
                page.Texts.forEach((textItem: any) => {
                  if (textItem.R) {
                    textItem.R.forEach((r: any) => {
                      if (r.T) {
                        // Decode URI encoded text
                        text += decodeURIComponent(r.T) + ' '
                      }
                    })
                  }
                })
                text += '\n\n' // Add paragraph break after each page
              }
            })
          }

          resolve(text.trim())
        } catch (error) {
          console.error('Error processing PDF data:', error)
          reject(new Error('Failed to process PDF content'))
        }
      })

      // Parse the buffer
      pdfParser.parseBuffer(buffer)
    } catch (error) {
      console.error('Error extracting text from PDF:', error)
      reject(new Error('Failed to extract text from PDF'))
    }
  })
}

export function chunkText(text: string, maxChunkSize: number = 3000): string[] {
  const chunks: string[] = []
  let currentChunk = ''

  const paragraphs = text.split('\n\n')

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
      }

      if (paragraph.length > maxChunkSize) {
        const words = paragraph.split(' ')
        for (const word of words) {
          if (currentChunk.length + word.length > maxChunkSize) {
            chunks.push(currentChunk.trim())
            currentChunk = word + ' '
          } else {
            currentChunk += word + ' '
          }
        }
      } else {
        currentChunk = paragraph + '\n\n'
      }
    } else {
      currentChunk += paragraph + '\n\n'
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}
