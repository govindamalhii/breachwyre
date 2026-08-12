const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');
const { hashFileStream } = require('../utils/cryptoHasher');
// In a real app, this might be imported from ai.routes.js or a separate AI service
const { classifyIncident } = require('./ai.routes'); 

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // SECURITY: Rename file to UUID to prevent path traversal and overwriting
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'text/x-log', 'application/vnd.tcpdump.pcap', 'application/zip'];
const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.txt', '.log', '.pcap', '.zip'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  // SECURITY: Validate file type by extension (for simplicity here, though mime type check is better)
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${ext}`), false);
  }
};

// Max 50MB
const upload = multer({ 
  storage, 
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter 
});

/**
 * POST /
 * Create a new incident
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, incident_type } = req.body;
    const userId = req.user.id;

    if (!title || !description || !incident_type) {
      return res.status(400).json({ success: false, error: 'Title, description, and incident_type are required' });
    }

    // Insert incident
    const [result] = await pool.query(
      'INSERT INTO incidents (user_id, title, description, incident_type, status) VALUES (?, ?, ?, ?, ?)',
      [userId, title, description, incident_type, 'open']
    );
    const incidentId = result.insertId;

    // Optional: auto-classify if classifyIncident is available
    if (typeof classifyIncident === 'function') {
      try {
        const aiResult = classifyIncident(title, description, incident_type);
        await pool.query(
          'INSERT INTO ai_classifications (incident_id, severity, confidence, recommended_action, category) VALUES (?, ?, ?, ?, ?)',
          [incidentId, aiResult.severity, aiResult.confidence, aiResult.recommended_action, aiResult.category]
        );
      } catch (err) {
        console.error('AI classification failed during incident creation:', err);
      }
    }

    res.status(201).json({ success: true, incident_id: incidentId });
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ success: false, error: 'Internal server error while creating incident' });
  }
});

/**
 * POST /:id/files
 * Upload evidence files (up to 5)
 */
router.post('/:id/files', authenticate, upload.array('files', 5), async (req, res) => {
  try {
    const incidentId = req.params.id;
    const userId = req.user.id;

    // Verify incident exists and belongs to user (or user is expert/admin)
    const [incident] = await pool.query('SELECT user_id FROM incidents WHERE id = ?', [incidentId]);
    if (incident.length === 0) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }
    
    if (incident[0].user_id !== userId && req.user.role === 'user') {
      return res.status(403).json({ success: false, error: 'Unauthorized to upload files to this incident' });
    }

    const uploadedFiles = req.files || [];
    if (uploadedFiles.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid files uploaded' });
    }

    const filesMetadata = [];

    for (const file of uploadedFiles) {
      // Compute SHA-256
      const sha256Hash = await hashFileStream(file.path);

      // Insert file record
      const [insertResult] = await pool.query(
        'INSERT INTO files (incident_id, original_name, stored_name, sha256_hash, file_size) VALUES (?, ?, ?, ?, ?)',
        [incidentId, file.originalname, file.filename, sha256Hash, file.size]
      );

      filesMetadata.push({
        id: insertResult.insertId,
        original_name: file.originalname,
        stored_name: file.filename,
        sha256_hash: sha256Hash,
        file_size: file.size
      });
    }

    res.status(201).json({ success: true, files: filesMetadata });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during file upload' });
  }
});

/**
 * GET /
 * List user's own incidents
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT i.id, i.title, i.incident_type, i.status, i.created_at,
             u.name AS expert_name,
             (SELECT COUNT(*) FROM files f WHERE f.incident_id = i.id) AS file_count,
             ac.severity
      FROM incidents i
      LEFT JOIN users u ON i.expert_id = u.id
      LEFT JOIN ai_classifications ac ON i.id = ac.incident_id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `;

    const [incidents] = await pool.query(query, [userId]);
    res.status(200).json({ success: true, incidents });
  } catch (error) {
    console.error('Fetch incidents error:', error);
    res.status(500).json({ success: false, error: 'Internal server error while fetching incidents' });
  }
});

/**
 * GET /:id
 * Get single incident detail
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const incidentId = req.params.id;
    const userId = req.user.id;

    const [incidents] = await pool.query('SELECT * FROM incidents WHERE id = ?', [incidentId]);
    const incident = incidents[0];

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    if (incident.user_id !== userId && req.user.role === 'user') {
      return res.status(403).json({ success: false, error: 'Unauthorized to view this incident' });
    }

    // Fetch files
    const [files] = await pool.query('SELECT id, original_name, stored_name, sha256_hash, file_size, created_at FROM files WHERE incident_id = ?', [incidentId]);
    
    // Fetch expert notes
    const [notes] = await pool.query(`
      SELECT en.id, en.note, en.created_at, u.name AS expert_name
      FROM expert_notes en
      JOIN users u ON en.expert_id = u.id
      WHERE en.incident_id = ?
      ORDER BY en.created_at ASC
    `, [incidentId]);

    // Fetch AI classification
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
    console.error('Fetch incident detail error:', error);
    res.status(500).json({ success: false, error: 'Internal server error while fetching incident detail' });
  }
});

/**
 * PATCH /:id/status
 * Update incident status (expert/admin only)
 */
router.patch('/:id/status', authenticate, requireRole('expert', 'admin'), async (req, res) => {
  try {
    const incidentId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    await pool.query('UPDATE incidents SET status = ? WHERE id = ?', [status, incidentId]);
    res.status(200).json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, error: 'Internal server error while updating status' });
  }
});

/**
 * PATCH /:id/assign
 * Assign expert_id to incident (expert/admin only)
 */
router.patch('/:id/assign', authenticate, requireRole('expert', 'admin'), async (req, res) => {
  try {
    const incidentId = req.params.id;
    const { expert_id } = req.body; // Or default to req.user.id if self-assigning

    const assignedExpertId = expert_id || req.user.id;

    await pool.query('UPDATE incidents SET expert_id = ? WHERE id = ?', [assignedExpertId, incidentId]);
    res.status(200).json({ success: true, message: 'Incident assigned successfully' });
  } catch (error) {
    console.error('Assign incident error:', error);
    res.status(500).json({ success: false, error: 'Internal server error while assigning incident' });
  }
});

module.exports = router;
