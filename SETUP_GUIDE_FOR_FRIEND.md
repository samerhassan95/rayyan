# Complete Setup Guide for Rayyan Dashboard

## Step 1: Start XAMPP
1. Open XAMPP Control Panel
2. Start **Apache** (for phpMyAdmin)
3. Start **MySQL** (for database)
4. Both should show green "Running" status

## Step 2: Create Database
1. Open browser and go to: `http://localhost/phpmyadmin`
2. Click "New" on the left sidebar
3. Database name: `rayyan_db`
4. Collation: `utf8mb4_general_ci`
5. Click "Create"

## Step 3: Import Data
1. In phpMyAdmin, click on `rayyan_db` database (left sidebar)
2. Click "Import" tab at the top
3. Click "Choose File" button
4. Select the file: `dump-rayyan-202604221358.sql`
5. Scroll down and click "Go" button
6. Wait for success message (should see green checkmark)

## Step 4: Verify Database Import
After import, you should see these tables in the left sidebar:
- activity_log
- categories
- discount_codes
- notifications
- order_items
- orders
- plans
- products
- settings
- subscriptions
- support_tickets
- transactions
- user_sessions
- users

## Step 5: Configure Backend
1. Open the project folder
2. Go to `backend` folder
3. Make sure `.env` file has these settings:
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=rayyan_db
JWT_SECRET=rayyan_super_secret_key_2024
```

## Step 6: Install Dependencies & Start Backend
Open Command Prompt or Terminal in the `backend` folder:

```bash
# Install dependencies (only needed first time)
npm install

# Start the backend server
npm start
```

You should see: `Server running on port 5000`

## Step 7: Test Database Connection
In a new terminal, run:
```bash
node test-friend-connection.js
```

This will verify:
- Database connection works
- Tables are imported
- Admin user exists

## Step 8: Start Frontend
Open a new Command Prompt/Terminal in the `frontend` folder:

```bash
# Install dependencies (only needed first time)
npm install

# Start the frontend
npm run dev
```

You should see: `Ready on http://localhost:3000`

## Step 9: Access the Dashboard
1. Open browser: `http://localhost:3000/admin/login`
2. Login with admin credentials:
   - Email: `admin@rayyan.com`
   - Password: `admin123`

## Troubleshooting

### Problem: All data shows 0
**Cause:** Backend is not running or not connected to database

**Solution:**
1. Check if backend is running (should see "Server running on port 5000")
2. Run `node test-friend-connection.js` to verify database connection
3. Check browser console (F12) for API errors
4. Check backend terminal for error messages

### Problem: Can't login
**Cause:** Admin user doesn't exist

**Solution:**
Run this in the backend folder:
```bash
node scripts/create-admin.js
```

### Problem: MySQL won't start in XAMPP
**Cause:** Port 3306 is already in use

**Solution:**
1. Close any other MySQL/MariaDB services
2. Or change port in XAMPP config and update `.env` file

### Problem: "Cannot connect to database"
**Cause:** Wrong credentials or MySQL not running

**Solution:**
1. Make sure MySQL is running in XAMPP (green status)
2. Verify `.env` file has correct settings
3. Check if `rayyan_db` database exists in phpMyAdmin

## Quick Checklist
- [ ] XAMPP MySQL is running (green)
- [ ] Database `rayyan_db` exists in phpMyAdmin
- [ ] All 14 tables are visible in phpMyAdmin
- [ ] Backend `.env` file has `DB_NAME=rayyan_db`
- [ ] Backend is running (`npm start` in backend folder)
- [ ] Frontend is running (`npm run dev` in frontend folder)
- [ ] Can access http://localhost:3000/admin/login
- [ ] Can login with admin@rayyan.com / admin123

## Need Help?
Run the test script to diagnose issues:
```bash
node test-friend-connection.js
```

This will tell you exactly what's wrong and how to fix it.
