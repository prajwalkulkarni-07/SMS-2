import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { getTeacherPerformanceSummary } from "@/services/teachers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";

type PerformanceBand = "all" | "top" | "high" | "good" | "needs";

export default function StudentsPerformances() {
  const { user } = useAuth();
  const [classFilter, setClassFilter] = useState<string>("all");
  const [performanceFilter, setPerformanceFilter] = useState<PerformanceBand>("all");
  const [examFilter, setExamFilter] = useState<string>("all");

  const { data: summaryData, isLoading } = useQuery({
    queryKey: ["teacher-performance-summary", user?.id, examFilter],
    enabled: !!user?.id,
    queryFn: () => getTeacherPerformanceSummary(user!.id, examFilter === "all" ? {} : { exam_type: examFilter }).then((r) => r.data),
  });

  const classAverages: any[] = summaryData?.data?.class_averages || [];
  const students: any[] = summaryData?.data?.students || [];
  const availableExamTypes: string[] = summaryData?.data?.available_exam_types || [];

  const classes = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    for (const c of classAverages) {
      map.set(String(c.class_id), { id: String(c.class_id), label: c.class_label || `${c.standard}-${c.section}` });
    }
    for (const s of students) {
      const id = String(s.class_id);
      if (!map.has(id)) {
        map.set(id, { id, label: s.class_label || `${s.standard}-${s.section}` });
      }
    }
    return Array.from(map.values());
  }, [classAverages, students]);

  const getBand = (avgPercent?: number | null): PerformanceBand => {
    if (avgPercent == null || Number.isNaN(avgPercent)) return "needs";
    if (avgPercent >= 91) return "top";
    if (avgPercent > 80) return "high";
    if (avgPercent >= 70) return "good";
    return "needs";
  };

  const chartData = useMemo(() => {
    return classAverages.map((c) => ({
      classLabel: c.class_label || `${c.standard}-${c.section}`,
      avgPercent: Number(c.avg_percentage || 0),
      examRecords: Number(c.exam_records || 0),
    }));
  }, [classAverages]);

  const filteredStudents = useMemo(() => {
    let rows = students;

    if (classFilter !== "all") {
      rows = rows.filter((s) => String(s.class_id) === classFilter);
    }

    if (performanceFilter !== "all") {
      rows = rows.filter((s) => getBand(Number(s.avg_percentage)) === performanceFilter);
    }

    return rows;
  }, [students, classFilter, performanceFilter]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Class Performance</CardTitle>
              <CardDescription>
                {examFilter === "all"
                  ? "Average performance of each class across all exams"
                  : `Average performance of each class in ${examFilter}`}
              </CardDescription>
            </div>
            <BarChart3 className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="mb-4 max-w-xs">
              <Select value={examFilter} onValueChange={setExamFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All exams</SelectItem>
                  {availableExamTypes.map((examType) => (
                    <SelectItem key={examType} value={examType}>{examType}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {chartData.length === 0 ? <EmptyState message="No class exam records" /> : (
              <ChartContainer
                config={{ avgPercent: { label: "Average %", color: "hsl(var(--primary))" } }}
                className="h-72"
              >
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="classLabel" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
                  <ChartTooltip
                    cursor={{ fill: "hsl(var(--muted) / 0.25)" }}
                    content={({ payload }) => {
                      if (!payload || payload.length === 0) return null;
                      const p = payload[0]?.payload;
                      return (
                        <div className="rounded-md border bg-background p-2 text-xs shadow-sm space-y-1">
                          <div className="font-medium text-foreground">Class {p?.classLabel}</div>
                          <div className="text-foreground font-semibold">Avg: {p?.avgPercent ?? 0}%</div>
                          <div className="text-muted-foreground">Records: {p?.examRecords ?? 0}</div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="avgPercent" fill="var(--color-avgPercent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>Filter students by class and performance band</CardDescription>
            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={performanceFilter} onValueChange={(v) => setPerformanceFilter(v as PerformanceBand)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by performance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All performances</SelectItem>
                  <SelectItem value="top">Top (91-100%)</SelectItem>
                  <SelectItem value="high">High (81-90%)</SelectItem>
                  <SelectItem value="good">Good (70-80%)</SelectItem>
                  <SelectItem value="needs">Needs improvement (&lt;70%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="max-h-[420px] overflow-y-auto">
            {filteredStudents.length === 0 ? <EmptyState message="No students found" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Avg %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={`${student.class_id}-${student.student_id}`}>
                      <TableCell>
                        <div className="font-medium">{student.student_name}</div>
                        <div className="text-xs text-muted-foreground">{student.email || "-"}</div>
                      </TableCell>
                      <TableCell>{student.class_label || `${student.standard}-${student.section}`}</TableCell>
                      <TableCell>{Number(student.avg_percentage || 0)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
