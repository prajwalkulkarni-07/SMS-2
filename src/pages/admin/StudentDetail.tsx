import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getUserById, resetUserPassword } from "@/services/users";
import { getStudentSubjects } from "@/services/studentSubjects";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, BookOpen, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function StudentDetailPage() {
  const { studentId } = useParams();
  const sid = Number(studentId);
  const navigate = useNavigate();

  const { data: userData, isLoading } = useQuery({
    queryKey: ["student-detail", sid],
    enabled: Number.isFinite(sid),
    queryFn: () => getUserById(sid).then((r) => r.data),
  });

  const { data: subjectsData, isLoading: subjectsLoading } = useQuery({
    queryKey: ["student-subjects", sid],
    enabled: Number.isFinite(sid),
    queryFn: () => getStudentSubjects(sid).then((r) => r.data),
    retry: false,
  });

  const resetPasswordMut = useMutation({
    mutationFn: () => resetUserPassword(sid),
    onSuccess: () => {
      toast.success("Password reset to Password@123. User must change password on next login.");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to reset password"),
  });

  if (!Number.isFinite(sid)) return <EmptyState message="Invalid student" />;
  if (isLoading) return <LoadingSpinner />;

  const student = (userData?.data as any) || null;
  if (!student) return <EmptyState message="Student not found" />;

  const enrollments = (student.enrollments as any[]) || [];
  const primaryClass = enrollments[0];
  const classLabel = primaryClass?.class_name || primaryClass?.class_id || "—";
  const academicYear = primaryClass?.academic_year || "—";

  const subjectPayload = subjectsData?.data || { subjects: [] };
  const subjects = subjectPayload.subjects || [];
  const subjectYear = subjectPayload.academic_year || academicYear;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/admin/users")}> <ArrowLeft className="h-4 w-4" /> Users</Button>
        <Users className="h-7 w-7 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">{student.name}</h2>
          <p className="text-sm text-muted-foreground">{student.email}</p>
        </div>
        <div className="ml-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="bg-amber-600 hover:bg-amber-700 text-white">Reset Password</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-amber-700">Warning: Reset password?</AlertDialogTitle>
                <AlertDialogDescription className="text-amber-700/90">
                  This action cannot be undone. Are you sure you want to proceed?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => resetPasswordMut.mutate()}
                  disabled={resetPasswordMut.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Reset Password
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{student.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{student.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium">{student.phone || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="font-medium">{student.role}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Class</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <EmptyState message="Not enrolled in a class" />
          ) : (
            <div className="space-y-2">
              {enrollments.map((enr: any) => (
                <div key={enr.id} className="rounded-md border p-3 bg-muted/30 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{enr.class_name || `Class ${enr.class_id}`}</p>
                    <p className="text-xs text-muted-foreground">Academic year: {enr.academic_year}</p>
                  </div>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Subjects</CardTitle>
          {subjectYear && <p className="text-sm text-muted-foreground">Academic Year: {subjectYear}</p>}
        </CardHeader>
        <CardContent>
          {subjectsLoading ? (
            <LoadingSpinner />
          ) : (subjects || []).length === 0 ? (
            <EmptyState message="No subjects assigned" />
          ) : (
            <div className="space-y-2">
              {subjects.map((s: any) => (
                <div key={s.id || s.subject_id} className="flex items-center justify-between rounded-md border p-3 bg-muted/40">
                  <div>
                    <p className="font-medium text-foreground">{s.name || s.subject_name}</p>
                  </div>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
