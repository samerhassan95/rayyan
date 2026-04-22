-- Import script for rayyan_db database
-- Make sure to create the database first if it doesn't exist

CREATE DATABASE IF NOT EXISTS rayyan_db CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE rayyan_db;

-- Now import the dump file
-- In phpMyAdmin: 
-- 1. Select rayyan_db database
-- 2. Go to Import tab
-- 3. Choose dump-rayyan-202604221358.sql
-- 4. Click Go
