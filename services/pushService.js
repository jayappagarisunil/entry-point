const { createClient } = require('@supabase/supabase-js');
const { Expo } = require('expo-server-sdk');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const expo = new Expo();

async function sendPushNotificationWithActions({ receiverId, title, body, image_url = null, action_type = null, data = {} }) {
  // Step 1: Get user push token
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('push_token')
    .eq('id', receiverId)
    .single();

  if (userError || !user?.push_token) {
    console.warn('❌ No push token found for user:', receiverId);
    return;
  }

  // Step 2: Store alert in alerts table
  const { error: insertError } = await supabase.from('alerts').insert([{
    receiver_id: receiverId,
    title,
    message: body,
    image_url,
    action_type,
    metadata: data,
  }]);

  if (insertError) {
    console.error('❌ Error saving alert:', insertError.message);
    return;
  }

  // Step 3: Send the push notification
  if (Expo.isExpoPushToken(user.push_token)) {
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
        const receipt = await expo.sendPushNotificationsAsync(chunk);
        console.log('✅ Expo push response:', receipt);
      }
    } catch (err) {
      console.error('❌ Push notification error:', err);
    }
  } else {
    console.warn('❌ Invalid Expo push token:', user.push_token);
  }
}

module.exports = {
  sendPushNotificationWithActions,
};
