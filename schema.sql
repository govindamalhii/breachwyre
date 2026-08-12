CREATE DATABASE IF NOT EXISTS breachwyre_db;
USE breachwyre_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'expert', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incidents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    incident_type VARCHAR(100) NOT NULL,
    severity_score ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    status ENUM('open', 'in_progress', 'resolved') DEFAULT 'open',
    assigned_expert_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_expert_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    incident_id INT NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expert_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    incident_id INT NOT NULL,
    expert_id INT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
    FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_classifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    incident_id INT NOT NULL,
    predicted_category VARCHAR(255) NOT NULL,
    confidence_score DECIMAL(5,2) NOT NULL,
    recommended_action TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_incidents_user_id ON incidents(user_id);
CREATE INDEX idx_files_incident_id ON files(incident_id);
CREATE INDEX idx_expert_notes_incident_id ON expert_notes(incident_id);
CREATE INDEX idx_ai_classifications_incident_id ON ai_classifications(incident_id);

-- Insert Demo Data
INSERT INTO users (name, email, password, role) VALUES 
('Alice Smith', 'alice@example.com', '$2b$10$demoHashUserPwdHashed...', 'user'),
('Bob Expert', 'bob@breachwyre.com', '$2b$10$demoHashExpertPwdHashed...', 'expert');

INSERT INTO incidents (user_id, title, description, incident_type, severity_score, status, assigned_expert_id) VALUES 
((SELECT id FROM users WHERE email='alice@example.com'), 'Suspicious Login Attempt', 'Noticed an unrecognized device logging into my account from a foreign IP.', 'Unauthorized Access', 'medium', 'in_progress', (SELECT id FROM users WHERE email='bob@breachwyre.com'));

INSERT INTO expert_notes (incident_id, expert_id, note) VALUES 
(1, 2, 'Initial review of logs shows login came from Tor exit node. Requested additional firewall logs from client.');
