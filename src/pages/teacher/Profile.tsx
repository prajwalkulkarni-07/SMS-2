import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getTeacherById } from "@/services/teachers";
import { Mail, Phone, User2, BookOpen } from "lucide-react";

export default function TeacherProfile() {
  const { user } = useAuth();
  const { data, isFetching } = useQuery({
    queryKey: ["teacher-profile", user?.id],
    queryFn: () => getTeacherById(user!.id).then((r) => r.data),
    enabled: !!user?.id,
  });

  if (!user || isFetching) return <LoadingSpinner />;

  // @ts-ignore
  const teacher = data?.data || {};
  const subjectName = teacher.subject_name || teacher.assignments?.[0]?.subject_name || "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <User2 className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Profile</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{user?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{user?.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{subjectName}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
