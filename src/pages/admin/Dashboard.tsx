import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/services/users";
import { getClasses } from "@/services/classes";
import { getSubjects } from "@/services/subjects";
import { getStudents } from "@/services/students";
import { getTeachers } from "@/services/teachers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RoleBadge from "@/components/RoleBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Users, GraduationCap, UserCircle, School, BookOpen } from "lucide-react";

export default function AdminDashboard() {
  const { data: usersData, isLoading: lu } = useQuery({ queryKey: ["users"], queryFn: () => getUsers().then((r) => r.data) });
  const { data: classesData, isLoading: lc } = useQuery({ queryKey: ["classes"], queryFn: () => getClasses().then((r) => r.data) });
  const { data: subjectsData, isLoading: ls } = useQuery({ queryKey: ["subjects"], queryFn: () => getSubjects().then((r) => r.data) });
  const { data: studentsData, isLoading: lst } = useQuery({ queryKey: ["students"], queryFn: () => getStudents().then((r) => r.data) });
  const { data: teachersData, isLoading: lt } = useQuery({ queryKey: ["teachers"], queryFn: () => getTeachers().then((r) => r.data) });

  if (lu || lc || ls || lst || lt) return <LoadingSpinner />;

  // @ts-ignore
  const users = usersData?.data || [];
  // @ts-ignore
  const classes = classesData?.data || [];
  // @ts-ignore
  const subjects = subjectsData?.data || [];
  // @ts-ignore
  const students = studentsData?.data || [];
  // @ts-ignore
  const teachers = teachersData?.data || [];

  const stats = [
    { label: "Total Users", value: users?.length || 0, icon: Users, color: "text-primary" },
    { label: "Students", value: students?.length || 0, icon: GraduationCap, color: "text-accent" },
    { label: "Teachers", value: teachers?.length || 0, icon: UserCircle, color: "text-warning" },
    { label: "Classes", value: classes?.length || 0, icon: School, color: "text-destructive" },
    { label: "Subjects", value: subjects?.length || 0, icon: BookOpen, color: "text-muted-foreground" },
  ];

  const latestUsers = [...users].slice(-5).reverse();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Admin Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold text-foreground">{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color} opacity-70`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Latest Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><RoleBadge role={u.role} /></TableCell>
                  <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
