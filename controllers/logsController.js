const supabase = require('../services/supabaseClient');

// 1. Logs filtered by security guard (as before)
exports.getLogsBySecurityId = async (req, res) => {
  const securityId = req.query.security_id || req.headers['x-user-id'];
  if (!securityId) return res.status(400).json({ error: 'Missing security_id' });
  try {
    const { data, error } = await supabase
      .from('entry_logs')
      .select(`
        id,
        entry_time,
        entry_gate,
        location,
        remarks,
        visitors (
          name,
          purpose,
          whom_to_meet,
          invited_by
        ),
        users (
          name
        )
      `)
      .eq('security_id', securityId)
      .order('entry_time', { ascending: false });

    if (error) throw error;

    const enriched = await enrichLogsWithWhomToMeetName(data);
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

// 2. Logs filtered by creator (invited_by = userId)
exports.getLogsByCreator = async (req, res) => {
  const userId = req.query.user_id || req.headers['x-user-id'];
  if (!userId) return res.status(400).json({ error: 'Missing user_id' });
  try {
    const { data, error } = await supabase
      .from('entry_logs')
      .select(`
        id,
        entry_time,
        entry_gate,
        location,
        remarks,
        visitors (
          name,
          purpose,
          whom_to_meet,
          invited_by
        ),
        users (
          name
        )
      `)
      .eq('visitors.invited_by', userId)
      .order('entry_time', { ascending: false });

    if (error) throw error;

    const enriched = await enrichLogsWithWhomToMeetName(data);
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};

// 3. Logs filtered by "whom_to_meet" = userId
exports.getLogsByWhomToMeet = async (req, res) => {
  const userId = req.query.user_id || req.headers['x-user-id'];
  if (!userId) return res.status(400).json({ error: 'Missing user_id' });
  try {
    const { data, error } = await supabase
      .from('entry_logs')
      .select(`
        id,
        entry_time,
        entry_gate,
        location,
        remarks,
        visitors (
          name,
          purpose,
          whom_to_meet,
          invited_by
        ),
        users (
          name
        )
      `)
      .eq('visitors.whom_to_meet', userId)
      .order('entry_time', { ascending: false });

    if (error) throw error;

    const enriched = await enrichLogsWithWhomToMeetName(data);
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};


// Helper to enrich whom_to_meet names
async function enrichLogsWithWhomToMeetName(logs) {
  return Promise.all(
    logs.map(async (log) => {
      let whomToMeetName = log.visitors?.whom_to_meet;
      if (whomToMeetName) {
        const { data: emp } = await supabase
          .from('users')
          .select('name')
          .eq('id', whomToMeetName)
          .single();
        whomToMeetName = emp?.name || whomToMeetName;
      }
      return {
        id: log.id,
        entry_time: log.entry_time,
        gate: log.entry_gate,
        location: log.location,
        visitor_name: log.visitors?.name,
        purpose: log.visitors?.purpose,
        whom_to_meet: whomToMeetName,
        invited_by: log.visitors?.invited_by,
        security_person: log.users?.name,
        remarks: log.remarks,
      };
    })
  );
}
