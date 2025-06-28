const supabase = require('../services/supabaseClient');
const { resend } = require('../services/resendClient');
const { sendTelegramMessage } = require('../services/telegramClient');

const handleContactRequest = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, message, phone, state } = req.body;

  if (!name || !email || !message || !phone || !state) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Save to Supabase
    const { error: dbError } = await supabase
      .from('contact_requests')
      .insert([{ name, email, message, phone, state }]);

    if (dbError) {
      console.error('Supabase error:', dbError);
      return res.status(500).json({ error: 'Database insert failed' });
    }

    // Send admin email
    await resend.emails.send({
      from: 'Entry Point <no-reply@theyuvai.com>',
      to: ['jayappagarisunil@gmail.com'],
      subject: 'New Contact Request for entry point',
      html: `
        <h2>New Contact Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>State:</strong> ${state}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `
    });

    // Send Telegram message
    await sendTelegramMessage(
      `📩 *New Contact Request*\n\n👤 *Name:* ${name}\n📧 *Email:* ${email}\n📱 *Phone:* ${phone}\n📍 *State:* ${state}\n💬 *Message:* ${message}`
    );

    // Send confirmation email to user
    await resend.emails.send({
      from: 'Entry Point <no-reply@theyuvai.com>',
      to: [email],
      subject: 'Thank you for contacting Entry Point!',
      html: `
        <h2>Hello ${name},</h2>
        <p>Thank you for reaching out to us. We’ve received your message and our team will get in touch with you shortly.</p>
        <p>If you need immediate assistance, feel free to reply to this email.</p>
        <br/>
        <p>Best regards,<br/>Entry Point Team</p>
      `
    });

    return res.status(200).json({ success: true, message: 'Request submitted successfully' });
  } catch (err) {
    console.error('Contact error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { handleContactRequest };
