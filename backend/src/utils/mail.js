import nodemailer from 'nodemailer'

let transporter = null

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.MAIL_HOST
  const port = Number(process.env.MAIL_PORT || 587)
  const encryption = String(process.env.MAIL_ENCRYPTION || '').toLowerCase()
  const secure = encryption === 'ssl' || port === 465
  const user = process.env.MAIL_USERNAME
  const pass = process.env.MAIL_PASSWORD

  if (!host || !user || !pass) {
    console.warn('[mail] SMTP configuration missing (MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD)')
    return null
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    family: 4,
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    debug: process.env.NODE_ENV !== 'production',
    logger: process.env.NODE_ENV !== 'production',
  })

  return transporter
}

const from = `${process.env.MAIL_FROM_NAME || 'REKOMA'} <${process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME || 'andrianisaina23@gmail.com'}>`

export async function verifySMTP() {
  const t = getTransporter()
  if (!t) return { success: false, error: 'SMTP configuration missing' }
  try {
    const result = await t.verify()
    console.log('[mail] SMTP connection verified successfully')
    return { success: true, data: result }
  } catch (err) {
    console.error('[mail] SMTP connection failed:', err.message)
    return { success: false, error: err.message }
  }
}

export async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter()
  if (!t) {
    const error = 'SMTP not configured'
    console.error('[mail] send failed:', error)
    throw new Error(error)
  }

  try {
    const info = await t.sendMail({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    })
    console.log('[mail] sent', {
      messageId: info.messageId,
      to: Array.isArray(to) ? to : [to],
      subject,
    })
    return { success: true, data: info }
  } catch (err) {
    console.error('[mail] send failed:', {
      error: err.message,
      code: err.code,
      to: Array.isArray(to) ? to : [to],
      subject,
    })
    throw err
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

export function emailVerificationEmail(email, link) {
  return sendEmail({
    to: email,
    subject: 'Vérifiez votre adresse email REKOMA',
    html: `<p>Cliquez sur le lien suivant pour vérifier votre adresse email :</p><p><a href="${link}">${link}</a></p>`,
    text: `Vérifiez votre adresse email : ${link}`,
  })
}

export function twoFactorEmail(email, code) {
  return sendEmail({
    to: email,
    subject: 'Votre code de vérification REKOMA',
    html: `<p>Votre code de vérification est :</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px;text-align:center;margin:16px 0;">${code}</p><p>Ce code expire dans 10 minutes.</p><p>Ne partagez jamais ce code.</p>`,
    text: `Votre code de vérification REKOMA : ${code}\nCe code expire dans 10 minutes.\nNe partagez jamais ce code.`,
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

