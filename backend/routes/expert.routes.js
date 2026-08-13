const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes require authentication and expert/admin role
router.use(authenticate, requireRole('expert', 'admin'));

/**
 * GET /queue
 * Get all open/in_progress incidents assigned to this expert or unassigned,
 * with AI classification data joined, ordered by severity.
 */
router.get('/queue', async (req, res) => {
  try {
    const expertId = req.user.id;

    const query = `
      SELECT i.id, i.title, i.incident_type, i.status, i.created_at,
             u.email AS user_email,
             (SELECT COUNT(*) FROM files f WHERE f.incident_id = i.id) AS file_count,
             ac.severity, ac.confidence
      FROM incidents i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN ai_classifications ac ON i.id = ac.incident_id
      WHERE (i.expert_id = ? OR i.expert_id IS NULL)
        AND i.status IN ('open', 'in_progress')
      ORDER BY 
        CASE ac.severity
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          WHEN 'LOW' THEN 4
          ELSE 5
        END ASC,
        i.created_at DESC
    `;

    const [incidents] = await pool.query(query, [expertId]);
    res.status(200).json({ success: true, queue: incidents });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ success: false, error: 'Internal server error while fetching queue' });
  }
});

/**
 * GET /:id
 * Get full incident detail
 */
router.get('/:id', async (req, res) => {
  try {
    const incidentId = req.params.id;

    // Get incident and user info
    const [incidents] = await pool.query(`
      SELECT i.*, u.email AS user_email, u.name AS user_name
      FROM incidents i
      JOIN users u ON i.user_id = u.id
      WHERE i.id = ?
    `, [incidentId]);
    
    const incident = incidents[0];
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    // Get files
    const [files] = await pool.query('SELECT id, original_name, stored_name, sha256_hash, file_size, created_at FROM files WHERE incident_id = ?', [incidentId]);

    // Get notes
    const [notes] = await pool.query(`
      SELECT en.id, en.note, en.created_at, u.name AS expert_name
      FROM expert_notes en
      JOIN users u ON en.expert_id = u.id
      WHERE en.incident_id = ?
      ORDER BY en.created_at ASC
    `, [incidentId]);

    // Get AI classifications
    const [ai_classifications] = await pool.query('SELECT severity, confidence, recommended_action, category FROM ai_classifications WHERE incident_id = ?', [incidentId]);

    res.status(200).json({
      success: true,
      incident: {
        ...incident,
        files,
        expert_notes: notes,
        ai_classifications: ai_classifications[0] || null
      }
    });
  } catch (error) {
    console.error('Get expert incident detail error:', error);
    res.status(500).json({ success: false, error: 'Internal server error while fetching incident detail' });
  }
});

/**
 * POST /:id/notes
 * Add expert note
 */
router.post('/:id/notes', async (req, res) => {
  try {
    const incidentId = req.params.id;
    const expertId = req.user.id;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ success: false, error: 'Note text is required' });
    }

    await pool.query(
      'INSERT INTO expert_notes (incident_id, expert_id, note) VALUES (?, ?, ?)',
      [incidentId, expertId, note]
    );

    res.status(201).json({ success: true, message: 'Note added successfully' });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ success: false, error: 'Internal server error while adding note' });
  }
});

/**
 * PATCH /:id/status
 * Update incident status to 'in_progress' or 'resolved'
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const incidentId = req.params.id;
    const { status } = req.body;

    if (!['in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status. Must be in_progress or resolved.' });
    }

    await pool.query('UPDATE incidents SET status = ? WHERE id = ?', [status, incidentId]);

    res.status(200).json({ success: true, message: 'Status updated to ' + status });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, error: 'Internal server error while updating status' });
  }
});

module.exports = router;
