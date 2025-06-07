const supabase = require('../services/supabaseClient');

const approvedMessages = [
  'Welcome! Please proceed.',
  'Access granted. Have a great visit!',
  'You are approved. Enjoy your time!',
  'Entry allowed. Thank you for visiting.',
];

exports.verifyQRToken = async (req, res) => {
  const { qr_token, security_id, entry_gate } = req.body;

  if (!qr_token || qr_token.trim() === '') {
    return res.status(400).json({ error: 'QR token is required' });
  }

  try {
    // Fetch visitor by invite_token
    const { data: visitor, error: visitorError } = await supabase
      .from('visitors')
      .select('*')
      .eq('invite_token', qr_token)
      .single();

    if (visitorError || !visitor) {
      return res.status(404).json({
        status: 'not_found',
        message: 'Visitor not found. Please contact admin.',
      });
    }

    // Fetch whom_to_meet name from users table
    let whomToMeetName = 'the concerned person';
    if (visitor.whom_to_meet) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('id', visitor.whom_to_meet)
        .single();

      if (!userError && user) {
        whomToMeetName = user.name;
      }
    }

    const visitorDetails = {
      name: visitor.name,
      purpose: visitor.purpose,
      whom_to_meet: whomToMeetName,
    };

    switch (visitor.status) {
      case 'pending':
        return res.json({
          status: 'pending',
          message: `Approval pending. Please wait for approval from ${whomToMeetName}.`,
          visitor: visitorDetails,
        });

      case 'approved': {
        const { error: logError } = await supabase
          .from('entry_logs')
          .insert([{
            visitor_id: visitor.id,
            security_id: security_id || null,
            entry_gate: entry_gate || null,
            location: visitor.location || null,
            remarks: 'Entry granted by security scan',
          }]);

        if (logError) {
          console.error('Entry log insertion error:', logError);
          return res.status(500).json({
            status: 'approved',
            message: 'Entry allowed, but failed to log entry. Please notify admin.',
            visitor: visitorDetails,
          });
        }

        const randomMessage = approvedMessages[Math.floor(Math.random() * approvedMessages.length)];

        return res.json({
          status: 'approved',
          message: randomMessage,
          visitor: visitorDetails,
        });
      }

      case 'rejected':
        return res.json({
          status: 'rejected',
          message: 'Access denied. Visitor has been rejected.',
          visitor: visitorDetails,
        });

      default:
        return res.json({
          status: 'unknown',
          message: 'Visitor status unknown. Please contact admin.',
        });
    }
  } catch (err) {
    console.error('Error verifying QR token:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
