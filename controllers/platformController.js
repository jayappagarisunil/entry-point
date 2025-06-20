const supabase = require('../services/supabaseClient');

exports.superAdminLogin = async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase
    .from('platform_admins')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .single();

  if (error || !data) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  return res.json({ message: 'Login successful' });
};
