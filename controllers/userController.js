const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create new employee
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
    push_token,
    tenant_id
  } = req.body;

  try {
    const { data: authUser, error: signupError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (signupError) return res.status(400).json({ error: signupError.message });

    const userId = authUser.user.id;

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
        push_token,
        tenant_id,
        email
      }]);

    if (insertError) return res.status(400).json({ error: insertError.message });

    return res.status(201).json({ message: 'User registered successfully', userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update employee details
exports.updateEmployee = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    role,
    phone,
    email,
    department,
    location,
    floor_no,
    photo_path,
    push_token
  } = req.body;

  try {
    const { error } = await supabase
      .from('users')
      .update({
        name,
        role,
        phone,
        email,
        department,
        location,
        floor_no,
        photo_path,
        push_token
      })
      .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ message: 'Employee updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;

  try {
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) return res.status(400).json({ error: deleteError.message });

    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(id);
    if (authDeleteError) return res.status(400).json({ error: authDeleteError.message });

    return res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all employees for a tenant
exports.getEmployeesByTenant = async (req, res) => {
  const { tenant_id } = req.query;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('name', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ employees: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single employee by ID
exports.getEmployeeById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return res.status(404).json({ error: 'Employee not found' });

    return res.status(200).json({ employee: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Send password reset email
exports.sendPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const { data, error } = await supabase.auth.admin.resetPasswordForEmail(email, {
      redirectTo: 'https://entrypointvm.com/reset_password' // replace with your frontend
    });

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ message: 'Reset link sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
