const supabase = require('../services/supabaseClient');

// Utility to format date to YYYY-MM-DD
const formatDate = (dateObj) => dateObj.toISOString().split('T')[0];

// Utility to get all dates between two
const getDateRange = (fromDate, toDate) => {
  const dates = [];
  const current = new Date(fromDate);
  const end = new Date(toDate);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

// 🔹 DAILY DETAILED REPORT
exports.getDailyDetailedReport = async (req, res) => {
  try {
    const { user_id, tenant_id, from_date, to_date } = req.query;

    if (!user_id || !tenant_id || !from_date || !to_date) {
      return res.status(400).json({ error: 'Missing required query params' });
    }

    const dates = getDateRange(from_date, to_date);
    const report = [];

    for (const date of dates) {
      const start = new Date(`${formatDate(date)}T00:00:00.000Z`);
      const end = new Date(`${formatDate(date)}T23:59:59.999Z`);

      const { data: visitors, error } = await supabase
        .from('visitors')
        .select(`
          id, name, invited_by, whom_to_meet, purpose, expected_visit_time, photo_url,
          users!visitors_invited_by_fkey(name)
        `)
        .eq('whom_to_meet', user_id)
        .eq('tenant_id', tenant_id)
        .gte('expected_visit_time', start.toISOString())
        .lte('expected_visit_time', end.toISOString())
        .order('expected_visit_time', { ascending: true });

      if (error) throw error;

      const dailyVisitors = [];

      for (const visitor of visitors) {
        const { data: logs, error: logErr } = await supabase
          .from('entry_logs')
          .select('entry_time, exit_time, direction, location')
          .eq('visitor_id', visitor.id)
          .order('entry_time', { ascending: true });

        if (logErr) throw logErr;

        const logDetails = logs.map(log => ({
          time: log.entry_time || log.exit_time,
          direction: log.direction,
          location: log.location,
        }));

        dailyVisitors.push({
          visitor_id: visitor.id,
          visitor_name: visitor.name,
          invited_by: visitor.users?.name || 'N/A',
          whom_to_meet: visitor.whom_to_meet,
          purpose: visitor.purpose,
          expected_visit_time: visitor.expected_visit_time,
          photo_url: visitor.photo_url,
          logs: logDetails.length > 0 ? logDetails : null,
        });
      }

      report.push({
        date: formatDate(date),
        visitors: dailyVisitors,
      });
    }

    res.json({
      report_type: 'detailed',
      from_date,
      to_date,
      days: report,
    });
  } catch (err) {
    console.error('Daily Detailed Report Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🔹 DAILY SUMMARY REPORT
exports.getDailySummaryReport = async (req, res) => {
  try {
    const { user_id, tenant_id, from_date, to_date } = req.query;

    if (!user_id || !tenant_id || !from_date || !to_date) {
      return res.status(400).json({ error: 'Missing required query params' });
    }

    const dates = getDateRange(from_date, to_date);
    const summary = [];

    for (const date of dates) {
      const start = new Date(`${formatDate(date)}T00:00:00.000Z`);
      const end = new Date(`${formatDate(date)}T23:59:59.999Z`);

      const { data: visitors, error: vErr } = await supabase
        .from('visitors')
        .select('id')
        .eq('whom_to_meet', user_id)
        .eq('tenant_id', tenant_id)
        .gte('expected_visit_time', start.toISOString())
        .lte('expected_visit_time', end.toISOString());

      if (vErr) throw vErr;

      let visited = 0;
      let entered = 0;
      let exited = 0;

      for (const visitor of visitors) {
        const { data: logs, error: logErr } = await supabase
          .from('entry_logs')
          .select('direction')
          .eq('visitor_id', visitor.id);

        if (logErr) throw logErr;

        if (logs.length > 0) visited++;

        for (const log of logs) {
          if (log.direction === 'in') entered++;
          if (log.direction === 'out') exited++;
        }
      }

      summary.push({
        date: formatDate(date),
        total_visitors: visitors.length,
        visited,
        not_visited: visitors.length - visited,
        entered,
        exited,
      });
    }

    res.json({
      report_type: 'summary',
      from_date,
      to_date,
      summary,
    });
  } catch (err) {
    console.error('Daily Summary Report Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMonthlyDetailedReport = async (req, res) => {
  const supabase = require('../services/supabaseClient');
  const formatDate = (d) => d.toISOString().split('T')[0];

  try {
    const { user_id, tenant_id, from_date, to_date } = req.query;
    if (!user_id || !tenant_id || !from_date || !to_date) {
      return res.status(400).json({ error: 'Missing required query params' });
    }

    const start = new Date(from_date);
    const end = new Date(to_date);
    const monthlyData = {};

    const { data: visitors, error } = await supabase
      .from('visitors')
      .select(`
        id, name, invited_by, whom_to_meet, purpose, expected_visit_time, status, photo_url,
        users!visitors_invited_by_fkey(name)
      `)
      .eq('whom_to_meet', user_id)
      .eq('tenant_id', tenant_id)
      .gte('expected_visit_time', start.toISOString())
      .lte('expected_visit_time', end.toISOString())
      .order('expected_visit_time', { ascending: true });

    if (error) throw error;

    for (const visitor of visitors) {
      const visitDate = new Date(visitor.expected_visit_time);
      const monthKey = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}`;
      const dayKey = formatDate(visitDate);

      const { data: logs } = await supabase
        .from('entry_logs')
        .select('entry_time, exit_time, direction, location')
        .eq('visitor_id', visitor.id)
        .order('entry_time', { ascending: true });

      const logDetails = logs?.map(log => ({
        time: log.entry_time || log.exit_time,
        direction: log.direction,
        location: log.location,
      })) || [];

      const entry = {
        visitor_id: visitor.id,
        visitor_name: visitor.name,
        invited_by: visitor.users?.name || 'N/A',
        whom_to_meet: visitor.whom_to_meet,
        purpose: visitor.purpose,
        expected_visit_time: visitor.expected_visit_time,
        photo_url: visitor.photo_url,
        status: visitor.status || 'pending',
        logs: logDetails.length ? logDetails : null,
      };

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, days: {} };
      }

      if (!monthlyData[monthKey].days[dayKey]) {
        monthlyData[monthKey].days[dayKey] = [];
      }

      monthlyData[monthKey].days[dayKey].push(entry);
    }

    res.json({
      report_type: 'monthly_detailed',
      from_date,
      to_date,
      months: Object.values(monthlyData),
    });
  } catch (err) {
    console.error('Monthly Detailed Report Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMonthlySummaryReport = async (req, res) => {
  const supabase = require('../services/supabaseClient');
  try {
    const { user_id, tenant_id, from_date, to_date } = req.query;
    if (!user_id || !tenant_id || !from_date || !to_date) {
      return res.status(400).json({ error: 'Missing required query params' });
    }

    const start = new Date(from_date);
    const end = new Date(to_date);

    const { data: visitors, error } = await supabase
      .from('visitors')
      .select('id, expected_visit_time')
      .eq('whom_to_meet', user_id)
      .eq('tenant_id', tenant_id)
      .gte('expected_visit_time', start.toISOString())
      .lte('expected_visit_time', end.toISOString())
      .order('expected_visit_time', { ascending: true });

    if (error) throw error;

    const monthlySummary = {};

    for (const visitor of visitors) {
      const visitDate = new Date(visitor.expected_visit_time);
      const monthKey = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlySummary[monthKey]) {
        monthlySummary[monthKey] = {
          month: monthKey,
          total_visitors: 0,
          visited: 0,
          not_visited: 0,
          entered: 0,
          exited: 0,
        };
      }

      monthlySummary[monthKey].total_visitors += 1;

      const { data: logs } = await supabase
        .from('entry_logs')
        .select('direction')
        .eq('visitor_id', visitor.id);

      if (logs && logs.length > 0) {
        monthlySummary[monthKey].visited += 1;
        for (const log of logs) {
          if (log.direction === 'in') monthlySummary[monthKey].entered += 1;
          if (log.direction === 'out') monthlySummary[monthKey].exited += 1;
        }
      } else {
        monthlySummary[monthKey].not_visited += 1;
      }
    }

    res.json({
      report_type: 'monthly_summary',
      from_date,
      to_date,
      months: Object.values(monthlySummary),
    });
  } catch (err) {
    console.error('Monthly Summary Report Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
