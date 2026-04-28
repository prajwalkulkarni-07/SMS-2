import { useQuery } from "@tanstack/react-query";
import { getTeacherSubjects } from "@/services/teachers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: subjectsData, isLoading } = useQuery({
    queryKey: ["teacher-subjects", user?.id],
    enabled: !!user?.id,
    queryFn: () => getTeacherSubjects(user!.id).then((r) => r.data),
  });
  // @ts-ignore
  const subjects = subjectsData?.data || [];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Teacher Dashboard</h2>
      </div>
      {(subjects || []).length === 0 ? <EmptyState message="No assigned classes" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(subjects || []).map((s) => (
            <Card key={s.id} onClick={() => navigate(`/teacher/classes/${s.class_id}`)} className="cursor-pointer hover:shadow-md transition">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Class {s.standard}-{s.section}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mt-1">Students: {s.student_count ?? "-"}</p>
                  </div>
                  <BookOpen className="h-5 w-5 text-primary opacity-60" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
