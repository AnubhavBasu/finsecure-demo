-- FinSecure Banking Demo — Database Schema
-- Run this once against your local MySQL instance:
--   mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS finsecure_demo;
USE finsecure_demo;

-- The single demo table. Covers:
--   KYC / account opening (kyc_status, daily_transfer_limit)  -> PRD §1
--   Login & lockout (failed_login_attempts, locked_until)      -> PRD §2
--   Fund transfers (balance)                                   -> PRD §3
CREATE TABLE IF NOT EXISTS accounts (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  full_name              VARCHAR(100)  NOT NULL,
  email                  VARCHAR(100)  NOT NULL UNIQUE,
  password_hash          VARCHAR(255)  NOT NULL,
  pan_number             VARCHAR(20)   NULL,
  aadhaar_number         VARCHAR(20)   NULL,
  kyc_status             ENUM('Restricted','Verified') NOT NULL DEFAULT 'Restricted',
  balance                DECIMAL(12,2) NOT NULL DEFAULT 5000.00,
  daily_transfer_limit   DECIMAL(12,2) NOT NULL DEFAULT 500.00,
  failed_login_attempts  INT           NOT NULL DEFAULT 0,
  locked_until           DATETIME      NULL,
  created_at             TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- The demo user (demo@finsecure.com / Passw0rd!) is seeded by running
-- `npm run seed` after `npm install` — see README.md. It is NOT hardcoded
-- here, because a bcrypt hash needs to be computed by bcrypt itself, not
-- typed in by hand.
