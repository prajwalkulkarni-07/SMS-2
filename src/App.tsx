import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/layouts/AppLayout";

import LoginPage from "@/pages/Login";
import ForceChangePasswordPage from "@/pages/ForceChangePassword";
import AdminDashboard from "@/pages/admin/Dashboard";
import UsersPage from "@/pages/admin/Users";
import ClassesPage from "@/pages/admin/Classes";
import SubjectsPage from "@/pages/admin/Subjects";
import StudentsPage from "@/pages/admin/Students";
import TeachersPage from "@/pages/admin/Teachers";
import TeacherDetailPage from "@/pages/admin/TeacherDetail";
import StudentDetailPage from "@/pages/admin/StudentDetail";
import TeacherDashboard from "@/pages/teacher/Dashboard";
import StudentsPerformances from "@/pages/teacher/StudentsPerformances";
import AssessmentPerformance from "@/pages/teacher/AssessmentPerformance";
import TeacherProfile from "@/pages/teacher/Profile";
import TeacherClassDetail from "@/pages/teacher/ClassDetail";
import StudentPerformanceDetail from "@/pages/teacher/StudentPerformanceDetail";
import UploadMarks from "@/pages/teacher/UploadMarks";
import StudentDashboard from "@/pages/student/Dashboard";
import StudentProfile from "@/pages/student/Profile";
import MyPerformance from "@/pages/student/MyPerformance";
import SubjectPerformance from "@/pages/student/SubjectPerformance";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles: ("admin" | "teacher" | "student")[] }) {
  return (
    <AuthGuard allowedRoles={roles}>
      <AppLayout>{children}</AppLayout>
    </AuthGuard>
  );
}

function AuthOnlyRoute({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/force-change-password" element={<AuthOnlyRoute><ForceChangePasswordPage /></AuthOnlyRoute>} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Admin */}
            <Route path="/admin/dashboard" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><UsersPage /></ProtectedRoute>} />
            <Route path="/admin/classes" element={<ProtectedRoute roles={["admin"]}><ClassesPage /></ProtectedRoute>} />
            <Route path="/admin/subjects" element={<ProtectedRoute roles={["admin"]}><SubjectsPage /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute roles={["admin"]}><StudentsPage /></ProtectedRoute>} />
            <Route path="/admin/students/:studentId" element={<ProtectedRoute roles={["admin"]}><StudentDetailPage /></ProtectedRoute>} />
            <Route path="/admin/teachers" element={<ProtectedRoute roles={["admin"]}><TeachersPage /></ProtectedRoute>} />
            <Route path="/admin/teachers/:teacherId" element={<ProtectedRoute roles={["admin"]}><TeacherDetailPage /></ProtectedRoute>} />

            {/* Teacher */}
            <Route path="/teacher/dashboard" element={<ProtectedRoute roles={["teacher"]}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/profile" element={<ProtectedRoute roles={["teacher"]}><TeacherProfile /></ProtectedRoute>} />
            <Route path="/teacher/upload-marks" element={<ProtectedRoute roles={["teacher"]}><UploadMarks /></ProtectedRoute>} />
            <Route path="/teacher/classes/:classId" element={<ProtectedRoute roles={["teacher"]}><TeacherClassDetail /></ProtectedRoute>} />
            <Route path="/teacher/classes/:classId/students/:studentId/performance" element={<ProtectedRoute roles={["teacher"]}><StudentPerformanceDetail /></ProtectedRoute>} />
            <Route path="/teacher/assessments" element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="/teacher/performance" element={<ProtectedRoute roles={["teacher"]}><StudentsPerformances /></ProtectedRoute>} />
            <Route path="/teacher/performance/:assessmentId" element={<ProtectedRoute roles={["teacher"]}><AssessmentPerformance /></ProtectedRoute>} />

            {/* Student */}
            <Route path="/student/dashboard" element={<ProtectedRoute roles={["student"]}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute roles={["student"]}><StudentProfile /></ProtectedRoute>} />
            <Route path="/student/assessments" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/student/performance" element={<ProtectedRoute roles={["student"]}><MyPerformance /></ProtectedRoute>} />
            <Route path="/student/subjects/:subjectId/performance" element={<ProtectedRoute roles={["student"]}><SubjectPerformance /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
