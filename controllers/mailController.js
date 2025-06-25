const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Sends password changed confirmation email
exports.sendPasswordChangedEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const response = await resend.emails.send({
      from: 'no-reply@entrypointvm.com',
      to: email,
      subject: 'Your password was changed',
      html: `
        <p>Hello,</p>
        <p>This is a confirmation that your password was changed successfully.</p>
        <p>If you did not make this change, please contact support immediately.</p>
        <br/>
        <p>— EntryPoint Team</p>
      `
    });

    res.status(200).json({ message: 'Email sent successfully', response });
  } catch (err) {
    console.error('Resend error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
};
