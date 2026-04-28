import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAssessments, createAssessment, deleteAssessment, updateAssessment } from "@/services/assessments";
import { getTeacherById } from "@/services/teachers";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Question } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

type QuestionDraft = { question_text: string; options: string[]; correct_option: number; marks: number };
const BLANK_QUESTION = (): QuestionDraft => ({ question_text: "", options: ["", "", "", ""], correct_option: 0, marks: 1 });

export default function TeacherAssessments() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", scheduled_date: "", start_time: "", end_time: "", class_ids: [] as number[] });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<{ id: number | null; scheduled_date: string; start_time: string; end_time: string; title?: string }>({ id: null, scheduled_date: "", start_time: "", end_time: "", title: "" });
  const [questions, setQuestions] = useState(() => Array.from({ length: 10 }, BLANK_QUESTION));

  const { data: assessmentsData, isLoading } = useQuery({
    queryKey: ["assessments", user?.id],
    enabled: !!user?.id,
    queryFn: () => getAssessments({ created_by: user?.id }).then((r) => r.data),
  });
  const { data: teacherData } = useQuery({
    queryKey: ["teacher", user?.id],
    queryFn: () => getTeacherById(user!.id).then((r) => r.data),
    enabled: !!user?.id,
  });

  // @ts-ignore
  const assessments = assessmentsData?.data || [];
  // @ts-ignore
  const teacher = teacherData?.data;

  const assignments = teacher?.assignments || [];
  const subjectId = assignments.length > 0 ? assignments[0].subject_id : undefined;
  const subjectName = assignments.length > 0 ? assignments[0].subject_name : "";
  const classes = useMemo(() => {
    const seen = new Set<number>();
    return assignments.filter((a: any) => {
      if (seen.has(a.class_id)) return false;
      seen.add(a.class_id);
      return true;
    }).map((a: any) => ({ id: a.class_id, label: `${a.standard || ""}${a.standard && a.section ? "-" : ""}${a.section || ""}` }));
  }, [assignments]);

  const createMut = useMutation({
    mutationFn: () => {
      const payloadQuestions: Question[] = questions.map((q) => ({
        question_text: q.question_text || "",
        option_a: (q.options || [])[0] || "",
        option_b: (q.options || [])[1] || "",
        option_c: (q.options || [])[2] || "",
        option_d: (q.options || [])[3] || "",
        correct_option: ["A", "B", "C", "D"][q.correct_option || 0] as Question["correct_option"],
        marks: Math.max(0, Number(q.marks) || 0),
      }));

      return createAssessment({
        title: form.title,
        scheduled_date: form.scheduled_date,
        start_time: form.start_time,
        end_time: form.end_time,
        class_ids: form.class_ids,
        questions: payloadQuestions,
        subject_id: subjectId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      toast.success("Assessment created");
      setDialogOpen(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed"),
  });

  const updateQuestion = (idx: number, field: string, value: any) => {
    setQuestions((p) => p.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setQuestions((p) => p.map((q, i) => i === qIdx ? { ...q, options: (q.options || []).map((o, j) => j === oIdx ? value : o) } : q));
  };

  const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteAssessment(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assessments"] }); toast.success("Assessment deleted"); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Delete failed"),
  });

  const updateMut = useMutation({
    mutationFn: () => updateAssessment(editForm.id!, {
      scheduled_date: editForm.scheduled_date,
      start_time: editForm.start_time,
      end_time: editForm.end_time,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assessments"] });
      toast.success("Schedule updated");
      setEditDialogOpen(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Update failed"),
  });

  const formatSchedule = (dateStr?: string, start?: string, end?: string) => {
    if (!dateStr) return "—";
    const datePart = dateStr.split("T")[0];
    const [y, m, d] = datePart.split("-");
    const s = (start || "").slice(0, 5);
    const e = (end || "").slice(0, 5);
    return `${d}/${m}/${y}, ${s}-${e}`;
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Assessments</h2>
        <Button onClick={() => { setForm({ title: "", scheduled_date: "", start_time: "", end_time: "", class_ids: [] }); setQuestions(Array.from({ length: 10 }, BLANK_QUESTION)); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Create Assessment
        </Button>
      </div>

      {(assessments || []).length === 0 ? <EmptyState message="No assessments" /> : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(assessments || []).map((a) => {
                  const now = new Date();
                  const datePart = a.scheduled_date?.split("T")[0] || a.scheduled_date;
                  const startTs = datePart && a.start_time ? new Date(`${datePart}T${a.start_time}`) : null;
                  const endTs = datePart && a.end_time ? new Date(`${datePart}T${a.end_time}`) : null;
                  
                  // Check if 15 mins before start time
                  const fifteenMinsBeforeStart = startTs ? new Date(startTs.getTime() - 15 * 60 * 1000) : null;
                  const canEdit = !fifteenMinsBeforeStart || now < fifteenMinsBeforeStart;
                  
                  // Check if assessment has ended
                  const hasEnded = endTs ? now >= endTs : false;
                  
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell>{a.subject?.name || subjectName || a.subject_id}</TableCell>
                      <TableCell>{(a.class_labels || a.class_ids || []).join(", ")}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between gap-2">
                          <span>{formatSchedule(a.scheduled_date, a.start_time, a.end_time)}</span>
                          {canEdit && (
                            <Button variant="ghost" size="icon" onClick={() => {
                              setEditForm({
                                id: a.id,
                                scheduled_date: a.scheduled_date?.slice(0, 10) || "",
                                start_time: a.start_time?.slice(0, 5) || "",
                                end_time: a.end_time?.slice(0, 5) || "",
                                title: a.title,
                              });
                              setEditDialogOpen(true);
                            }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {hasEnded ? (
                            <Button size="sm" variant="secondary" onClick={() => navigate(`/teacher/performance/${a.id}`)}>View Performance</Button>
                          ) : (
                            <Button size="sm" variant="destructive" onClick={() => {
                              const ok = window.confirm("Delete this assessment? This action cannot be undone.");
                              if (ok) deleteMut.mutate(a.id);
                            }}>
                              <Trash2 className="h-4 w-4 mr-1" /> Delete Assessment
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Assessment</DialogTitle></DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!subjectId) {
                toast.error("No subject assigned to this teacher");
                return;
              }
              if (form.class_ids.length === 0) {
                toast.error("Select at least one class");
                return;
              }
              createMut.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Subject</Label><Input value={subjectName || ""} disabled /></div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.scheduled_date} onChange={(e) => setForm((p) => ({ ...p, scheduled_date: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={form.start_time} onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} /></div>
              <div className="space-y-2"><Label>End Time</Label><Input type="time" value={form.end_time} onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} /></div>
            </div>

            <div className="space-y-3">
              <Label>Target Classes (select at least one)</Label>
              <div className="grid grid-cols-2 gap-2">
                {classes.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 rounded-md border p-2">
                    <Checkbox checked={form.class_ids.includes(c.id)} onCheckedChange={(checked) => {
                      setForm((p) => {
                        const next = checked ? [...p.class_ids, c.id] : p.class_ids.filter((id) => id !== c.id);
                        return { ...p, class_ids: next };
                      });
                    }} />
                    <span>{c.label || `Class ${c.id}`}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((q, qi) => (
                <Card key={qi} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Q{qi + 1}</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Marks</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className="w-24 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        placeholder="Marks"
                        value={q.marks}
                        onChange={(e) => updateQuestion(qi, "marks", Math.max(0, Number(e.target.value) || 0))}
                      />
                    </div>
                  </div>
                  <Input placeholder="Question text" value={q.question_text} onChange={(e) => updateQuestion(qi, "question_text", e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    {(q.options || []).map((o, oi) => (
                      <label key={oi} className="flex items-center gap-2 rounded border p-2">
                        <input type="radio" name={`q${qi}`} checked={q.correct_option === oi} onChange={() => updateQuestion(qi, "correct_option", oi)} />
                        <Input placeholder={`Option ${oi + 1}`} value={o} onChange={(e) => updateOption(qi, oi, e.target.value)} />
                      </label>
                    ))}
                  </div>
                </Card>
              ))}
              <div className="flex justify-end text-sm text-muted-foreground pr-1">Total marks: <span className="ml-1 font-semibold text-foreground">{totalMarks}</span></div>
            </div>

            <Button type="submit" className="w-full">Create Assessment</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Schedule{editForm.title ? ` – ${editForm.title}` : ""}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={editForm.scheduled_date} onChange={(e) => setEditForm((p) => ({ ...p, scheduled_date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={editForm.start_time} onChange={(e) => setEditForm((p) => ({ ...p, start_time: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" value={editForm.end_time} onChange={(e) => setEditForm((p) => ({ ...p, end_time: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!editForm.id) return;
              if (!editForm.scheduled_date || !editForm.start_time || !editForm.end_time) {
                toast.error("Date and times are required");
                return;
              }
              updateMut.mutate();
            }}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
