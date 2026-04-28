import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LineChart as LineChartIcon, User } from "lucide-react";

import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { getClassById } from "@/services/classes";
import { getStudentSubjectExams } from "@/services/students";
import { formatIST } from "@/lib/utils";

export default function StudentPerformanceDetail() {
  const { classId, studentId } = useParams();
  const cid = Number(classId);
  const sid = Number(studentId);
  const navigate = useNavigate();

  const { data: classDataResult, isLoading: loadingClass } = useQuery({
    queryKey: ["class-detail", cid],
    enabled: Number.isFinite(cid),
    queryFn: () => getClassById(cid).then((r) => r.data),
  });

  const { data: examsData, isLoading: loadingExams } = useQuery({
    queryKey: ["teacher-student-exams", cid, sid],
    enabled: Number.isFinite(cid) && Number.isFinite(sid),
    queryFn: () => getStudentSubjectExams(sid, undefined, cid).then((r) => r.data),
  });

  // @ts-ignore
  const classData = classDataResult?.data;
  const student = (classData?.students || []).find((s: any) => Number(s.student_id) === sid);
  const allExams: any[] = examsData?.data || [];
  const exams: any[] = useMemo(
    () => allExams.filter((e) => Number(e.class_id) === cid),
    [allExams, cid]
  );

  const computePercent = (exam: any) => {
    const fromApi = Number(exam.percentage);
    if (Number.isFinite(fromApi)) return fromApi;
    const score = Number(exam.effective_obtained_marks ?? exam.obtained_marks ?? 0);
    const total = Number(exam.max_marks ?? 0);
    if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0) return null;
    return Math.round((score / total) * 100);
  };

  const chartData = useMemo(() => {
    return [...exams]
      .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
      .map((a, idx) => ({
        idx: idx + 1,
        label: new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "short", day: "2-digit" }).format(new Date(a.exam_date)),
        rawDate: a.exam_date,
        score: Number(a.effective_obtained_marks ?? a.obtained_marks ?? 0),
        examType: a.exam_type,
        subjectName: a.subject_name,
        total: Number(a.max_marks || 0) || undefined,
        percent: computePercent(a),
      }));
  }, [exams]);

  const averagePercent = useMemo(() => {
    const validPercents = exams
      .map((a) => computePercent(a))
      .filter((p) => p != null && !Number.isNaN(p)) as number[];
    if (!validPercents.length) return null;
    const sum = validPercents.reduce((s, v) => s + v, 0);
    return Math.round((sum / validPercents.length) * 10) / 10;
  }, [exams]);

  const recentExam = useMemo(() => {
    if (exams.length === 0) return null;
    return [...exams].sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime())[0];
  }, [exams]);

  const subjectCount = useMemo(() => {
    const set = new Set(exams.map((e) => String(e.subject_id ?? e.subject_name ?? "")).filter(Boolean));
    return set.size;
  }, [exams]);

  const invalidParams = !Number.isFinite(cid) || !Number.isFinite(sid);

  return (
    <div className="space-y-6">
      {invalidParams ? <EmptyState message="Invalid student or class" /> : loadingClass ? <LoadingSpinner /> : !classData ? <EmptyState message="Class not found" /> : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(`/teacher/classes/${cid}`)}>
              <ArrowLeft className="h-4 w-4" /> Back to class
            </Button>
            <User className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">{student?.name || student?.student_name || "Student"}</h2>
              <p className="text-sm text-muted-foreground">Class {classData.standard}-{classData.section}</p>
              {student?.email && <p className="text-xs text-muted-foreground">{student.email}</p>}
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="text-2xl font-semibold text-foreground">{averagePercent != null ? `${averagePercent}%` : "-"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Across {exams.length} exam{exams.length === 1 ? "" : "s"}</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-sm text-muted-foreground">Recent exam</p>
                  <p className="text-base font-semibold text-foreground">{recentExam?.exam_type || "-"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{recentExam?.exam_date ? formatIST(recentExam.exam_date) : "No records"}</p>
                </div>
                <div className="p-3 rounded-lg border bg-muted/30">
                  <p className="text-sm text-muted-foreground">Subjects covered</p>
                  <p className="text-base font-semibold text-foreground">{subjectCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Across exam records in this class</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-lg">Performance trend</CardTitle>
                <LineChartIcon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                {loadingExams ? <LoadingSpinner /> : chartData.length === 0 ? <EmptyState message="No exams yet" /> : (
                  <ChartContainer
                    config={{ score: { label: "Score", color: "hsl(var(--primary))" } }}
                    className="h-72"
                  >
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                      <ChartTooltip
                        cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
                        content={({ payload }) => {
                          if (!payload || payload.length === 0) return null;
                          const p = payload[0]?.payload;
                          return (
                            <div className="rounded-md border bg-background p-2 text-xs shadow-sm space-y-1">
                              <div className="font-medium text-foreground">{p?.examType || "Exam"}</div>
                              <div className="text-muted-foreground">{p?.subjectName || "Subject"}</div>
                              <div className="text-muted-foreground">{p?.label}</div>
                              <div className="text-foreground font-semibold">{p?.percent != null ? `${p.percent}%` : "-"}</div>
                            </div>
                          );
                        }}
                      />
                      <Line type="monotone" dataKey="percent" stroke="var(--color-score)" strokeWidth={2} dot connectNulls />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Exams</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[420px] overflow-y-auto">
                {loadingExams ? <LoadingSpinner /> : exams.length === 0 ? <EmptyState message="No exams" /> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exams.map((exam) => (
                        <TableRow key={`${exam.marksheet_id}-${exam.exam_type}-${exam.subject_id}`}>
                          <TableCell className="font-medium">{exam.exam_type}</TableCell>
                          <TableCell>{exam.subject_name || `Subject ${exam.subject_id}`}</TableCell>
                          <TableCell>{Number(exam.effective_obtained_marks ?? exam.obtained_marks ?? 0)}/{Number(exam.max_marks || 0)}</TableCell>
                          <TableCell>{exam.exam_date ? formatIST(exam.exam_date) : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
