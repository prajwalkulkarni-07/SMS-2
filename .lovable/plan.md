

# School Management System (SMS) — Frontend

## 1. Authentication & Auth State
- **Login page** (`/login`) with email + password form, validated with Zod
- **Register page** (`/register`) with dynamic fields based on role selection (student shows class_id + roll_number, teacher shows qualification)
- **Auth Context** managing JWT token (localStorage), user data, login/logout functions
- **Auth guard** component wrapping all protected routes — redirects to `/login` if unauthenticated
- Auto-redirect to role-specific dashboard on login

## 2. Layout & Navigation
- **Sidebar + Navbar layout** for all authenticated pages using shadcn Sidebar
- Role-based menu items — each role sees only their relevant navigation links
- Collapsible sidebar with icons, responsive for mobile
- User info display + logout button in the header
- Role badges throughout the UI

## 3. API Layer
- Central **Axios instance** with base URL (`http://localhost:5000/api`), JWT interceptor, and 401 auto-logout
- **React Query hooks** for each resource (users, classes, subjects, students, teachers, attendance, assessments, attempts) providing caching, loading states, and error handling

## 4. Admin Pages

### Admin Dashboard (`/admin/dashboard`)
- Summary cards: total users, students, teachers, classes, subjects
- Latest users table

### User Management (`/admin/users`)
- Filterable user table (by role, active status) with pagination
- Create user modal/form with role-specific fields
- Edit user, toggle active status, delete user

### Class Management (`/admin/classes`)
- Classes table with create, edit, delete functionality

### Subject Management (`/admin/subjects`)
- Subjects table with CRUD
- Assign teacher to subject via dropdown

### Student & Teacher Lists (`/admin/students`, `/admin/teachers`)
- Student list showing class and roll number
- Teacher list showing qualification

## 5. Teacher Pages

### Teacher Dashboard (`/teacher/dashboard`)
- Assigned subjects list
- Student count per subject

### Attendance (`/teacher/attendance`)
- Select subject + date, then mark attendance for all students (bulk)
- Attendance history view with filters

### Assessments (`/teacher/assessments`)
- Create assessment with MCQ questions
- View results per assessment

## 6. Student Pages

### Student Dashboard (`/student/dashboard`)
- Class info, assigned subjects, attendance summary, upcoming assessments

### Assessments (`/student/assessments`)
- Take MCQ assessment with question navigation
- Submit answers
- View attempt results and scores

## 7. Shared UI Components
- Reusable data tables with pagination and empty states
- Form components with validation error messages
- Loading spinners/skeletons
- Toast notifications for all API success/error responses
- Confirmation dialogs for destructive actions (delete)

## 8. Project Structure
```
/src
  /components    — Reusable UI (DataTable, AuthGuard, RoleBadge, etc.)
  /layouts       — SidebarLayout with role-based navigation
  /pages         — admin/, teacher/, student/, Login, Register
  /services      — Axios instance + API functions
  /hooks         — React Query hooks per resource
  /contexts      — AuthContext
  /utils         — Helpers (role checks, formatters)
```

