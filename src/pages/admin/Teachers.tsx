import { useQuery } from "@tanstack/react-query";
import { getTeachers } from "@/services/teachers";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function TeachersPage() {
  const navigate = useNavigate();
  const { data: teachersData, isLoading } = useQuery({ queryKey: ["teachers"], queryFn: () => getTeachers().then((r) => r.data) });
  // @ts-ignore
  const teachers = teachersData?.data || [];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Teachers</h2>
      <Card>
        <CardContent className="p-0">
          {(teachers || []).length === 0 ? <EmptyState message="No teachers found" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(teachers || []).map((t) => (
                <TableRow key={t.id} className="cursor-pointer" onClick={() => navigate(`/admin/teachers/${t.id}`)}>
                  <TableCell className="font-medium">{t.name || t.user?.name || "—"}</TableCell>
                  <TableCell>{t.email || t.user?.email || "—"}</TableCell>
                  <TableCell>{t.qualification || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/admin/teachers/${t.id}`); }}>View</Button>
                  </TableCell>
                </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
