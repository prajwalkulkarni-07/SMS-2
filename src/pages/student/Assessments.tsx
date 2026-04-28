import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { submitAttempt, getStudentAssessments, getAssessmentById, getMyAttempts } from "@/services/assessments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";
import type { Assessment } from "@/types";

export default function StudentAssessments() {
  const qc = useQueryClient();
  const [taking, setTaking] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loadingAssessment, setLoadingAssessment] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["student-assessments"],
    queryFn: () => getStudentAssessments().then((r) => r.data),
  });

  const { data: attemptsData } = useQuery({
    queryKey: ["my-attempts"],
    queryFn: () => getMyAttempts().then((r) => r.data),
  });

  const assessments = (data?.data as any[]) || [];
  const attempts: any[] = attemptsData?.data || [];

  const submitMut = useMutation({
    mutationFn: () => {
      const answerPayload = Object.entries(answers).map(([qid, optIdx]) => {
        const qnum = Number(qid);
        const option = ["A", "B", "C", "D"][Number(optIdx) ?? 0];
        return { question_id: qnum, selected_option: option };
      });
      return submitAttempt({ assessment_id: taking!.id, answers: answerPayload });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-attempts"] }); toast.success("Submitted!"); setTaking(null); },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to submit"),
  });

  const startAssessment = async (a: Assessment) => {
    try {
      setLoadingAssessment(true);
      setAnswers({});
      const res = await getAssessmentById(a.id, { include_questions: true });
      const full = res.data?.data || a;
      const normalizedQuestions = (full.questions || []).map((q: any) => ({
        id: q.id,
        text: q.question_text,
        marks: q.marks,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
      }));
      setTaking({ ...a, ...full, questions: normalizedQuestions });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to load assessment");
    } finally {
      setLoadingAssessment(false);
    }
  };

  const attemptedIds = new Set((attempts || []).map((a: any) => a.assessment_id));

  const { live, upcoming, completed } = useMemo(() => {
    const now = new Date();
    const liveList: any[] = [];
    const upcomingList: any[] = [];
    const completedList: any[] = [];
    for (const a of assessments) {
      if (attemptedIds.has(a.id)) {
        completedList.push(a);
        continue;
      }
      const start = new Date(`${a.scheduled_date}T${a.start_time}`);
      const end = new Date(`${a.scheduled_date}T${a.end_time}`);
      if (now >= start && now <= end) {
        liveList.push(a);
      } else if (start > now) {
        upcomingList.push(a);
      }
    }
    return { live: liveList, upcoming: upcomingList, completed: completedList };
  }, [assessments, attemptedIds]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Assessments</h2>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Live assessments</h3>
        {(live || []).length === 0 ? <EmptyState message="No live assessments right now" /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {live.map((a) => (
              <Card key={a.id}>
                <CardContent className="pt-6 space-y-2">
                  <h4 className="font-semibold text-foreground">{a.title}</h4>
                  <p className="text-sm text-muted-foreground">{a.subject_name || a.subject?.name || `Subject ${a.subject_id}`}</p>
                  <p className="text-sm text-muted-foreground">Ends at {a.end_time?.slice(0,5)}</p>
                  <Button className="mt-2" size="sm" onClick={() => startAssessment(a)}>Take Assessment</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Upcoming assessments</h3>
        {(upcoming || []).length === 0 ? <EmptyState message="No upcoming assessments" /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcoming.map((a) => (
              <Card key={a.id}>
                <CardContent className="pt-6 space-y-2">
                  <h4 className="font-semibold text-foreground">{a.title}</h4>
                  <p className="text-sm text-muted-foreground">{a.subject_name || a.subject?.name || `Subject ${a.subject_id}`}</p>
                  <p className="text-sm text-muted-foreground">{a.scheduled_date} {a.start_time?.slice(0,5)} - {a.end_time?.slice(0,5)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Completed assessments</h3>
        {(completed || []).length === 0 ? <EmptyState message="No completed assessments" /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {completed.map((a) => {
              const completedDate = new Date(`${a.scheduled_date}T${a.end_time}`);
              const formattedCompleted = completedDate.toString() === "Invalid Date"
                ? `${a.scheduled_date} ${a.end_time?.slice(0,5) ?? ""}`
                : completedDate.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
              return (
                <Card key={a.id}>
                  <CardContent className="pt-6 space-y-2">
                    <h4 className="font-semibold text-foreground">{a.title}</h4>
                    <p className="text-sm text-muted-foreground">{a.subject_name || a.subject?.name || `Subject ${a.subject_id}`}</p>
                    <p className="text-sm text-muted-foreground">Completed: {formattedCompleted}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={!!taking} onOpenChange={(o) => !o && setTaking(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="assessment-desc">
          <p id="assessment-desc" className="sr-only">Answer all questions and submit to complete the assessment.</p>
          <DialogHeader><DialogTitle>{taking?.title}</DialogTitle></DialogHeader>
          {loadingAssessment ? <LoadingSpinner /> : taking?.questions?.length ? (
            <div className="space-y-6">
              {taking.questions.map((q, qi) => (
                <Card key={q.id || qi} className="p-4">
                  <p className="font-medium mb-3">Q{qi + 1}. {q.text} <span className="text-sm text-muted-foreground">({q.marks} marks)</span></p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <label key={oi} className={`flex items-center gap-3 p-2 rounded-md cursor-pointer border transition-colors ${answers[q.id ?? qi] === oi ? "bg-primary/10 border-primary" : "hover:bg-muted"}`}>
                        <input type="radio" name={`q-${q.id ?? qi}`} checked={answers[q.id ?? qi] === oi} onChange={() => setAnswers((p) => ({ ...p, [q.id ?? qi]: oi }))} />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </Card>
              ))}
              <Button className="w-full" onClick={() => submitMut.mutate()} disabled={submitMut.isPending}>Submit Assessment</Button>
            </div>
          ) : <EmptyState message="No questions in this assessment" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
