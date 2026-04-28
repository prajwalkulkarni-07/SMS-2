import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LineChart as LineChartIcon } from "lucide-react";

import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { getStudentSubjectExams } from "@/services/students";
import { formatIST } from "@/lib/utils";

type PerformanceBand = "top" | "high" | "good" | "needs" | "all";

export default function SubjectPerformance() {
  const { user } = useAuth();
  const { subjectId } = useParams();
  const sid = Number(subjectId);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [performanceFilter, setPerformanceFilter] = useState<PerformanceBand>("all");

  const { data: examsData, isLoading: loadingExams } = useQuery({
    queryKey: ["student-subject-exams", user?.id, sid],
    enabled: !!user?.id && Number.isFinite(sid),
    queryFn: () => getStudentSubjectExams(user!.id, sid).then((r) => r.data),
  });

  const allExams: any[] = examsData?.data || [];

  const subjectName = allExams.length > 0 ? allExams[0].subject_name : "Subject";

  const computePercent = (exam: any) => {
    const fromApi = Number(exam.percentage);
    if (Number.isFinite(fromApi)) return fromApi;

    const score = Number(exam.effective_obtained_marks ?? exam.obtained_marks ?? 0);
    const total = Number(exam.max_marks ?? 0);
    if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0) return null;
    return Math.round((score / total) * 100);
  };

  const categorizePerformance = (percent?: number | null): PerformanceBand => {
    if (percent == null || Number.isNaN(percent)) return "needs";
    if (percent >= 91) return "top";
    if (percent > 80) return "high";
    if (percent >= 70) return "good";
    return "needs";
  };

  // Chart data
  const chartData = useMemo(() => {
    return [...allExams]
      .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
      .map((a, idx) => ({
        idx: idx + 1,
        label: new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "short",
          day: "2-digit"
        }).format(new Date(a.exam_date)),
        rawDate: a.exam_date,
        examType: a.exam_type,
        score: Number(a.effective_obtained_marks ?? a.obtained_marks ?? 0),
        total: Number(a.max_marks || 0) || undefined,
        percent: computePercent(a),
      }));
  }, [allExams]);

  // Calculate average
  const averagePercent = useMemo(() => {
    const validPercents = allExams
      .map((a) => computePercent(a))
      .filter((p) => p != null && !Number.isNaN(p)) as number[];
    if (!validPercents.length) return null;
    const sum = validPercents.reduce((s, v) => s + v, 0);
    return Math.round((sum / validPercents.length) * 10) / 10;
  }, [allExams]);

  // Get most recent exam
  const recentExam = useMemo(() => {
    if (allExams.length === 0) return null;
    return [...allExams].sort((a, b) =>
      new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime()
    )[0];
  }, [allExams]);

  // Filter exams by search and performance
  const filteredExams = useMemo(() => {
    let filtered = allExams;

    // Filter by performance
    if (performanceFilter !== "all") {
      filtered = filtered.filter((exam) => {
        const percent = computePercent(exam);
        return categorizePerformance(percent) === performanceFilter;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((exam) => {
        const examType = String(exam.exam_type || "").toLowerCase();
        return examType.includes(searchQuery.toLowerCase());
      });
    }

    return filtered;
  }, [allExams, performanceFilter, searchQuery]);

  const invalidParams = !Number.isFinite(sid);

  return (
    <div className="space-y-6">
      {invalidParams ? (
        <EmptyState message="Invalid subject" />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/student/dashboard")}>
              <ArrowLeft className="h-4 w-4" /> Back to dashboard
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{subjectName}</h2>
              <p className="text-sm text-muted-foreground">Your performance overview</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="text-2xl font-semibold text-foreground">
                    {averagePercent != null ? `${averagePercent}%` : "-"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across {allExams.length} exam{allExams.length === 1 ? "" : "s"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Recent exam</p>
                  <p className="text-base font-semibold text-foreground">
                    {recentExam?.exam_type || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {recentExam?.exam_date ? formatIST(recentExam.exam_date) : "No records"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Subject focus</p>
                  <p className="text-base font-semibold text-foreground">{subjectName}</p>
                  <p className="text-xs text-muted-foreground mt-1">From your uploaded exam marks</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance Trend Chart */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-lg">Performance trend</CardTitle>
                <LineChartIcon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                {loadingExams ? (
                  <LoadingSpinner />
                ) : chartData.length === 0 ? (
                  <EmptyState message="No exams yet" />
                ) : (
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
                              <div className="text-muted-foreground">{p?.label}</div>
                              <div className="text-foreground font-semibold">
                                {p?.percent != null ? `${p.percent}%` : "-"}
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="percent" 
                        stroke="var(--color-score)" 
                        strokeWidth={2} 
                        dot 
                        connectNulls 
                      />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Exams List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Exams</CardTitle>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                  <Input
                    placeholder="Search exams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-xs"
                  />
                  <Select value={performanceFilter} onValueChange={(v) => setPerformanceFilter(v as PerformanceBand)}>
                    <SelectTrigger className="w-[240px]">
                      <SelectValue placeholder="Filter by performance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All performances</SelectItem>
                      <SelectItem value="top">Top performances (91-100%)</SelectItem>
                      <SelectItem value="high">High performances (81-90%)</SelectItem>
                      <SelectItem value="good">Good performances (70-80%)</SelectItem>
                      <SelectItem value="needs">Needs improvement (&lt;70%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="max-h-[420px] overflow-y-auto">
                {loadingExams ? (
                  <LoadingSpinner />
                ) : filteredExams.length === 0 ? (
                  <EmptyState message="No exams" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExams.map((exam) => (
                        <TableRow key={exam.marksheet_id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            {exam.exam_type}
                          </TableCell>
                          <TableCell>{Number(exam.effective_obtained_marks || 0)}/{Number(exam.max_marks || 0)}</TableCell>
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
