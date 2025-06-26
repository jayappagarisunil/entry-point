const supabase = require('../services/supabaseClient');
const { resend } = require('../services/resendClient');
const { sendTelegramMessage } = require('../services/telegramClient');

const handleContactRequest = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Save to Supabase
    const { error: dbError } = await supabase
      .from('contact_requests')
      .insert([{ name, email, message }]);

    if (dbError) {
      console.error('Supabase error:', dbError);
      return res.status(500).json({ error: 'Database insert failed' });
    }

    // Send email via Resend
    await resend.emails.send({
      from: 'Entry Point <no-reply@theyuvai.com>',
      to: ['jayappagarisunil@gmail.com'],
      subject: 'New Contact Request from VisitorFlow',
      html: `
        <h2>New Contact Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `
    });

    // Send Telegram message
    await sendTelegramMessage(
      `📩 *New Contact Request*\n\n👤 *Name:* ${name}\n📧 *Email:* ${email}\n💬 *Message:* ${message}`
    );

    return res.status(200).json({ success: true, message: 'Request submitted successfully' });
  } catch (err) {
    console.error('Contact error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { handleContactRequest };
