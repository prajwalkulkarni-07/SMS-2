import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { getAssessments, getAttempts, getAttemptReview } from "@/services/assessments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { formatIST } from "@/lib/utils";

export default function AssessmentPerformance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const [classFilter, setClassFilter] = useState<string>("all");
  const [performanceFilter, setPerformanceFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);

  const numericAssessmentId = assessmentId ? Number(assessmentId) : null;

  const { data: assessmentsData, isLoading: loadingAssessments } = useQuery({
    queryKey: ["teacher-assessments", user?.id],
    enabled: !!user?.id,
    queryFn: () => getAssessments({ created_by: user?.id }).then((r) => r.data),
  });

  const assessments: any[] = assessmentsData?.data || [];

  const isAssessmentEnded = (a: any) => {
    const now = Date.now();
    const datePart = a.scheduled_date ? String(a.scheduled_date).split("T")[0] : a.date ? String(a.date).split("T")[0] : null;
    const timePart = a.end_time || a.end || "23:59:59";
    if (datePart) {
      const endTs = new Date(`${datePart}T${timePart}`).getTime();
      if (Number.isFinite(endTs)) return endTs <= now;
    }
    const legacyEndTs = a.end_at ? new Date(a.end_at).getTime() : a.endDate ? new Date(a.endDate).getTime() : null;
    if (legacyEndTs && Number.isFinite(legacyEndTs)) return legacyEndTs <= now;
    return false;
  };

  const selectedAssessment = useMemo(
    () => assessments.find((a) => Number(a.id) === numericAssessmentId),
    [assessments, numericAssessmentId]
  );

  const isEnded = selectedAssessment ? isAssessmentEnded(selectedAssessment) : false;

  const { data: attemptsData, isLoading: loadingAttempts } = useQuery({
    queryKey: ["assessment-attempts", numericAssessmentId],
    enabled: !!numericAssessmentId,
    queryFn: () => getAttempts({ assessment_id: numericAssessmentId }).then((r) => r.data),
  });

  const attempts: any[] = attemptsData?.data || [];

  const { data: reviewData, isLoading: loadingReview } = useQuery({
    queryKey: ["attempt-review", selectedAttemptId],
    enabled: !!selectedAttemptId,
    queryFn: () => getAttemptReview(selectedAttemptId!).then((r) => r.data),
  });

  const classOptions = useMemo(() => {
    const set = new Map<string, string>();
    for (const a of attempts) {
      if (a.class_id) {
        const label = `${a.standard ?? ""}${a.standard && a.section ? "-" : ""}${a.section ?? ""}` || `Class ${a.class_id}`;
        set.set(String(a.class_id), label || `Class ${a.class_id}`);
      }
    }
    return Array.from(set.entries()).map(([id, label]) => ({ id, label }));
  }, [attempts]);

  type PerformanceBand = "top" | "high" | "good" | "needs" | "no-data";

  const categorizePerformance = (percent?: number | null): PerformanceBand => {
    if (percent == null || Number.isNaN(percent)) return "no-data";
    if (percent >= 91) return "top";
    if (percent > 80) return "high";
    if (percent >= 70) return "good";
    return "needs";
  };

  const performanceLabel: Record<PerformanceBand, string> = {
    top: "Top Performers (91-100%)",
    high: "High Performers (81-90%)",
    good: "Good Performers (70-80%)",
    needs: "Needs Improvement (<70%)",
    "no-data": "No Score",
  };

  const filteredAttempts = useMemo(() => {
    const byClass = classFilter === "all" ? attempts : attempts.filter((a) => String(a.class_id) === classFilter);
    const byPerformance = performanceFilter === "all" ? byClass : byClass.filter((a) => {
      const percent = a.total_marks ? (Number(a.score || 0) / Number(a.total_marks || 0)) * 100 : null;
      return categorizePerformance(percent) === performanceFilter;
    });
    if (!searchQuery.trim()) return byPerformance;
    return byPerformance.filter((a) => {
      const studentName = (a.student_name || "").toLowerCase();
      return studentName.includes(searchQuery.toLowerCase());
    });
  }, [attempts, classFilter, performanceFilter, searchQuery]);

  const assessmentClassAverages = useMemo(() => {
    const byAssessmentClass: Record<string, { total: number; totalPossible: number }> = {};

    attempts.forEach((attempt) => {
      if (!attempt.assessment_id || !attempt.class_id || !attempt.total_marks) return;
      const key = `${attempt.assessment_id}-${attempt.class_id}`;
      if (!byAssessmentClass[key]) {
        byAssessmentClass[key] = { total: 0, totalPossible: 0 };
      }
      byAssessmentClass[key].total += Number(attempt.score || 0);
      byAssessmentClass[key].totalPossible += Number(attempt.total_marks || 0);
    });

    return Object.entries(byAssessmentClass).map(([key, { total, totalPossible }]) => {
      const [assessmentIdStr, classIdStr] = key.split("-");
      const assessmentId = Number(assessmentIdStr);
      const classId = Number(classIdStr);
      const assessment = assessments.find((a) => a.id === assessmentId);
      const classInfo = classOptions.find((c) => Number(c.id) === classId);

      return {
        assessmentId,
        classId,
        assessmentName: assessment?.title || `Assessment ${assessmentId}`,
        className: classInfo?.label || `Class ${classId}`,
        average: totalPossible ? (total / totalPossible) * 100 : 0,
      };
    });
  }, [attempts, assessments, classOptions]);

  const bandColors: Record<PerformanceBand, string> = {
    top: "bg-emerald-50 text-emerald-700 border-emerald-200",
    high: "bg-sky-50 text-sky-700 border-sky-200",
    good: "bg-indigo-50 text-indigo-700 border-indigo-200",
    needs: "bg-amber-50 text-amber-700 border-amber-200",
    "no-data": "bg-muted text-muted-foreground border-muted",
  };

  if (loadingAssessments) return <LoadingSpinner />;
  if (!selectedAssessment) return <EmptyState message="Assessment not found" />;
  if (!isEnded) return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => navigate(-1)}>← Back</Button>
      <EmptyState message="This assessment has not ended yet." />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{selectedAssessment.title}</h2>
          <p className="text-sm text-muted-foreground">{selectedAssessment.subject_name || selectedAssessment.subject}</p>
          <p className="text-sm text-muted-foreground">Scheduled: {(selectedAssessment.scheduled_date || selectedAssessment.date)?.toString().slice(0, 10)} | Ends at {selectedAssessment.end_time || selectedAssessment.end || ""}</p>
        </div>
        <Button variant="ghost" onClick={() => navigate(-1)}>← Back</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Class Averages</CardTitle>
            <CardDescription>Average score by class for this assessment</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAttempts ? <LoadingSpinner /> : (
              <div className="aspect-[4/3]">
                <ChartContainer
                  config={{
                    average: { label: "Average %", color: "hsl(var(--chart-1))" },
                  }}
                  className="h-full w-full"
                >
                  <BarChart
                    data={assessmentClassAverages.filter((item) => item.assessmentId === numericAssessmentId)}
                    margin={{ left: 12, right: 12 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="className" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                    <ChartTooltip
                      cursor={false}
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const entry = payload[0];
                        return (
                          <div className="rounded-lg border bg-background p-2 text-sm shadow-sm">
                            <div className="font-medium">{entry.payload.className}</div>
                            <div className="text-muted-foreground">Average: {entry.value?.toFixed(1)}%</div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="average" fill="var(--color-average)" radius={6} />
                  </BarChart>
                </ChartContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filters & Students</CardTitle>
            <CardDescription>Refine by class and performance, then review attempts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by performance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All performance bands</SelectItem>
                  <SelectItem value="top">Top (91-100%)</SelectItem>
                  <SelectItem value="high">High (81-90%)</SelectItem>
                  <SelectItem value="good">Good (70-80%)</SelectItem>
                  <SelectItem value="needs">Needs improvement (&lt;70%)</SelectItem>
                  <SelectItem value="no-data">No score</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />

            <div className="max-h-[420px] overflow-y-auto rounded-md border">
              {loadingAttempts ? (
                <div className="p-4"><LoadingSpinner /></div>
              ) : filteredAttempts.length === 0 ? (
                <div className="p-4"><EmptyState message="No attempts" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttempts.map((a) => (
                      <TableRow key={a.id} className="cursor-pointer" onClick={() => setSelectedAttemptId(a.id)}>
                        <TableCell className="font-medium">{a.student_name || a.student_id}</TableCell>
                        <TableCell>{a.standard ? `${a.standard}${a.section ? "-" + a.section : ""}` : a.class_id || "-"}</TableCell>
                        <TableCell>{a.total_marks ? `${Number(a.score ?? 0)}/${Number(a.total_marks ?? 0)}` : a.score}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={selectedAttemptId != null} onOpenChange={(o) => !o && setSelectedAttemptId(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attempt Review</DialogTitle>
          </DialogHeader>
          {loadingReview ? <LoadingSpinner /> : reviewData?.data ? (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>Student: <span className="font-medium text-foreground">{reviewData.data.student_name || reviewData.data.student_id}</span></span>
                <span>Subject: <span className="font-medium text-foreground">{reviewData.data.subject_name || `Subject ${reviewData.data.subject_id}`}</span></span>
                <span>Score: <span className="font-medium text-foreground">{reviewData.data.score} / {reviewData.data.total_marks}</span></span>
                <span>Submitted: <span className="font-medium text-foreground">{formatIST(reviewData.data.submitted_at)}</span></span>
              </div>

              <div className="space-y-4">
                {(reviewData.data.answers || []).map((ans: any, idx: number) => {
                  const options = [ans.option_a, ans.option_b, ans.option_c, ans.option_d];
                  const letters = ["A", "B", "C", "D"];
                  return (
                    <Card key={ans.id || idx} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-foreground">Q{idx + 1}. {ans.question_text}</p>
                        <Badge variant="secondary">Marks: {ans.marks ?? "-"}</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {options.map((opt: string, oi: number) => {
                          const letter = letters[oi];
                          const isCorrect = ans.correct_option === letter;
                          const isSelected = ans.selected_option === letter;
                          const color = isCorrect ? "border-green-500 bg-green-50 text-green-700" : isSelected && !isCorrect ? "border-red-500 bg-red-50 text-red-700" : "border-muted bg-muted/50";
                          return (
                            <div key={oi} className={`rounded-md border px-3 py-2 text-sm ${color}`}>
                              <span className="font-semibold mr-2">{letter}.</span>{opt}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-sm text-muted-foreground">Correct answer: <span className="font-semibold text-foreground">Option {ans.correct_option}</span></p>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : <EmptyState message="No review data" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
