# CV Converter - Complete Authentication System

A full-stack application with NestJS backend authentication and Angular frontend with modern UI.

## 🚀 Features

### Backend (NestJS + Prisma + PostgreSQL)

- ✅ JWT Authentication (Login/Register)
- ✅ Protected API routes with guards
- ✅ Swagger API documentation
- ✅ PostgreSQL database with Prisma ORM
- ✅ Password hashing with bcrypt
- ✅ Input validation with class-validator
- ✅ User management endpoints

### Frontend (Angular Standalone + Signals)

- ✅ Modern Angular 20+ with standalone components
- ✅ Reactive authentication with Angular Signals
- ✅ Beautiful login/register forms
- ✅ Protected dashboard with sidebar navigation
- ✅ CV upload component with drag-and-drop
- ✅ HTTP interceptor for automatic token injection
- ✅ Route guards for protected pages
- ✅ Responsive design

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

1. **Create PostgreSQL database:**

   ```sql
   CREATE DATABASE cv_converter_db;
   ```

2. **Create environment file:**

   ```bash
   # Create .env file in apps/cv-converter-api/
   echo 'DATABASE_URL="postgresql://username:password@localhost:5432/cv_converter_db?schema=public"' > apps/cv-converter-api/.env
   echo 'NODE_ENV=development' >> apps/cv-converter-api/.env
   echo 'PORT=3000' >> apps/cv-converter-api/.env
   echo 'JWT_SECRET=your_super_secret_jwt_key_change_in_production' >> apps/cv-converter-api/.env
   ```

3. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

### 3. Development

**Start both applications:**

```bash
npm run start:all
```

Or start individually:

```bash
# Backend only
nx serve cv-converter-api

# Frontend only
nx serve cv-converter-web
```

### 4. Access the Applications

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:3000/api
- **Swagger Documentation**: http://localhost:3000/api/docs

## 🎯 Usage Guide

### Authentication Flow

1. **Register**: Visit http://localhost:4200/register

   - Enter name, email, and password (min 6 chars)
   - Automatic login after registration

2. **Login**: Visit http://localhost:4200/login

   - Enter email and password
   - Redirected to dashboard after successful login

3. **Dashboard**: Protected route with sidebar
   - Upload CV page (default)
   - My CVs (placeholder)
   - Profile (placeholder)
   - User info and logout in sidebar footer

### API Endpoints

#### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile (protected)

#### Users (Protected)

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Testing with Swagger

1. Visit: http://localhost:3000/api/docs
2. Register a new user using `/auth/register`
3. Copy the returned `access_token`
4. Click "Authorize" button in Swagger
5. Enter: `Bearer YOUR_TOKEN_HERE`
6. Test protected endpoints

## 📁 Project Structure

```
cv-converter/
├── apps/
│   ├── cv-converter-api/          # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/              # Authentication module
│   │   │   ├── users/             # Users module
│   │   │   ├── prisma/            # Prisma service
│   │   │   └── main.ts           # Application entry
│   │   └── prisma/
│   │       └── schema.prisma     # Database schema
│   └── cv-converter-web/         # Angular Frontend
│       └── src/app/
│           ├── components/       # UI Components
│           │   ├── login/
│           │   ├── register/
│           │   ├── dashboard/
│           │   └── cv-upload/
│           ├── services/         # Angular services
│           ├── guards/           # Route guards
│           └── models/           # TypeScript interfaces
└── package.json
```

## 🎨 UI Components

### Login Component

- Modern gradient background
- Form validation with error messages
- Loading states and spinners
- Responsive design

### Register Component

- Similar design to login
- Additional name field validation
- Password strength requirements

### Dashboard Layout

- Fixed sidebar navigation
- User avatar and info
- Responsive mobile design
- Logout functionality

### CV Upload Component

- Drag-and-drop file upload
- File type validation (PDF, DOC, DOCX)
- Upload progress indicator
- Recent uploads list
- Mock data for demonstration

## 🔧 Available Scripts

```bash
# Development
npm run start:all        # Start both frontend and backend
npm run start:front      # Start frontend only

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run database migrations
npm run db:reset         # Reset database
npm run db:studio        # Open Prisma Studio

# Build
npm run build:all        # Build both applications
```

## 🔐 Security Features

- **Password Hashing**: bcrypt with 12 rounds
- **JWT Tokens**: 24-hour expiration
- **Route Protection**: Guards on both frontend and backend
- **Input Validation**: Comprehensive validation with class-validator
- **CORS**: Configured for development
- **Error Handling**: Consistent error responses

## 📱 Responsive Design

- Mobile-first approach
- Collapsible sidebar on mobile
- Touch-friendly interfaces
- Optimized for all screen sizes

## 🚀 Next Steps

1. **CV Processing**: Implement actual file upload and conversion
2. **Real CV Management**: Create CV listing and management pages
3. **User Profile**: Complete user profile management
4. **File Storage**: Integrate cloud storage (AWS S3, etc.)
5. **Email Verification**: Add email verification flow
6. **Password Reset**: Implement forgot password functionality
7. **Admin Panel**: Create admin interface
8. **Testing**: Add comprehensive test suites
9. **Deployment**: Production deployment configuration

## 💡 Development Tips

- Use Swagger UI for API testing during development
- The backend has comprehensive error handling and validation
- Frontend uses Angular Signals for reactive state management
- All components follow standalone component pattern
- Authentication state persists in localStorage
- HTTP interceptor automatically adds tokens to requests

## 🐛 Troubleshooting

**Database Connection Issues:**

- Verify PostgreSQL is running
- Check DATABASE_URL in .env file
- Ensure database exists and is accessible

**Build Errors:**

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Regenerate Prisma client: `npm run db:generate`

**Authentication Issues:**

- Check JWT_SECRET in .env file
- Verify token is being stored in localStorage
- Check browser network tab for API errors

---

🎉 **You now have a complete authentication system with modern UI and secure backend!**
