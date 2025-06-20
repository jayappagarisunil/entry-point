const supabase = require('../services/supabaseClient');

// ✅ Get recent chat list (from stored procedure)
exports.getRecentChats = async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) return res.status(400).json({ error: 'User ID is required' });

  const { data, error } = await supabase.rpc('get_chat_list', { p_user_id: user_id });

  if (error) return res.status(500).json({ error });
  return res.status(200).json(data);
};

// ✅ Send a message
exports.sendMessage = async (req, res) => {
  const { sender_id, receiver_id, message } = req.body;

  if (!sender_id || !receiver_id || !message) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const { data, error } = await supabase
    .from('messages')
    .insert([{ sender_id, receiver_id, message }]);

  if (error) return res.status(500).json({ error });
  return res.status(200).json({ message: 'Message sent successfully', data });
};

// ✅ Get chat history between two users
exports.getMessages = async (req, res) => {
  const { user1, user2 } = req.query;

  if (!user1 || !user2) return res.status(400).json({ error: 'Missing user ids' });

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`)
    .order('sent_at', { ascending: true });

  if (error) return res.status(500).json({ error });
  return res.status(200).json(data);
};

// ✅ Mark messages from sender as seen
exports.markMessagesAsSeen = async (req, res) => {
  const { sender_id, receiver_id } = req.body;

  if (!sender_id || !receiver_id) return res.status(400).json({ error: 'Missing fields' });

  const { data, error } = await supabase
    .from('messages')
    .update({ seen: true })
    .match({ sender_id, receiver_id, seen: false });

  if (error) return res.status(500).json({ error });
  return res.status(200).json({ message: 'Messages marked as seen', data });
};

// ✅ Get all users (except logged-in user)
exports.getAllUsers = async (req, res) => {
  const { exclude_id } = req.query;

  if (!exclude_id) return res.status(400).json({ error: 'User ID to exclude is required' });

  const { data, error } = await supabase
    .from('users')
    .select('id, name, photo_path')
    .neq('id', exclude_id);

  if (error) return res.status(500).json({ error });
  return res.status(200).json(data);
};
