// const supabase = require('../services/supabaseClient');

// const approvedMessages = [
//   'Welcome! Please proceed.',
//   'Access granted. Have a great visit!',
//   'You are approved. Enjoy your time!',
//   'Entry allowed. Thank you for visiting.',
// ];

// exports.verifyQRToken = async (req, res) => {
//   const { qr_token, security_id, entry_gate } = req.body;

//   if (!qr_token || qr_token.trim() === '') {
//     return res.status(400).json({ error: 'QR token is required' });
//   }

//   try {
//     // Fetch visitor by invite_token
//     const { data: visitor, error: visitorError } = await supabase
//       .from('visitors')
//       .select('*')
//       .eq('invite_token', qr_token)
//       .single();

//     if (visitorError || !visitor) {
//       return res.status(200).json({
//         status: 'not_found',
//         message: 'Visitor not found. Please contact admin.',
//       });
//     }

//     // Fetch whom_to_meet name from users table
//     let whomToMeetName = 'the concerned person';
//     if (visitor.whom_to_meet) {
//       const { data: user, error: userError } = await supabase
//         .from('users')
//         .select('name')
//         .eq('id', visitor.whom_to_meet)
//         .single();

//       if (!userError && user) {
//         whomToMeetName = user.name;
//       }
//     }

//     const visitorDetails = {
//       name: visitor.name,
//       purpose: visitor.purpose,
//       whom_to_meet: whomToMeetName,
//     };

//     // ✅ Check for expiration window
//     if (visitor.expected_visit_time) {
//       const now = new Date();
//       const expectedTime = new Date(visitor.expected_visit_time);
//       const grace = typeof visitor.grace_time === 'number' ? visitor.grace_time : 30;

//       const startTime = new Date(expectedTime.getTime() - grace * 60000);
//       const endTime = new Date(expectedTime.getTime() + grace * 60000);

//       if (now < startTime || now > endTime) {
//         return res.status(200).json({
//           status: 'expired',
//           message: 'QR Code has expired. Please request a new one.',
//           visitor: visitorDetails,
//         });
//       }
//     }

//     switch (visitor.status) {
//       case 'pending':
//         return res.json({
//           status: 'pending',
//           message: `Approval pending. Please wait for approval from ${whomToMeetName}.`,
//           visitor: visitorDetails,
//         });

//       case 'approved': {
//         // Fetch last log by entry_time to determine direction and check interval
//         const { data: lastLog, error: lastLogError } = await supabase
//           .from('entry_logs')
//           .select('entry_time, direction')
//           .eq('visitor_id', visitor.id)
//           .order('entry_time', { ascending: false })
//           .limit(1)
//           .maybeSingle();

//         if (lastLogError) {
//           console.error('Error fetching last log:', lastLogError);
//         }

//         const now = new Date();
//         let newDirection = 'in'; // default direction

//         if (lastLog && lastLog.entry_time) {
//           const lastTime = new Date(lastLog.entry_time);
//           const timeDiff = (now - lastTime) / 1000; // in seconds

//           if (timeDiff < 60) {
//             return res.status(200).json({
//               status: 'duplicate',
//               message: 'Please wait at least 1 minute before scanning again.',
//               visitor: visitorDetails,
//             });
//           }

//           newDirection = lastLog.direction === 'in' ? 'out' : 'in';
//         }

//         // Insert new log with direction and photo_url
//         const { error: logError } = await supabase
//           .from('entry_logs')
//           .insert([{
//             visitor_id: visitor.id,
//             security_id: security_id || null,
//             entry_gate: entry_gate || null,
//             location: visitor.location || null,
//             direction: newDirection,
//             photo_url: visitor.photo_url || null,
//             remarks: `Entry ${newDirection} by security scan`,
//           }]);

//         if (logError) {
//           console.error('Entry log insertion error:', logError);
//           return res.status(500).json({
//             status: 'approved',
//             message: 'Entry allowed, but failed to log entry. Please notify admin.',
//             visitor: visitorDetails,
//           });
//         }

//         const randomMessage = approvedMessages[Math.floor(Math.random() * approvedMessages.length)];

//         return res.json({
//           status: 'approved',
//           message: randomMessage,
//           direction: newDirection,
//           visitor: visitorDetails,
//         });
//       }

//       case 'rejected':
//         return res.json({
//           status: 'rejected',
//           message: 'Access denied. Visitor has been rejected.',
//           visitor: visitorDetails,
//         });

//       default:
//         return res.json({
//           status: 'unknown',
//           message: 'Visitor status unknown. Please contact admin.',
//         });
//     }
//   } catch (err) {
//     console.error('Error verifying QR token:', err);
//     return res.status(500).json({ error: 'Server error' });
//   }
// };



const supabase = require('../services/supabaseClient');
const { sendPushNotificationWithActions } = require('../services/pushService');

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
    const { data: visitor, error: visitorError } = await supabase
      .from('visitors')
      .select('*')
      .eq('invite_token', qr_token)
      .single();

    if (visitorError || !visitor) {
      return res.status(200).json({
        status: 'not_found',
        message: 'Visitor not found. Please contact admin.',
      });
    }

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

    // Check for expiration
    if (visitor.expected_visit_time) {
      const now = new Date();
      const expectedTime = new Date(visitor.expected_visit_time);
      const grace = typeof visitor.grace_time === 'number' ? visitor.grace_time : 30;

      const startTime = new Date(expectedTime.getTime() - grace * 60000);
      const endTime = new Date(expectedTime.getTime() + grace * 60000);

      if (now < startTime || now > endTime) {
        return res.status(200).json({
          status: 'expired',
          message: 'QR Code has expired. Please request a new one.',
          visitor: visitorDetails,
        });
      }
    }

    switch (visitor.status) {
      case 'pending': {
        // Update requested_by
        if (security_id) {
          await supabase
            .from('visitors')
            .update({ requested_by: security_id })
            .eq('id', visitor.id);
        }

        // Send notification to whom_to_meet
        if (visitor.whom_to_meet) {
          try {
            await sendPushNotificationWithActions({
              receiverId: visitor.whom_to_meet,
              title: 'Visitor Approval Needed',
              body: `${visitor.name} is waiting at the gate. Please approve.`,
              action_type: 'visitor_approval',
              data: {
                visitor_id: visitor.id,
                invite_token: visitor.invite_token,
                photo_url: visitor.photo_url,
                status: 'pending',
              },
            });
          } catch (err) {
            console.error('Push notification failed:', err);
          }
        }

        return res.json({
          status: 'pending',
          message: `Approval pending. Please wait for approval from ${whomToMeetName}.`,
          visitor: visitorDetails,
        });
      }

      case 'approved': {
        const { data: lastLog, error: lastLogError } = await supabase
          .from('entry_logs')
          .select('entry_time, direction')
          .eq('visitor_id', visitor.id)
          .order('entry_time', { ascending: false })
          .limit(1)
          .maybeSingle();

        const now = new Date();
        let newDirection = 'in';

        if (lastLog && lastLog.entry_time) {
          const lastTime = new Date(lastLog.entry_time);
          const timeDiff = (now - lastTime) / 1000;
          if (timeDiff < 60) {
            return res.status(200).json({
              status: 'duplicate',
              message: 'Please wait at least 1 minute before scanning again.',
              visitor: visitorDetails,
            });
          }

          newDirection = lastLog.direction === 'in' ? 'out' : 'in';
        }

        const { error: logError } = await supabase
          .from('entry_logs')
          .insert([{
            visitor_id: visitor.id,
            security_id: security_id || null,
            entry_gate: entry_gate || null,
            location: visitor.location || null,
            direction: newDirection,
            photo_url: visitor.photo_url || null,
            remarks: `Entry ${newDirection} by security scan`,
          }]);

        if (logError) {
          console.error('Entry log insertion error:', logError);
          return res.status(500).json({
            status: 'approved',
            message: 'Entry allowed, but failed to log entry. Please notify admin.',
            visitor: visitorDetails,
          });
        }

        // Send notification that visitor has entered
        if (visitor.whom_to_meet) {
          try {
            await sendPushNotificationWithActions({
              receiverId: visitor.whom_to_meet,
              title: 'Visitor Entered',
              body: `${visitor.name} has entered through ${entry_gate || 'the gate'}.`,
              action_type: 'entry_log',
              data: {
                visitor_id: visitor.id,
                direction: newDirection,
              },
            });
          } catch (err) {
            console.error('Push notification on entry failed:', err);
          }
        }

        const randomMessage = approvedMessages[Math.floor(Math.random() * approvedMessages.length)];

        return res.json({
          status: 'approved',
          message: randomMessage,
          direction: newDirection,
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
