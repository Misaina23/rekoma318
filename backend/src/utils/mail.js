import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
})

const from = `${process.env.MAIL_FROM_NAME || 'REKOMA'} <${process.env.MAIL_FROM_ADDRESS || 'andrianisaina23@gmail.com'}>`

export async function sendEmail({ to, subject, html, text }) {
  if (!process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
    console.warn('[mail] SMTP credentials missing — email not sent')
    return { success: false, skipped: true }
  }
  try {
    const info = await transporter.sendMail({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    })
    console.log('[mail] sent', info.messageId)
    return { success: true, data: info }
  } catch (err) {
    console.error('[mail] send failed:', err)
    return { success: false, error: err }
  }
}

export function welcomeEmail(name, email) {
  return sendEmail({
    to: email,
    subject: 'Bienvenue chez REKOMA',
    html: `<h1>Bienvenue ${name || ''} !</h1><p>Votre compte REKOMA a bien été créé.</p>`,
    text: `Bienvenue chez REKOMA. Votre compte a bien été créé.`,
  })
}

export function passwordResetEmail(email, resetLink) {
  return sendEmail({
    to: email,
    subject: 'Réinitialisation de votre mot de passe REKOMA',
    html: `<p>Cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    text: `Réinitialisez votre mot de passe : ${resetLink}`,
  })
}

export function contactNotificationEmail({ name, email, subject, message }) {
  return sendEmail({
    to: process.env.CONTACT_TO_EMAIL || 'botomznanga@gmail.com',
    subject: `Nouveau message de contact : ${subject || '(sans objet)'}`,
    html: `<p><strong>De :</strong> ${name} &lt;${email}&gt;</p><p><strong>Message :</strong></p><p>${message}</p>`,
    text: `De : ${name} <${email}>\nMessage : ${message}`,
  })
}

export function twoFactorEmail(email, code) {
  return sendEmail({
    to: email,
    subject: 'Votre code de vérification REKOMA',
    html: `<p>Votre code de vérification à 2 facteurs est : <strong>${code}</strong></p><p>Il expire dans 10 minutes.</p>`,
    text: `Votre code de vérification REKOMA : ${code} (expire dans 10 minutes).`,
  })
}

export function donationReceiptEmail({ name, email, amount, method }) {
  return sendEmail({
    to: email,
    subject: 'Merci pour votre don à REKOMA',
    html: `<h1>Merci ${name || ''} !</h1><p>Nous avons bien reçu votre don de ${amount} Ar (${method}).</p>`,
    text: `Merci pour votre don de ${amount} Ar (${method}).`,
  })
}
