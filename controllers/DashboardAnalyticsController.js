const supabase = require('../services/supabaseClient');

// Fetch today's summary (total, upcoming, completed)
exports.getSummary = async (req, res) => {
  try {
    const whomToMeet = req.query.whom_to_meet;
    if (!whomToMeet) return res.status(400).json({ error: 'whom_to_meet is required' });

    const now = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('visitors')
      .select('id, expected_visit_time')
      .eq('whom_to_meet', whomToMeet)
      .gte('expected_visit_time', startOfDay.toISOString())
      .lte('expected_visit_time', endOfDay.toISOString());

    if (error) throw error;

    const total = data.length;
    const currentTime = Date.now();
    const upcoming = data.filter(v => new Date(v.expected_visit_time).getTime() > currentTime).length;
    const completed = total - upcoming;

    return res.json({ total, upcoming, completed });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Fetch top 3 upcoming visitors today
exports.getUpcomingVisitors = async (req, res) => {
  try {
    const whomToMeet = req.query.whom_to_meet;
    if (!whomToMeet) return res.status(400).json({ error: 'whom_to_meet is required' });

    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('visitors')
      .select('name, photo_url, expected_visit_time, purpose')
      .eq('whom_to_meet', whomToMeet)
      .gte('expected_visit_time', now.toISOString())
      .lte('expected_visit_time', endOfDay.toISOString())
      .order('expected_visit_time', { ascending: true })
      .limit(3);

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    console.error('Upcoming visitors error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Fetch monthly visitors count (grouped by month)
exports.getMonthlyVisitors = async (req, res) => {
  try {
    const whomToMeet = req.query.whom_to_meet;
    if (!whomToMeet) return res.status(400).json({ error: 'whom_to_meet is required' });

    const { data, error } = await supabase.rpc('get_monthly_visitors_by_employee', {
      whom_to_meet_input: whomToMeet
    });

    if (error) throw error;

    return res.json(data); // [{ month: 'Jan', count: 5 }, ...]
  } catch (err) {
    console.error('Monthly visitors error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


// Fetch entered and exited visitors for today
exports.getTodayEntryStats = async (req, res) => {
  try {
    const { security_id } = req.query;
    if (!security_id) return res.status(400).json({ error: 'security_id is required' });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('entry_logs')
      .select('direction')
      .eq('security_id', security_id)
      .gte('entry_time', startOfDay.toISOString())
      .lte('entry_time', endOfDay.toISOString());

    if (error) throw error;

    const entered = data.filter(d => d.direction === 'in').length;
    const exited = data.filter(d => d.direction === 'out').length;

    return res.json({ entered, exited });
  } catch (err) {
    console.error('Today entry stats error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Fetch recent entries by security
exports.getRecentEntries = async (req, res) => {
  try {
    const { security_id } = req.query;
    if (!security_id) return res.status(400).json({ error: 'security_id is required' });

    const { data, error } = await supabase
      .from('entry_logs')
      .select('visitor_id, entry_time, entry_gate, direction, photo_url')
      .eq('security_id', security_id)
      .order('entry_time', { ascending: false })
      .limit(5);

    if (error) throw error;

    // Join with visitor data
    const enriched = await Promise.all(
      data.map(async log => {
        const { data: visitor } = await supabase
          .from('visitors')
          .select('name')
          .eq('id', log.visitor_id)
          .single();

        return {
          name: visitor?.name || 'Unknown',
          photo_url: log.photo_url,
          entry_time: log.entry_time,
          entry_gate: log.entry_gate,
          direction: log.direction,
        };
      })
    );

    return res.json(enriched);
  } catch (err) {
    console.error('Recent entries error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Fetch monthly graph by security
exports.getMonthlyBySecurity = async (req, res) => {
  try {
    const { security_id } = req.query;
    if (!security_id) return res.status(400).json({ error: 'security_id is required' });

    const { data, error } = await supabase.rpc('get_monthly_visitors_by_security', {
      security_id_input: security_id
    });

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    console.error('Monthly visitors by security error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
