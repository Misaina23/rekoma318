// lib/mail.js
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const smtpFromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.RESEND_FROM_EMAIL || 'noreply@rekoma.mg';
const fromEmail = process.env.SMTP_FROM || process.env.RESEND_FROM_EMAIL || process.env.SMTP_USER || 'onboarding@resend.dev';
const fromName = process.env.RESEND_FROM_NAME || 'REKOMA';
const DEV_MODE = process.env.DEV_EMAIL_MODE === 'true';
const DEV_REDIRECT_TO = process.env.DEV_REDIRECT_TO || 'andrianisaina23@gmail.com';
const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'andrianisaina23@gmail.com';

let resendClient = null;
function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_')) {
    try {
      resendClient = new Resend(process.env.RESEND_API_KEY.trim());
    } catch (err) {
      console.warn('[mail] Could not initialize Resend:', err.message);
    }
  }
  return resendClient;
}

let smtpTransporter = null;
function getSmtpTransporter() {
  if (!smtpTransporter && process.env.SMTP_HOST) {
    try {
      const port = Number(process.env.SMTP_PORT) || 587;
      smtpTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST.trim(),
        port,
        secure: port === 465,
        auth: process.env.SMTP_USER ? {
          user: process.env.SMTP_USER.trim(),
          pass: process.env.SMTP_PASSWORD,
        } : undefined,
      });
    } catch (err) {
      console.warn('[mail] Could not initialize SMTP transporter:', err.message);
    }
  }
  return smtpTransporter;
}

/**
 * Fonction utilitaire pour nettoyer le HTML
 */
function cleanHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Envoie un email avec gestion du mode développement et support SMTP + Resend
 */
export async function sendEmail({ to, subject, html, text, replyTo }) {
  try {
    let finalTo = to;
    let isDevRedirect = false;
    let originalTo = to;

    // En mode développement, rediriger tous les emails vers DEV_REDIRECT_TO
    if (DEV_MODE) {
      const recipients = Array.isArray(to) ? to : [to];
      const hasNonDevEmail = recipients.some(email => email !== DEV_REDIRECT_TO);

      if (hasNonDevEmail) {
        console.log(`[DEV MODE] Redirection de ${recipients.join(', ')} vers ${DEV_REDIRECT_TO}`);
        originalTo = recipients.join(', ');
        finalTo = [DEV_REDIRECT_TO];
        isDevRedirect = true;
        subject = `[DEV] ${subject} (pour: ${originalTo})`;
      }
    }

    if (!isDevRedirect) {
      finalTo = Array.isArray(to) ? to : [to];
    }

    const recipientList = Array.isArray(finalTo) ? finalTo : [finalTo];
    console.log(`[mail] Tentative envoi vers=${recipientList.join(', ')} sujet="${subject}"`);

    const htmlContent = html || text?.replace(/\n/g, '<br/>') || '';
    const textContent = text || cleanHtml(html) || '';
    const errors = [];

    // 1. Priorité SMTP si configuré (permet d'envoyer à tous les destinataires sans restriction de domaine sandbox Resend)
    const activeSmtp = getSmtpTransporter();
    if (activeSmtp) {
      try {
        const currentSmtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER || smtpFromEmail;
        const info = await activeSmtp.sendMail({
          from: `${fromName} <${currentSmtpFrom}>`,
          to: recipientList.join(', '),
          subject,
          html: htmlContent,
          text: textContent,
          replyTo: replyTo || CONTACT_TO_EMAIL || undefined,
        });
        console.log('[mail] Email envoyé avec succès via SMTP. ID:', info.messageId);
        return {
          success: true,
          provider: 'smtp',
          info,
          devRedirect: isDevRedirect,
          originalTo: isDevRedirect ? originalTo : null,
        };
      } catch (smtpErr) {
        errors.push(`SMTP: ${smtpErr.message}`);
        console.warn('[mail] Exception lors de l\'envoi SMTP:', smtpErr.message);
      }
    }

    // 2. Essai via Resend si disponible
    const activeResend = getResendClient();
    if (activeResend) {
      try {
        const currentResendFrom = process.env.RESEND_FROM_EMAIL || resendFromEmail;
        const { data, error } = await activeResend.emails.send({
          from: `${fromName} <${currentResendFrom}>`,
          to: recipientList,
          subject,
          html: htmlContent,
          text: textContent,
          replyTo: replyTo || CONTACT_TO_EMAIL || undefined,
        });
        if (error) {
          errors.push(`Resend: ${error.message || JSON.stringify(error)}`);
          console.warn('[mail] Échec Resend API:', error.message || error);
        } else {
          console.log('[mail] Email envoyé avec succès via Resend. ID:', data?.id);
          return {
            success: true,
            provider: 'resend',
            data,
            devRedirect: isDevRedirect,
            originalTo: isDevRedirect ? originalTo : null,
          };
        }
      } catch (resendErr) {
        errors.push(`Resend: ${resendErr.message}`);
        console.warn('[mail] Exception lors de l\'envoi Resend:', resendErr.message);
      }
    }

    // 3. Si aucun fournisseur n'a pu délivrer l'email
    const combinedError = errors.length
      ? errors.join(' | ')
      : 'Aucun service email fonctionnel (configurez SMTP_HOST/SMTP_USER ou un domaine vérifié RESEND_FROM_EMAIL)';
    console.warn(`[mail] Échec d'envoi vers ${recipientList.join(', ')}: ${combinedError}`);
    return {
      success: false,
      logged: true,
      error: combinedError,
      devRedirect: isDevRedirect,
      originalTo: isDevRedirect ? originalTo : null,
    };
  } catch (err) {
    console.error('[mail] send failed:', {
      error: err.message,
      to: Array.isArray(to) ? to : [to],
      subject,
    });
    return { success: false, error: err.message };
  }
}

/**
 * Envoie un email avec gestion des erreurs
 */
export async function sendEmailSafe({ to, subject, html, text, replyTo }) {
  try {
    if (!to) {
      console.warn('[mail] No recipient provided');
      return { success: false, error: 'No recipient provided' };
    }

    const recipients = Array.isArray(to) ? to : [to];
    const validRecipients = recipients.filter(email => email && email.includes('@'));

    if (validRecipients.length === 0) {
      console.warn('[mail] No valid email addresses');
      return { success: false, error: 'No valid email addresses' };
    }

    return await sendEmail({
      to: validRecipients,
      subject,
      html,
      text,
      replyTo,
    });
  } catch (error) {
    console.error('[mail] sendEmailSafe failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Email de bienvenue
 */
export function welcomeEmail(name, email) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #4CAF50; text-align: center;">Bienvenue chez ${fromName} !</h2>
      <p style="font-size: 16px; color: #555;">Bonjour ${name || ''},</p>
      <p style="font-size: 16px; color: #555;">Nous sommes ravis de vous accueillir parmi nos membres.</p>
      <p style="font-size: 16px; color: #555;">Votre compte a bien été créé.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
          Accéder à mon compte
        </a>
      </div>
      <p style="font-size: 14px; color: #777; text-align: center;">© ${new Date().getFullYear()} ${fromName} - Tous droits réservés.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Bienvenue chez ${fromName}`,
    html,
    text: `Bonjour ${name || ''},\n\nBienvenue chez ${fromName}. Votre compte a bien été créé.\n\nAccédez à votre compte : ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard`,
  });
}

/**
 * Email de réinitialisation de mot de passe
 */
export function passwordResetEmail(email, resetLink) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #333; text-align: center;">Réinitialisation du mot de passe</h2>
      <p style="font-size: 16px; color: #555;">Vous avez demandé à réinitialiser votre mot de passe.</p>
      <p style="font-size: 16px; color: #555;">Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background: #2196F3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
          Réinitialiser mon mot de passe
        </a>
      </div>
      <p style="font-size: 14px; color: #777;">Ce lien expire dans 1 heure.</p>
      <p style="font-size: 14px; color: #777;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Réinitialisation de votre mot de passe - ${fromName}`,
    html,
    text: `Réinitialisation du mot de passe\n\nVous avez demandé à réinitialiser votre mot de passe.\n\nCliquez sur ce lien pour créer un nouveau mot de passe : ${resetLink}\n\nCe lien expire dans 1 heure.`,
  });
}

/**
 * Email de notification de contact
 */
export function contactNotificationEmail({ name, email, subject, message }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #333;">📩 Nouveau message de contact</h2>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>De :</strong> ${name} &lt;${email}&gt;</p>
        <p><strong>Sujet :</strong> ${subject || '(sans objet)'}</p>
        <hr style="margin: 10px 0;" />
        <p><strong>Message :</strong></p>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      </div>
      <p style="font-size: 12px; color: #999;">Envoyé depuis le formulaire de contact</p>
    </div>
  `;

  return sendEmail({
    to: CONTACT_TO_EMAIL,
    subject: `📩 Nouveau message de contact : ${subject || '(sans objet)'}`,
    html,
    text: `Nouveau message de contact\n\nDe : ${name} <${email}>\nSujet : ${subject || '(sans objet)'}\n\nMessage :\n${message}`,
    replyTo: email,
  });
}

/**
 * Email de vérification d'email
 */
export function emailVerificationEmail(email, link) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #333; text-align: center;">Vérification de votre adresse email</h2>
      <p style="font-size: 16px; color: #555;">Merci de vous être inscrit. Veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous :</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" style="background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
          Vérifier mon email
        </a>
      </div>
      <p style="font-size: 14px; color: #777;">Ce lien expire dans 24 heures.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Vérifiez votre adresse email - ${fromName}`,
    html,
    text: `Vérification d'email\n\nCliquez sur ce lien pour vérifier votre adresse : ${link}\n\nCe lien expire dans 24 heures.`,
  });
}

/**
 * Email de code 2FA
 */
export function twoFactorEmail(email, code, username = '') {
  console.log('\n==================================================');
  console.log(`🔐 [AUTHENTIFICATION 2FA REKOMA]`);
  console.log(`Destinataire : ${email}`);
  console.log(`Code généré  : ${code}`);
  console.log(`Validité     : 10 minutes`);
  console.log('==================================================\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #333; text-align: center; border-bottom: 2px solid #4CAF50; padding-bottom: 15px;">
        🔐 Code de vérification
      </h2>
      <p style="font-size: 16px; color: #555; text-align: center; margin: 25px 0;">
        ${username ? `Bonjour <strong>${username}</strong>,` : 'Bonjour,'}
      </p>
      <p style="font-size: 16px; color: #555; text-align: center;">
        Voici votre code de vérification à deux facteurs :
      </p>
      <div style="text-align: center; background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 8px; background: white; padding: 10px 25px; border-radius: 5px; border: 2px dashed #4CAF50;">
          ${code}
        </span>
      </div>
      <p style="font-size: 14px; color: #777; text-align: center;">
        Ce code est valable pendant 10 minutes.
      </p>
      <p style="font-size: 14px; color: #777; text-align: center;">
        ⚠️ Ne partagez jamais ce code avec personne.
      </p>
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="font-size: 12px; color: #999;">
          Si vous n'avez pas demandé ce code, ignorez cet email.
        </p>
      </div>
    </div>
  `;

  return sendEmailSafe({
    to: email,
    subject: `Code de vérification ${fromName} : ${code}`,
    html,
    text: `Code de vérification ${fromName}\n\n${username ? `Bonjour ${username},\n\n` : ''}Votre code de vérification est : ${code}\n\nCe code expire dans 10 minutes.\nNe partagez jamais ce code.`,
  });
}

/**
 * Email de reçu de don
 */
export function donationReceiptEmail({ name, email, amount, method, donationId }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #4CAF50; text-align: center;">🙏 Merci pour votre don !</h2>
      <p style="font-size: 16px; color: #555;">Bonjour ${name || ''},</p>
      <p style="font-size: 16px; color: #555;">Nous vous remercions chaleureusement pour votre générosité.</p>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>Montant :</strong> ${amount} Ar</p>
        <p><strong>Méthode :</strong> ${method}</p>
        ${donationId ? `<p><strong>Référence :</strong> ${donationId}</p>` : ''}
      </div>
      <p style="font-size: 14px; color: #777;">Votre don contribue directement à nos actions.</p>
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="font-size: 12px; color: #999;">© ${new Date().getFullYear()} ${fromName} - Tous droits réservés.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Merci pour votre don - ${fromName}`,
    html,
    text: `Merci pour votre don ${name || ''} !\n\nMontant : ${amount} Ar\nMéthode : ${method}\n${donationId ? `Référence : ${donationId}\n` : ''}\nVotre don contribue directement à nos actions.`,
  });
}

/**
 * Email de réponse à un message
 */
export function replyMessageEmail({ to, subject, body, originalMessage }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h3 style="color: #333;">📧 ${fromName} vous a répondu</h3>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
        <p>${body.replace(/\n/g, '<br/>')}</p>
      </div>
      <hr style="margin: 20px 0;" />
      <p style="font-size: 14px; color: #666; margin-bottom: 5px;">📝 Message original :</p>
      <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; font-size: 14px; color: #555;">
        <p><strong>De :</strong> ${originalMessage.name}</p>
        <p><strong>Sujet :</strong> ${originalMessage.subject || '(sans objet)'}</p>
        <hr style="margin: 8px 0;" />
        <p>${originalMessage.body.replace(/\n/g, '<br/>')}</p>
      </div>
      <p style="font-size: 12px; color: #999; margin-top: 20px;">
        Pour répondre, cliquez sur "Répondre" dans votre client email.
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: `RE: ${subject || 'Votre message à REKOMA'}`,
    html,
    text: `${fromName} vous a répondu :\n\n${body}\n\n---\nMessage original :\n${originalMessage.body}`,
    replyTo: CONTACT_TO_EMAIL,
  });
}

/**
 * Vérification de la configuration SMTP
 */
export async function verifySMTP() {
  try {
    const activeSmtp = getSmtpTransporter();
    if (activeSmtp) {
      await activeSmtp.verify();
    }
    const result = await sendEmailSafe({
      to: DEV_REDIRECT_TO,
      subject: `Test de configuration email - ${fromName}`,
      html: '<p>✅ Votre configuration email fonctionne correctement.</p>',
      text: '✅ Votre configuration email fonctionne correctement.',
    });

    return {
      success: result.success === true,
      provider: result.provider || (activeSmtp ? 'smtp' : 'resend'),
      error: result.error || null,
      devMode: DEV_MODE,
      devRedirectTo: DEV_REDIRECT_TO,
      fromEmail,
      fromName,
      testResult: result,
    };
  } catch (error) {
    return {
      success: false,
      provider: process.env.SMTP_HOST ? 'smtp' : 'resend',
      error: error.message,
      devMode: DEV_MODE,
      fromEmail,
      fromName,
    };
  }
}

// Exporter la configuration pour utilisation ailleurs
export const config = {
  fromEmail,
  fromName,
  devMode: DEV_MODE,
  devRedirectTo: DEV_REDIRECT_TO,
  contactToEmail: CONTACT_TO_EMAIL,
};