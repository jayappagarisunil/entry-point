const supabase = require('../services/supabaseClient');

// Fetch user profile
exports.getUserProfile = async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ error: 'User ID is required' });

  const { data, error } = await supabase
    .from('users')
    .select('id, name, role, phone, department, location, floor_no, photo_path')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Fetch profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }

  return res.json(data);
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  const { id } = req.params;
  const { phone } = req.body;
  const photoFile = req.file;

  if (!id) return res.status(400).json({ error: 'User ID is required' });

  let photoPath;
  let publicUrl;

  if (photoFile) {
    const fileName = `${id}_${Date.now()}.jpg`;
    const { data, error: uploadError } = await supabase.storage
      .from('user-photo')
      .upload(fileName, photoFile.buffer, {
        contentType: photoFile.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error('Photo upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload photo' });
    }

    photoPath = data.path;
    publicUrl = supabase.storage.from('user-photo').getPublicUrl(photoPath).data.publicUrl;
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({
      phone,
      ...(publicUrl && { photo_path: publicUrl }),
    })
    .eq('id', id);

  if (updateError) {
    console.error('Update profile error:', updateError);
    return res.status(500).json({ error: 'Failed to update profile' });
  }

  return res.json({ success: true, photo_path: publicUrl });
};
