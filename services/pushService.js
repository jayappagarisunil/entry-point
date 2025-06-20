const { createClient } = require('@supabase/supabase-js');
const { Expo } = require('expo-server-sdk');

// Supabase setup
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Expo setup
const expo = new Expo();

/**
 * Send and store a push notification centrally
 * @param {Object} params
 * @param {string} params.receiverId - Auth user ID
 * @param {string} params.title
 * @param {string} params.body
 * @param {string} [params.image_url]
 * @param {string} [params.action_type] - 'approve', 'decline', etc.
 * @param {Object} [params.data] - Any custom JSON (for notification payload)
 * @returns {Promise<void>}
 */
async function sendPushNotificationWithActions({ receiverId, title, body, image_url = null, action_type = null, data = {} }) {
  // 1. Get push token
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('push_token')
    .eq('id', receiverId)
    .single();

  if (userError || !user?.push_token) {
    console.warn('No push token found for user:', receiverId);
  }

  // 2. Store alert in DB
  const { error: insertError } = await supabase.from('alerts').insert([{
    receiver_id: receiverId,
    title,
    message: body, // alerts table uses 'message' column
    image_url,
    action_type,
    metadata: data,
  }]);

  if (insertError) {
    console.error('Error saving alert:', insertError.message);
    return;
  }

  // 3. Send Expo push if token is valid
  if (user?.push_token && Expo.isExpoPushToken(user.push_token)) {
    const notification = {
      to: user.push_token,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      const chunks = expo.chunkPushNotifications([notification]);
      for (const chunk of chunks) {
        await expo.sendPushNotificationsAsync(chunk);
      }
    } catch (err) {
      console.error('Push notification error:', err);
    }
  }
}

module.exports = { sendPushNotificationWithActions };
