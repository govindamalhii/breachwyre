const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

/**
 * Deterministic NLP-style rule-based classifier function
 */
function classifyIncident(title, description, incident_type) {
  const text = (title + ' ' + description + ' ' + incident_type).toLowerCase();

  const keywords = {
    CRITICAL: ['ransomware', 'encrypted files', 'ransom note', 'data exfiltration', 'active breach', 'lateral movement', 'domain controller', 'all files encrypted'],
    HIGH: ['phishing', 'credential theft', 'unauthorized access', 'malware detected', 'suspicious login', 'data breach', 'social engineering', 'brute force'],
    MEDIUM: ['suspicious email', 'unusual activity', 'port scan', 'vulnerability scan', 'password reset', 'account lockout'],
    LOW: ['spam', 'slow system', 'missing files', 'general inquiry']
  };

  const recommendations = {
    CRITICAL: 'Immediately isolate affected systems from network. Preserve memory dumps and system images. Engage IR team. Contact law enforcement. Do NOT restart systems.',
    HIGH: 'Change all passwords immediately. Enable MFA. Review access logs. Quarantine suspicious processes. Preserve evidence before remediation.',
    MEDIUM: 'Document all suspicious activity. Run full antivirus scan. Review email headers and access logs. Monitor for escalation.',
    LOW: 'Log incident for records. Run routine security checks. Update software and patches.'
  };

  let maxSeverity = 'LOW';
  let bestConfidence = 0;
  let bestCategory = incident_type || 'general';

  // Evaluate severities in order
  for (const severity of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']) {
    const categoryKeywords = keywords[severity];
    let matchedCount = 0;

    for (const kw of categoryKeywords) {
      if (text.includes(kw)) {
        matchedCount++;
      }
    }

    if (matchedCount > 0) {
      const confidence = Math.min(Math.floor((matchedCount / categoryKeywords.length) * 100 * 2), 99); // Scale up a bit, max 99
      if (['CRITICAL', 'HIGH'].includes(severity) || confidence > bestConfidence) {
        maxSeverity = severity;
        bestConfidence = Math.max(bestConfidence, confidence);
      }
      
      // If we hit critical, we can break early or just continue to accumulate info
      if (severity === 'CRITICAL') {
        maxSeverity = 'CRITICAL';
        break;
      }
    }
  }

  // Ensure minimum confidence if category was matched but few keywords
  if (bestConfidence === 0) {
    bestConfidence = 10; 
  }

  return {
    severity: maxSeverity,
    confidence: bestConfidence,
    recommended_action: recommendations[maxSeverity],
    category: bestCategory
  };
}

/**
 * POST /classify
 * Takes {title, description, incident_type} and runs the rule-based classifier
 */
router.post('/classify', authenticate, async (req, res) => {
  try {
    const { title, description, incident_type } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Title and description are required' });
    }

    const aiResult = classifyIncident(title, description, incident_type);

    // Normally we'd insert this if there's an incident_id, but this is a generic endpoint
    // Return the classification directly
    res.status(200).json({
      success: true,
      classification: aiResult
    });
  } catch (error) {
    console.error('AI classify error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during classification' });
  }
});

// Export both the router and the function for internal use
module.exports = router;
module.exports.classifyIncident = classifyIncident;
