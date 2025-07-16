const supabase = require('../services/supabaseClient');
const pushService = require('../services/pushService');

// Fetch all alerts for a user
exports.getAlertsByUser = async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
};

// Fetch only unread alerts
exports.getUnreadAlertsByUser = async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('receiver_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
};

// Create a new alert
exports.createAlert = async (req, res) => {
  const { title, message, image_url, action_type, metadata, receiver_id, status } = req.body;

  const { data, error } = await supabase
    .from('alerts')
    .insert([
      {
        title,
        message,
        image_url,
        action_type,
        metadata,
        receiver_id,
        status: status || 'sent',
        is_read: false,
      },
    ])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
};

// Update alert status (optional if needed)
exports.updateAlertStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const { data, error } = await supabase
    .from('alerts')
    .update({ status })
    .eq('id', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data[0]);
};

// Mark alert as read
exports.markAlertAsRead = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('alerts')
    .update({ is_read: true })
    .eq('id', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data[0]);
};

// Get only pending visitor approvals
exports.getPendingApprovals = async (req, res) => {
  const { userId } = req.params;

  const { data, error } = await supabase
    .from('visitors')
    .select('id, name, phone, purpose, expected_visit_time, status, photo_url, created_at')
    .eq('whom_to_meet', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
};



exports.updateApprovalDecision = async (req, res) => {
  const { id } = req.params;
  const { decision } = req.body;

  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision' });
  }

  // 1. Update visitor status and return full updated record
  const { data: updated, error } = await supabase
    .from('visitors')
    .update({ status: decision })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const { requested_by, name, photo_url, location, tenant_id } = updated;
  const title = `Visitor ${decision === 'approved' ? 'Approved' : 'Rejected'}`;
  const body = `Your request for ${name} has been ${decision}.`;

  // 2. Send push notification to requesting security
  try {
    await pushService.sendPushNotificationWithActions({
      receiverId: requested_by,
      title,
      body,
      action_type: 'approval_status',
      data: { 
        visitor_id: id, 
        status: decision,
        navigateTo: "SecurityAlerts",
        tab: "approvals"
      },
    });
  } catch (err) {
    console.error('Push notification error:', err);
  }

  // 3. If approved, insert into entry_logs table
  if (decision === 'approved') {
    try {
      await supabase.from('entry_logs').insert([{
        visitor_id: id,
        security_id: requested_by,
        entry_gate: 'Main Gate', // default or dynamic if known
        direction: 'in',
        remarks: 'Auto log after approval',
        photo_url: photo_url || null,
        location: location || null,
        tenant_id: tenant_id || null,
      }]);
    } catch (logError) {
      console.error('Failed to insert entry log after approval:', logError);
      // Optional: you may still respond 200 even if log fails
    }
  }

  return res.status(200).json({ message: `Visitor ${decision}` });
};



exports.getRequestStatus = async (req, res) => {
  const { security_id } = req.params;

  if (!security_id || security_id === 'undefined') {
    return res.status(400).json({ error: 'Missing or invalid security_id' });
  }

  const { data, error } = await supabase
    .from('visitors')
    .select('id, name, whom_to_meet, status, created_at')
    .eq('requested_by', security_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error in getRequestStatus:', error.message);
    return res.status(500).json({ error: 'Server error' });
  }

  res.status(200).json(data);
};

