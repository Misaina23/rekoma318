import { Resend } from 'resend'

// Instantiate Resend only when API key is present to avoid errors at module import time.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const from = `${process.env.RESEND_FROM_NAME || 'REKOMA'} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`

/**
 * Send a transactional email via Resend.
 * Fails soft: logs the error but never throws (email must not break the request).
 */
export async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[mail] RESEND_API_KEY missing — email not sent')
    return { success: false, skipped: true }
  }
  try {
    if (!resend) {
      console.warn('[mail] Resend client not instantiated — email not sent')
      return { success: false, skipped: true }
    }
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    })
    if (error) {
      console.error('[mail] Resend error:', error)
      return { success: false, error }
    }
    return { success: true, data }
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

export function donationReceiptEmail({ name, email, amount, method }) {
  return sendEmail({
    to: email,
    subject: 'Merci pour votre don à REKOMA',
    html: `<h1>Merci ${name || ''} !</h1><p>Nous avons bien reçu votre don de ${amount} Ar (${method}).</p>`,
    text: `Merci pour votre don de ${amount} Ar (${method}).`,
  })
}
