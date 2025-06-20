const supabase = require('../services/supabaseClient');


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

  const { error } = await supabase
    .from('visitors')
    .update({ status: decision })
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ message: `Alert marked as ${decision}` });
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

