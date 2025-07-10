// controllers/chatController.js

const supabase = require('../services/supabaseClient');

exports.getChatList = async (req, res) => {
  const { user_id, tenant_id } = req.params;

  try {
    const { data, error } = await supabase.rpc('get_chat_list', {
      p_user_id: user_id,
      p_tenant_id: tenant_id
    });

    if (error) {
      console.error('Supabase RPC Error:', error);
      return res.status(500).json({ error: 'Failed to fetch chat list.' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

exports.getChatHistory = async (req, res) => {
  const { userId, otherUserId, tenantId } = req.params;

  try {
    // Step 1: Fetch messages between the two users
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .eq('tenant_id', tenantId)
      .order('sent_at', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      return res.status(500).json({ error: 'Error fetching chat history' });
    }

    // Step 2: Extract unique sender_ids
    const senderIds = [...new Set(messages.map((msg) => msg.sender_id))];

    // Step 3: Fetch user details for those senders
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, photo_path')
      .in('id', senderIds);

    if (userError) {
      console.error('Error fetching user info:', userError);
      return res.status(500).json({ error: 'Error fetching user info' });
    }

    const userMap = {};
    users.forEach((u) => {
      userMap[u.id] = u;
    });

    // Step 4: Enrich messages with sender info
    const enrichedMessages = messages.map((msg) => ({
      id: msg.id,
      message: msg.message,
      sent_at: msg.sent_at,
      seen: msg.seen,
      is_sender: msg.sender_id === userId,
      sender: userMap[msg.sender_id] || null,
    }));

    // Step 5: Fetch other user details directly
    const { data: otherUserData, error: otherUserError } = await supabase
      .from('users')
      .select('id, name, photo_path')
      .eq('id', otherUserId)
      .single();

    if (otherUserError) {
      console.error('Error fetching other user:', otherUserError);
      return res.status(500).json({ error: 'Error fetching other user' });
    }

    return res.status(200).json({
      messages: enrichedMessages,
      other_user: otherUserData,
    });

  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


const { sendPushNotificationWithActions } = require('../services/pushService');

exports.sendMessage = async (req, res) => {
  const { sender_id, receiver_id, tenant_id, message } = req.body;

  if (!sender_id || !receiver_id || !tenant_id || !message) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    // 1. Insert the message into the messages table
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id,
          receiver_id,
          tenant_id,
          message,
          seen: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting message:', error);
      return res.status(500).json({ error: 'Failed to send message.' });
    }

    // 2. Fetch sender name (optional, but nice for notification title)
    const { data: senderData, error: senderError } = await supabase
      .from('users')
      .select('name')
      .eq('id', sender_id)
      .single();

    const senderName = senderData?.name || 'Someone';

    // 3. Send push notification using existing service
    await sendPushNotificationWithActions({
      receiverId: receiver_id,
      title: `New message from ${senderName}`,
      body: message,
      action_type: 'chat_message',
      data: {
        from_user_id: sender_id,
        tenant_id,
        message_id: data.id,
      },
    });

    return res.status(200).json({ success: true, message: data });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
