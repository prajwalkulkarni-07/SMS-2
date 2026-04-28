import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSubjects, createSubject, updateSubject, deleteSubject } from "@/services/subjects";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Subject } from "@/types";

export default function SubjectsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState({ name: "" });

  const { data: subjectsData, isLoading } = useQuery({ queryKey: ["subjects"], queryFn: () => getSubjects().then((r) => r.data) });

  // @ts-ignore
  const subjects = subjectsData?.data || [];

  const saveMut = useMutation({
    mutationFn: () => editing ? updateSubject(editing.id, form) : createSubject(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); toast.success(editing ? "Updated" : "Created"); setDialogOpen(false); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects"] }); toast.success("Deleted"); },
  });

  const openCreate = () => { setEditing(null); setForm({ name: "" }); setDialogOpen(true); };
  const openEdit = (s: Subject) => { setEditing(s); setForm({ name: s.name }); setDialogOpen(true); };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Subjects</h2>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Subject</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {(subjects || []).length === 0 ? <EmptyState message="No subjects found" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(subjects || []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Delete subject?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteMut.mutate(s.id)}>Delete</AlertDialogAction></AlertDialogFooter>
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
          <DialogHeader><DialogTitle>{editing ? "Edit Subject" : "Create Subject"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMut.mutate(); }} className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Mathematics" required /></div>
            <Button type="submit" className="w-full" disabled={saveMut.isPending}>{editing ? "Update" : "Create"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
