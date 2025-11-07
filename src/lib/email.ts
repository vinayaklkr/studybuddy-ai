import nodemailer from 'nodemailer'

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export async function verifyEmailConfiguration(): Promise<boolean> {
  try {
    await transporter.verify()
    return true
  } catch (error) {
    console.error('[Email] Configuration verification failed:', error)
    return false
  }
}
