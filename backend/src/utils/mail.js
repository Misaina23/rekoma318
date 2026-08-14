import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const fromName = process.env.RESEND_FROM_NAME || 'REKOMA'

export async function sendEmail({ to, subject, html, text }) {
  try {
    console.log(`[mail] send to=${Array.isArray(to) ? to.join(',') : to} subject=${subject}`)

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || text,
      text: text || (html ? html.replace(/<[^>]+>/g, '') : ''),
    })

    if (error) {
      console.error('[mail] Resend error:', error)
      throw new Error(error.message || 'Resend send failed')
    }

    console.log('[mail] sent', data?.id)
    return { success: true, data }
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

export async function verifySMTP() {
  return { success: true, provider: 'resend' }
}
