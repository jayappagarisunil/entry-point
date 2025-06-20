const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); // Use service role key

exports.registerUser = async (req, res) => {
  const {
    email,
    password,
    name,
    role,
    phone,
    department,
    location,
    floor_no,
    photo_path,
    push_token
  } = req.body;

  try {
    // Step 1: Create user in auth
    const { data: authUser, error: signupError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (signupError) return res.status(400).json({ error: signupError.message });

    const userId = authUser.user.id;

    // Step 2: Insert into users table
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        name,
        role,
        phone,
        department,
        location,
        floor_no,
        photo_path,
        push_token
      }]);

    if (insertError) return res.status(400).json({ error: insertError.message });

    return res.status(201).json({ message: 'User registered successfully', userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
