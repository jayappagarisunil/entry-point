// controllers/tenantController.js
const supabase = require('../services/supabaseClient');

exports.createTenantWithAdmin = async (req, res) => {
  try {
    const {
      organization_name,
      email,
      phone,
      address,
      logo_url,
      admin_name,
      admin_email,
      admin_password,
      admin_phone,
      gender,
      DOB
    } = req.body;

    // Step 1: Create tenant
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .insert([{
        name: organization_name,
        email,
        phone,
        address,
        logo_url,
        subscription_plan: 'free',
        is_active: true
      }])
      .select()
      .single();

    if (tenantError) {
      console.error('Tenant creation error:', tenantError);
      return res.status(400).json({ error: 'Failed to create tenant', details: tenantError.message });
    }

    const tenant_id = tenantData.id;

    // Step 2: Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true
    });

    if (authError) {
      console.error('Supabase Auth error:', authError);
      return res.status(400).json({ error: 'Failed to create admin user in auth', details: authError.message });
    }

    const user_id = authData.user.id;

    // Step 3: Insert into users table
    const { error: userInsertError } = await supabase
      .from('users')
      .insert([{
        id: user_id,
        name: admin_name,
        email: admin_email,
        phone: admin_phone,
        role: 'admin',
        gender,
        DOB,
        tenant_id: tenant_id
      }]);

    if (userInsertError) {
      console.error('User DB insert error:', userInsertError);
      return res.status(400).json({ error: 'Failed to create admin user record', details: userInsertError.message });
    }

    return res.status(201).json({
      message: 'Tenant and admin user created successfully',
      tenant_id,
      admin_user_id: user_id
    });

  } catch (err) {
    console.error('Unhandled error in createTenantWithAdmin:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// 🟢 GET /api/platform/tenants
exports.getAllTenants = async (req, res) => {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch tenants', details: error.message });
  }

  return res.json({ tenants: data });
};

// 🟢 POST /api/platform/tenant/:id/activate
exports.activateTenant = async (req, res) => {
  const tenantId = req.params.id;

  const { error } = await supabase
    .from('tenants')
    .update({ is_active: true })
    .eq('id', tenantId);

  if (error) {
    return res.status(500).json({ error: 'Failed to activate tenant', details: error.message });
  }

  return res.json({ message: 'Tenant activated successfully' });
};

// 🔴 POST /api/platform/tenant/:id/deactivate
exports.deactivateTenant = async (req, res) => {
  const tenantId = req.params.id;

  const { error } = await supabase
    .from('tenants')
    .update({ is_active: false })
    .eq('id', tenantId);

  if (error) {
    return res.status(500).json({ error: 'Failed to deactivate tenant', details: error.message });
  }

  return res.json({ message: 'Tenant deactivated successfully' });
};
