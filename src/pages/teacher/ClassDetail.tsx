import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, ArrowLeft } from "lucide-react";

import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { getClassById } from "@/services/classes";
import { getTeacherPerformanceSummary } from "@/services/teachers";

type PerformanceBand = "top" | "high" | "good" | "needs" | "no-data";

const PERFORMANCE_STYLES: Record<PerformanceBand, { label: string; badgeClass: string }> = {
  top: { label: "Top performer (≥91%)", badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  high: { label: "High performer (81-90%)", badgeClass: "bg-sky-100 text-sky-800 border-sky-200" },
  good: { label: "Good performer (70-80%)", badgeClass: "bg-amber-100 text-amber-800 border-amber-200" },
  needs: { label: "Needs improvement (<70%)", badgeClass: "bg-rose-100 text-rose-800 border-rose-200" },
  "no-data": { label: "No exam records yet", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" },
};

const categorizePerformance = (avg?: number | null): PerformanceBand => {
  if (avg == null || Number.isNaN(avg)) return "no-data";
  if (avg >= 91) return "top";
  if (avg > 80) return "high";
  if (avg >= 70) return "good";
  return "needs";
};

export default function TeacherClassDetail() {
  const { user } = useAuth();
  const { classId } = useParams();
  const cid = Number(classId);
  const navigate = useNavigate();
  const [performanceFilter, setPerformanceFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["class-detail", cid],
    enabled: Number.isFinite(cid),
    queryFn: () => getClassById(cid).then((r) => r.data),
  });

  const { data: summaryData, isLoading: loadingClassSummary } = useQuery({
    queryKey: ["class-exam-summary", cid, user?.id],
    enabled: Number.isFinite(cid) && !!user?.id,
    queryFn: () => getTeacherPerformanceSummary(user!.id).then((r) => r.data),
  });

  const invalidClass = !Number.isFinite(cid);
  // @ts-ignore
  const classData = data?.data;
  const students = classData?.students || [];
  const classSummaryStudents: any[] = (summaryData?.data?.students || []).filter((s: any) => Number(s.class_id) === cid);

  const performanceByStudent = useMemo(() => {
    const map = new Map<number, { avg: number; attempts: number }>();

    for (const row of classSummaryStudents) {
      const studentId = Number(row.student_id);
      if (!studentId) continue;
      map.set(studentId, {
        avg: Number(row.avg_percentage ?? 0),
        attempts: Number(row.exam_records ?? 0),
      });
    }

    return map;
  }, [classSummaryStudents]);

  const filteredStudents = useMemo(() => {
    let filtered = students;
    
    // Filter by performance
    if (performanceFilter !== "all") {
      filtered = filtered.filter((s: any) => {
        const perf = performanceByStudent.get(Number(s.student_id));
        const band = categorizePerformance(perf?.avg);
        return band === performanceFilter;
      });
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((s: any) => {
        const studentName = (s.name || s.student_name || "").toLowerCase();
        return studentName.includes(searchQuery.toLowerCase());
      });
    }
    
    return filtered;
  }, [students, performanceFilter, searchQuery, performanceByStudent]);

  return (
    <div className="space-y-6">
      {invalidClass ? <EmptyState message="Invalid class" /> : isLoading ? <LoadingSpinner /> : !classData ? <EmptyState message="Class not found" /> : (
        <>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate("/teacher/dashboard")}> <ArrowLeft className="h-4 w-4" /> Dashboard</Button>
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Class {classData.standard}-{classData.section}</h2>
          <p className="text-sm text-muted-foreground">Students: {students.length}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <Input
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">Filter by performance</span>
              <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Filter by performance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  <SelectItem value="top">Top performers (91-100%)</SelectItem>
                  <SelectItem value="high">High performers (81-90%)</SelectItem>
                  <SelectItem value="good">Good performers (70-80%)</SelectItem>
                  <SelectItem value="needs">Needs improvement (&lt;70%)</SelectItem>
                  <SelectItem value="no-data">No attempts yet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <EmptyState message="No students enrolled" />
          ) : loadingClassSummary ? (
            <LoadingSpinner />
          ) : filteredStudents.length === 0 ? (
            <EmptyState message="No students in this category" />
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((s: any) => {
                const perf = performanceByStudent.get(Number(s.student_id));
                const band = categorizePerformance(perf?.avg);
                const badgeStyle = PERFORMANCE_STYLES[band];
                const avgLabel = perf?.avg != null ? `${perf.avg}% avg` : "No exam records yet";
                return (
                  <div
                    key={s.student_id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 bg-muted/30"
                  >
                    <div>
                      <p className="font-medium text-foreground">{s.name || s.student_name}</p>
                      <p className="text-xs text-muted-foreground">{s.email || ""}</p>
                      <p className="text-xs text-muted-foreground mt-1">Exam records: {perf?.attempts ?? 0}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={badgeStyle.badgeClass}>{avgLabel}</Badge>
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/teacher/classes/${cid}/students/${s.student_id}/performance`)}>
                        View performance
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
