import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  
  try {
    const { name, email, org_type, scope, message } = req.body || {};
    
    // Validation
    if (!name || name.length < 2 || name.length > 150) {
      return res.status(400).json({ ok: false, error: 'Некорректное имя' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: 'Некорректный email' });
    }
    if (!message || message.length < 5 || message.length > 2000) {
      return res.status(400).json({ ok: false, error: 'Сообщение слишком короткое/длинное' });
    }
    
    // SMTP транспорт через Gmail (нужен App Password)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER, // твой gmail
        pass: process.env.SMTP_PASS  // App Password
      }
    });
    
    const subject = `🔔 VECTOR-AI: заявка от ${name}`;
    const text = [
      'Новая заявка VECTOR-AI by',
      '',
      `Имя/Организация: ${name}`,
      `Email: ${email}`,
      `Тип: ${org_type || '—'}`,
      `Масштаб: ${scope || '—'}`,
      '',
      'Задача:',
      message,
      '',
      `—`,
      `Получено: ${new Date().toISOString()}`
    ].join('\n');
    
    await transporter.sendMail({
      from: `"VECTOR-AI" <${process.env.SMTP_USER}>`,
      to: process.env.MAIL_TO || process.env.SMTP_USER,
      subject,
      text
    });
    
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ ok: false, error: 'Ошибка отправки' });
  }
}
