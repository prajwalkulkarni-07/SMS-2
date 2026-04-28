import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTeacherById, addTeacherAssignment } from "@/services/teachers";
import { getClasses } from "@/services/classes";
import { updateUser, deleteUser, resetUserPassword } from "@/services/users";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Users, BookOpen, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function TeacherDetailPage() {
  const { teacherId } = useParams();
  const tid = Number(teacherId);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["teacher-detail", tid],
    enabled: Number.isFinite(tid),
    queryFn: () => getTeacherById(tid).then((r) => r.data),
  });

  const { data: classesData } = useQuery({ queryKey: ["classes"], queryFn: () => getClasses().then((r) => r.data) });

  const teacher = (data?.data as any) || null;
  const assignments = (teacher?.assignments as any[]) || [];
  const classes = (classesData?.data as any[]) || [];

  const inferredSubjectId = assignments.length > 0
    ? Array.from(new Set(assignments.map((a: any) => a.subject_id).filter(Boolean)))[0] ?? null
    : null;

  const subjectId = teacher?.subject_id ?? inferredSubjectId;

  const addMut = useMutation({
    mutationFn: () => addTeacherAssignment(tid, { class_id: Number(selectedClass), subject_id: subjectId ? Number(subjectId) : undefined }),
    onSuccess: () => {
      toast.success("Assignment added");
      qc.invalidateQueries({ queryKey: ["teacher-detail", tid] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to add assignment"),
  });

  const updateMut = useMutation({
    mutationFn: (payload: { name: string; email: string; phone: string }) => updateUser(tid, payload),
    onSuccess: () => {
      toast.success("Teacher updated");
      qc.invalidateQueries({ queryKey: ["teacher-detail", tid] });
      setEditDialogOpen(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to update teacher"),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteUser(tid),
    onSuccess: () => {
      toast.success("Teacher deleted");
      qc.invalidateQueries({ queryKey: ["teacher-detail", tid] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to delete teacher"),
  });

  const resetPasswordMut = useMutation({
    mutationFn: () => resetUserPassword(tid),
    onSuccess: () => {
      toast.success("Password reset to Password@123. User must change password on next login.");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to reset password"),
  });

  if (!Number.isFinite(tid)) return <EmptyState message="Invalid teacher" />;
  if (isLoading) return <LoadingSpinner />;

  if (!teacher) return <EmptyState message="Teacher not found" />;

  const canSubmit = selectedClass && subjectId;

  const subjectNameFromAssignments = subjectId
    ? assignments.find((a: any) => a.subject_id === subjectId)?.subject_name || null
    : null;

  const subjectName = teacher?.subject_name
    || subjectNameFromAssignments
    || "No subject assigned";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/admin/users")}> <ArrowLeft className="h-4 w-4" /> Users</Button>
        <Users className="h-7 w-7 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">{teacher.name}</h2>
          <p className="text-sm text-muted-foreground">{teacher.email}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => { setEditForm({ name: teacher.name || "", email: teacher.email || "", phone: teacher.phone || "" }); setEditDialogOpen(true); }}>
            Edit
          </Button>
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete teacher?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone and will remove the teacher account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}>Delete</AlertDialogAction>
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
            <p className="font-medium">{teacher.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{teacher.email}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium">{teacher.phone || "Not provided"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Subject</p>
            <p className="font-medium">{subjectName}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Classes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assignments.length === 0 ? (
            <EmptyState message="No classes yet" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {assignments.map((a: any) => (
                <div key={a.id} className="rounded-md border p-3 bg-muted/30 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{a.subject_name}</p>
                    <p className="text-xs text-muted-foreground">Class {a.standard}-{a.section}</p>
                  </div>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-3 mt-2 space-y-3">
            <p className="text-sm font-semibold text-foreground">Add class</p>
            <div className="space-y-1">
              <Label>Class</Label>
              <Select value={selectedClass || undefined} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name || `${c.standard}-${c.section}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Subject: {subjectName}</p>
            <Button onClick={() => addMut.mutate()} disabled={!canSubmit || addMut.isPending}>Assign</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit teacher</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input required value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input required type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input
                type="tel"
                required
                value={editForm.phone}
                onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const trimmedPhone = editForm.phone.trim();
                if (!trimmedPhone) {
                  toast.error("Phone number is required");
                  return;
                }
                updateMut.mutate({ ...editForm, phone: trimmedPhone });
              }}
              disabled={updateMut.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
