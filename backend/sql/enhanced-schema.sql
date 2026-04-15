-- Enhanced Rayyan Database Schema
-- Create database
CREATE DATABASE IF NOT EXISTS rayyan;
USE rayyan;

-- Users table with enhanced fields
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  profile_image VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  job_title VARCHAR(100),
  bio TEXT,
  acquisition_source ENUM('direct', 'referral', 'social', 'other') DEFAULT 'direct',
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  tier VARCHAR(50),
  monthly_price DECIMAL(10,2),
  yearly_price DECIMAL(10,2),
  description TEXT,
  features JSON,
  recommended BOOLEAN DEFAULT FALSE,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  plan_id INT,
  status ENUM('active', 'past_due', 'cancelled', 'expired') DEFAULT 'active',
  billing_cycle ENUM('monthly', 'yearly') DEFAULT 'monthly',
  current_period_start DATE,
  current_period_end DATE,
  next_payment_date DATE,
  amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  subscription_id INT,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status ENUM('pending', 'successful', 'failed', 'refunded') DEFAULT 'pending',
  payment_method VARCHAR(100),
  payment_method_details JSON,
  description TEXT,
  fees DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2),
  transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  refunded_at TIMESTAMP NULL,
  refund_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INT,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  status ENUM('open', 'pending', 'resolved', 'closed') DEFAULT 'open',
  assigned_to INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  device_info VARCHAR(255),
  browser VARCHAR(100),
  ip_address VARCHAR(45),
  location VARCHAR(255),
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Discount codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
  max_usage INT DEFAULT 0,
  usage_count INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products/Services table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  category_id INT,
  image VARCHAR(255),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  total_amount DECIMAL(10,2),
  status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivery_date DATE,
  notes TEXT,
  INDEX idx_user (user_id)
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  product_id INT,
  quantity INT DEFAULT 1,
  price DECIMAL(10,2),
  INDEX idx_order (order_id),
  INDEX idx_product (product_id)
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default admin user
INSERT INTO users (username, email, password, role, job_title) VALUES 
('admin', 'admin@rayyan.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Administrator')
ON DUPLICATE KEY UPDATE password = VALUES(password);

-- Insert default plans
INSERT INTO plans (name, tier, monthly_price, yearly_price, description, features, recommended) VALUES
('Basic', 'ENTRY TIER', 29.00, 290.00, 'Perfect for individuals and small experimental projects.', 
 JSON_ARRAY('Up to 3 active projects', 'Basic analytics dashboard'), FALSE),
('Professional', 'PROFESSIONAL', 79.00, 790.00, 'Perfect for individuals and small experimental projects.', 
 JSON_ARRAY('Up to 3 active projects', 'Basic analytics dashboard', 'Custom domain mapping', '24/7 priority support'), TRUE),
('Enterprise', 'HIGH VOLUME', 249.00, 2490.00, 'Bespoke infrastructure for large-scale operations.', 
 JSON_ARRAY('Everything in Professional', 'Dedicated account manager', 'White-label reporting', 'SLA Guarantees & SOC2'), FALSE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, description) VALUES
('site_name', 'Rayyan Admin', 'Website name'),
('site_email', 'admin@rayyan.com', 'Contact email'),
('currency', 'USD', 'Default currency'),
('tax_rate', '10', 'Tax percentage')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Clothing', 'Fashion and apparel'),
('Books', 'Books and educational materials')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Insert sample support tickets
INSERT INTO support_tickets (ticket_number, user_id, subject, description, category, priority, status) VALUES
('TIC-8842', 1, 'Billing Discrepancy - Q3 Report', 'Financial Ledger Reconciliation issue', 'Financial', 'critical', 'open'),
('TIC-8839', 1, 'API Connection Timeout', 'Technical support needed', 'Technical Support', 'medium', 'pending'),
('TIC-8831', 1, 'User Seat Expansion Request', 'Account management request', 'Account Management', 'low', 'resolved')
ON DUPLICATE KEY UPDATE subject = VALUES(subject);

-- Insert sample user sessions
INSERT INTO user_sessions (user_id, device_info, browser, ip_address, location, is_current) VALUES
(1, 'MacBook Pro 16"', 'Chrome', '192.168.1.1', 'San Francisco, United States', TRUE),
(1, 'iPhone 15 Pro', 'Safari', '192.168.1.2', 'London, United Kingdom', FALSE),
(1, 'iPad Air', 'App', '192.168.1.3', 'Paris, France', FALSE)
ON DUPLICATE KEY UPDATE device_info = VALUES(device_info);