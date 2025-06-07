const supabase = require('../services/supabaseClient');

const getEmployees = async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name')
    .eq('role', 'authorized_person');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
};

module.exports = { getEmployees };


