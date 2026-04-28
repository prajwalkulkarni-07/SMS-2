import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClasses, createClass, updateClass, deleteClass } from "@/services/classes";
import { getUsers } from "@/services/users";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Class } from "@/types";

const CLASS_NUMBERS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const SECTIONS = ["A", "B", "C", "D", "E", "F"];

export default function ClassesPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [form, setForm] = useState({ class_number: "", section: "", class_teacher_id: "" });

  const { data: classesData, isLoading } = useQuery({ queryKey: ["classes"], queryFn: () => getClasses().then((r) => r.data) });
  const { data: teachersData } = useQuery({ queryKey: ["users", "teacher"], queryFn: () => getUsers({ role: "teacher" }).then((r) => r.data) });
  
  // @ts-ignore
  const classes = classesData?.data || [];
  // @ts-ignore
  const teachers = teachersData?.data || [];

  const saveMut = useMutation({
    mutationFn: () => {
      const classTeacherId =
        !form.class_teacher_id || form.class_teacher_id === "none"
          ? undefined
          : Number(form.class_teacher_id);
      const payload = {
        class_number: form.class_number,
        section: form.section,
        class_teacher_id: classTeacherId,
      };
      return editing ? updateClass(editing.id, payload) : createClass(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["classes"] }); toast.success(editing ? "Updated" : "Created"); setDialogOpen(false); setEditing(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["classes"] }); toast.success("Deleted"); },
  });

  const openCreate = () => { setEditing(null); setForm({ class_number: "", section: "", class_teacher_id: "" }); setDialogOpen(true); };
  const openEdit = (c: Class) => { 
    // Use standard/section if available, otherwise parse from name
    const class_number = c.standard?.toString() || c.name.split('-')[0] || "";
    const section = c.section || c.name.split('-')[1] || "";
    setEditing(c); 
    setForm({ class_number, section, class_teacher_id: c.class_teacher_id?.toString() || "" }); 
    setDialogOpen(true); 
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Classes</h2>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Class</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {(classes || []).length === 0 ? <EmptyState message="No classes found" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class Teacher</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(classes || []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.id}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.class_teacher_name || "Not assigned"}</TableCell>
                    <TableCell>{c.student_count || 0}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Delete class?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMut.mutate(c.id)}>Delete</AlertDialogAction></AlertDialogFooter>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Class" : "Create Class"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Class Number</Label>
              <Select value={form.class_number} onValueChange={(v) => setForm((p) => ({ ...p, class_number: v }))}>
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
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={form.section} onValueChange={(v) => setForm((p) => ({ ...p, section: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((sec) => (
                    <SelectItem key={sec} value={sec}>
                      Section {sec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class Teacher (Optional)</Label>
              <Select value={form.class_teacher_id} onValueChange={(v) => setForm((p) => ({ ...p, class_teacher_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {teachers.map((teacher: any) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={saveMut.isPending || !form.class_number || !form.section}>
              {editing ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
