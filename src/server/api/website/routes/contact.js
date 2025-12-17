const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

/**
 * @route POST /api/website/contact
 * @desc Send contact form email
 * @access Public (no auth required)
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'All fields are required: name, email, phone, message'
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Invalid email format'
        }
      });
    }

    // Create transporter using default SMTP settings
    const transporter = nodemailer.createTransport({
      host: process.env.DEFAULT_SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.DEFAULT_SMTP_PORT || '465'),
      secure: process.env.DEFAULT_SMTP_SECURE === 'true',
      auth: {
        user: process.env.DEFAULT_SMTP_USERNAME,
        pass: process.env.DEFAULT_SMTP_PASSWORD
      }
    });

    // Prepare email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #B725B7, #E91E63); padding: 30px; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .field { margin-bottom: 20px; }
          .field-label { font-weight: bold; color: #B725B7; margin-bottom: 5px; }
          .field-value { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #B725B7; }
          .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #E91E63; white-space: pre-wrap; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Novo Contato do Site LivoCare</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="field-label">Nome</div>
              <div class="field-value">${escapeHtml(name)}</div>
            </div>
            <div class="field">
              <div class="field-label">E-mail</div>
              <div class="field-value"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
            </div>
            <div class="field">
              <div class="field-label">Telefone</div>
              <div class="field-value">${escapeHtml(phone)}</div>
            </div>
            <div class="field">
              <div class="field-label">Mensagem</div>
              <div class="message-box">${escapeHtml(message)}</div>
            </div>
          </div>
          <div class="footer">
            Este e-mail foi enviado automaticamente pelo formulário de contato do site livocare.ai
          </div>
        </div>
      </body>
      </html>
    `;

    const plainText = `
Novo Contato do Site LivoCare
=============================

Nome: ${name}
E-mail: ${email}
Telefone: ${phone}

Mensagem:
${message}

---
Este e-mail foi enviado automaticamente pelo formulário de contato do site livocare.ai
    `.trim();

    // Send email
    const mailOptions = {
      from: `"LivoCare Website" <${process.env.DEFAULT_SMTP_FROM_EMAIL || 'admin@livocare.ai'}>`,
      to: 'admin@livocare.ai',
      cc: 'andre.melo9715@gmail.com',
      replyTo: email,
      subject: `[Site LivoCare] Novo contato de ${name}`,
      text: plainText,
      html: emailHtml
    };

    await transporter.sendMail(mailOptions);

    console.log(`📧 Website contact email sent from ${email}`);

    res.json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('❌ Website contact email error:', error);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Failed to send message. Please try again later.'
      }
    });
  }
});

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

module.exports = router;
