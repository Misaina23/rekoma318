import dotenv from 'dotenv'

dotenv.config()

async function main() {
  // Import mail util after envs are loaded to avoid constructor-time errors
  const { sendEmail } = await import('../src/utils/mail.js')

  const to = process.env.RESEND_FROM_EMAIL || 'andrianisaina23@gmail.com'
  const subject = 'Test email from REKOMA backend'
  const html = "<p>Ceci est un test d'envoi d'email depuis le backend REKOMA.</p>"
  const text = 'Ceci est un test d envoi d email depuis le backend REKOMA.'

  const res = await sendEmail({ to, subject, html, text })
  console.log('Send result:', res)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
