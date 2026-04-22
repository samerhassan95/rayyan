# Quick Fix Guide

## The issue is likely that the backend isn't running or can't see the database.

### Step 1: Test if backend can connect to database

Open terminal in the **backend** folder and run:

```bash
cd backend
node -e "const pool = require('./config/database'); pool.query('SELECT COUNT(*) as count FROM users').then(([rows]) => console.log('Users:', rows[0].count)).catch(err => console.error('Error:', err.message));"
```

**If this shows "Users: [some number]"** → Database connection works! ✓

**If this shows an error** → Database connection problem ✗

---

### Step 2: Make sure backend server is running

In the **backend** folder:

```bash
npm start
```

You should see: `Server running on port 5000`

**Keep this terminal open!** Don't close it.

---

### Step 3: Test the backend API

Open a **NEW** terminal (keep backend running) and run:

```bash
curl http://localhost:5000/api/test
```

Or open browser and go to: `http://localhost:5000/api/test`

You should see: `{"message":"Rayyan API is running!","database":"Connected"}`

---

### Step 4: Check frontend configuration

Make sure `frontend/.env.local` exists and has:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

### Step 5: Start frontend

In the **frontend** folder (in a NEW terminal):

```bash
cd frontend
npm run dev
```

You should see: `Ready on http://localhost:3000`

---

### Step 6: Open the website

Go to: `http://localhost:3000/admin/login`

Login with:
- Email: `admin@rayyan.com`
- Password: `admin123`

---

## Still showing 0?

### Check browser console:

1. Press F12 in browser
2. Go to "Console" tab
3. Look for red errors
4. Share the error messages

### Check backend terminal:

Look at the terminal where backend is running. You should see API requests like:
```
GET /api/admin/stats
GET /api/admin/users
```

If you don't see these, the frontend isn't calling the backend.

### Common issues:

1. **Backend not running** → Run `npm start` in backend folder
2. **Wrong API URL** → Check frontend/.env.local
3. **CORS error** → Backend should have `app.use(cors())` in server.js
4. **Wrong database name** → Check backend/.env has `DB_NAME=rayyan_db`

---

## Quick checklist:

- [ ] MySQL running in XAMPP (green status)
- [ ] Database `rayyan_db` exists and has data in phpMyAdmin
- [ ] Backend `.env` file has `DB_NAME=rayyan_db`
- [ ] Backend server is running (`npm start` in backend folder)
- [ ] Can access http://localhost:5000/api/test in browser
- [ ] Frontend `.env.local` has correct API URL
- [ ] Frontend is running (`npm run dev` in frontend folder)
- [ ] No errors in browser console (F12)

If all checked and still not working, share:
1. Backend terminal output
2. Browser console errors (F12)
3. Result of: `curl http://localhost:5000/api/test`
