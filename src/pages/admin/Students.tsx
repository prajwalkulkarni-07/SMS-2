import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllStudentClasses, enrollStudent, removeEnrollment } from "@/services/studentClasses";
import { getUsers } from "@/services/users";
import { getSectionsByClassNumber } from "@/services/classes";
import { getCurrentAcademicYear } from "@/lib/academicYear";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const CLASS_NUMBERS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function StudentsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ student_id: "", class_number: "", section: "", class_id: "", academic_year: getCurrentAcademicYear() });

  const { data: enrollmentsData, isLoading } = useQuery({ 
    queryKey: ["student-classes"], 
    queryFn: () => getAllStudentClasses().then((r) => r.data) 
  });

  const { data: usersData } = useQuery({ 
    queryKey: ["users", "student"], 
    queryFn: () => getUsers({ role: "student" }).then((r) => r.data) 
  });

  const { data: sectionsData } = useQuery({
    queryKey: ["sections", form.class_number],
    queryFn: () => getSectionsByClassNumber(form.class_number).then((r) => r.data),
    enabled: !!form.class_number,
  });

  // @ts-ignore
  const enrollments = enrollmentsData?.data || [];
  // @ts-ignore
  const students = usersData?.data || [];
  // @ts-ignore
  const sections = sectionsData?.data || [];

  const enrollMut = useMutation({
    mutationFn: () => enrollStudent({ 
      student_id: Number(form.student_id), 
      class_id: Number(form.class_id), 
      academic_year: form.academic_year 
    }),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["student-classes"] }); 
      toast.success("Student enrolled"); 
      setDialogOpen(false); 
      setForm({ student_id: "", class_number: "", section: "", class_id: "", academic_year: getCurrentAcademicYear() });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to enroll"),
  });

  const removeMut = useMutation({
    mutationFn: removeEnrollment,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["student-classes"] }); toast.success("Removed"); },
  });

  const openEnroll = () => { 
    setForm({ student_id: "", class_number: "", section: "", class_id: "", academic_year: getCurrentAcademicYear() }); 
    setDialogOpen(true); 
  };

  const handleClassNumberChange = (value: string) => {
    setForm((p) => ({ ...p, class_number: value, section: "", class_id: "" }));
  };

  const handleSectionChange = (value: string) => {
    const selectedSection = sections.find((s: any) => s.section === value);
    setForm((p) => ({ ...p, section: value, class_id: selectedSection?.classId || "" }));
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Student Enrollments</h2>
        <Button onClick={openEnroll}><Plus className="mr-2 h-4 w-4" /> Enroll Student</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {(enrollments || []).length === 0 ? <EmptyState message="No student enrollments found" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(enrollments || []).map((enrollment: any) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">{enrollment.student_name}</TableCell>
                    <TableCell>{enrollment.student_email}</TableCell>
                    <TableCell>{enrollment.class_name}</TableCell>
                    <TableCell>{enrollment.academic_year}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove enrollment?</AlertDialogTitle>
                            <AlertDialogDescription>This will remove the student from this class.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeMut.mutate(enrollment.id)}>Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enroll Student</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); enrollMut.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={form.student_id} onValueChange={(v) => setForm((p) => ({ ...p, student_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student: any) => (
                    <SelectItem key={student.id} value={String(student.id)}>
                      {student.name} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Class Number</Label>
              <Select value={form.class_number} onValueChange={handleClassNumberChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class number" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_NUMBERS.map((num) => (
                    <SelectItem key={num} value={num}>
                      Class {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.class_number && (
              <div className="space-y-2">
                <Label>Section</Label>
                <Select value={form.section} onValueChange={handleSectionChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No sections available for Class {form.class_number}</div>
                    ) : (
                      sections.map((sec: any) => (
                        <SelectItem key={sec.section} value={sec.section}>
                          Section {sec.section}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Input 
                type="text" 
                value={form.academic_year} 
                onChange={(e) => setForm((p) => ({ ...p, academic_year: e.target.value }))} 
                placeholder="e.g. 2025-2026"
                required 
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={enrollMut.isPending || !form.student_id || !form.class_id || !form.academic_year}
            >
              Enroll Student
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
