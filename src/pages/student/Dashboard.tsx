import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getStudentSubjects } from "@/services/studentSubjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, School } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: subjectsData, isLoading: ls } = useQuery({
    queryKey: ["student-subjects", user?.id],
    enabled: !!user?.id,
    queryFn: () => getStudentSubjects(user!.id).then((r) => r.data),
    retry: false,
  });

  if (ls) return <LoadingSpinner />;

  // @ts-ignore
  const subjectPayload = subjectsData?.data || { subjects: [] };
  const subjects = subjectPayload.subjects || [];
  const academicYear = subjectPayload.academic_year;

  // Extract class information from the first subject
  const classInfo = subjects.length > 0 
    ? (subjects[0].class_label || (subjects[0].standard ? `${subjects[0].standard}-${subjects[0].section}` : "-"))
    : "-";

  const cards = [
    { label: "Your class", value: classInfo, icon: School, color: "text-blue-600" },
    { label: "Subjects", value: (subjects || []).length, icon: BookOpen, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Welcome, {user?.name}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="text-3xl font-bold text-foreground">{c.value}</p>
                </div>
                <c.icon className={`h-8 w-8 ${c.color} opacity-70`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Subjects</CardTitle>
          {academicYear && <p className="text-sm text-muted-foreground">Academic Year: {academicYear}</p>}
        </CardHeader>
        <CardContent>
          {(subjects || []).length === 0 ? <EmptyState message="No subjects assigned" /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(subjects || []).map((s) => (
                <div 
                  key={s.id} 
                  className="p-3 rounded-lg border bg-muted/30 cursor-pointer transition-colors hover:bg-muted hover:border-primary"
                  onClick={() => navigate(`/student/subjects/${s.id}/performance`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      navigate(`/student/subjects/${s.id}/performance`);
                    }
                  }}
                >
                  <p className="font-medium text-foreground">{s.name || s.subject_name}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
