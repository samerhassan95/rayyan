# Rayyan Project

Full-stack web application with Express.js backend, Next.js frontend, and comprehensive admin dashboard.

## Project Structure

```
rayyan-project/
├── backend/           # Express.js API server
│   ├── routes/        # API routes (auth, users, admin)
│   ├── middleware/    # Authentication middleware
│   ├── config/        # Database configuration
│   ├── scripts/       # Utility scripts
│   └── sql/           # Database schema
├── frontend/          # Next.js React application
│   ├── src/app/       # App router pages
│   ├── admin/         # Admin dashboard pages
│   └── auth/          # Authentication pages
└── package.json       # Root package.json for scripts
```

## Features

### Admin Dashboard
- **Overview**: Real-time performance metrics and system health
- **User Management**: Manage platform members, roles, and access permissions
- **Subscription Management**: Monitor and manage recurring customer plans
- **Transaction Management**: Financial activity tracking and reporting
- **Pricing Plans**: Configure subscription tiers and feature access
- **System Settings**: Organizational identity, security, and integrations

### Authentication & Security
- JWT-based authentication
- Role-based access control (Admin/User)
- Password hashing with bcrypt
- Admin-specific login endpoints

### Database Schema
- Users with roles and status management
- Categories and products/services
- Orders and order items tracking
- System settings configuration
- Comprehensive relationships and constraints

## Database Configuration

- **Host**: localhost
- **Port**: 3307
- **Database**: rayyan_db
- **Username**: rayyan
- **Password**: samerhassan11

## Setup Instructions

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install-all
```

### 2. Database Setup

**Option A: Automatic Setup (Recommended)**
```bash
cd backend
npm run test-db    # Test database connection
npm run setup-db   # Create database and tables
npm run create-admin # Create admin user
```

**Option B: Manual Setup**
1. Make sure MySQL is running on port 3307
2. Create the database and user:

```sql
CREATE DATABASE rayyan_db;
CREATE USER 'rayyan'@'localhost' IDENTIFIED BY 'samerhassan11';
GRANT ALL PRIVILEGES ON rayyan_db.* TO 'rayyan'@'localhost';
FLUSH PRIVILEGES;
```

3. Run the schema:

```bash
mysql -h localhost -P 3307 -u rayyan -psamerhassan11 < backend/sql/schema.sql
```

4. Create admin user:

```bash
cd backend
npm run create-admin
```

### 3. Verify Setup

```bash
cd backend
npm run test-db  # This will verify everything is working
```

### 3. Environment Variables

Backend `.env` file is already configured with:
- Database connection (port 3307)
- JWT secret
- Server port (5000)

Frontend `.env.local` is configured to connect to backend API.

### 4. Run the Application

```bash
# Run both frontend and backend concurrently
npm run dev
```

Or run them separately:

```bash
# Backend only (port 5000)
npm run server

# Frontend only (port 3000)
npm run client
```

## Access Points

### User Application
- **URL**: http://localhost:3000
- **Features**: User registration, login, profile management

### Admin Dashboard
- **URL**: http://localhost:3000/admin
- **Login**: http://localhost:3000/admin/login
- **Default Credentials**:
  - Email: admin@rayyan.com
  - Password: password

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login

### User Management
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID

### Admin Endpoints (Requires Admin Authentication)
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/users` - User management
- `PUT /api/admin/users/:id/status` - Update user status
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/categories` - Category management
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `GET /api/admin/products` - Product management
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/orders` - Order management
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/settings` - System settings
- `PUT /api/admin/settings` - Update settings

## Admin Dashboard Features

### 1. Overview Dashboard
- Total users, revenue, active subscriptions, growth rate
- Performance trends with monthly revenue tracking
- Recent transactions with user details
- User acquisition source distribution

### 2. User Management
- User listing with search and filtering
- Role management (Admin/User)
- Status control (Active/Inactive/Suspended)
- User statistics (seat utilization, activation metrics)

### 3. Subscription Management
- Subscription overview with plan distribution
- Billing cycle management (Monthly/Yearly)
- Status tracking (Active/Past Due/Cancelled)
- Revenue growth projections

### 4. Transaction Management
- Financial activity monitoring
- Payment method tracking
- Revenue trends visualization
- Transaction status management

### 5. Pricing Plans
- Three-tier pricing structure (Basic/Professional/Enterprise)
- Plan feature management
- Billing period toggle (Monthly/Yearly)
- Revenue and subscription analytics

### 6. System Settings
- Profile management
- Security & privacy controls
- Notification preferences
- Appearance customization
- Two-factor authentication
- Active session management

## Technologies Used

### Backend
- Node.js & Express.js
- MySQL2 for database operations
- JWT for authentication
- bcryptjs for password hashing
- CORS for cross-origin requests

### Frontend
- Next.js 14 with App Router
- React 18 with TypeScript
- Custom CSS with responsive design
- Axios for API communication

### Database
- MySQL with comprehensive schema
- Foreign key relationships
- Enum types for status management
- Timestamp tracking for audit trails

## Development Notes

- The project uses a modern admin dashboard design with clean UI
- All admin pages are fully responsive
- Authentication is handled with JWT tokens
- Role-based access control protects admin routes
- Database includes sample data and proper relationships
- Error handling and validation throughout the application

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based route protection
- Admin-only endpoints
- Input validation and sanitization
- CORS configuration for API security

## Future Enhancements

- Real-time notifications
- Advanced analytics and reporting
- File upload capabilities
- Email notification system
- Advanced user permissions
- API rate limiting
- Audit logging system