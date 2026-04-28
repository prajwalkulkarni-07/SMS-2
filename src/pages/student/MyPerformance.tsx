import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStudentSubjectExams } from "@/services/students";
import { getStudentSubjects } from "@/services/studentSubjects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { formatIST } from "@/lib/utils";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

export default function MyPerformance() {
  const { user } = useAuth();
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  const { data: examsData, isLoading } = useQuery({
    queryKey: ["my-exams", user?.id],
    enabled: !!user?.id,
    queryFn: () => getStudentSubjectExams(user!.id).then((r) => r.data),
  });

  const { data: subjectsData } = useQuery({
    queryKey: ["my-subjects", user?.id],
    enabled: !!user?.id,
    queryFn: () => getStudentSubjects(user!.id).then((r) => r.data),
  });

  const exams: any[] = examsData?.data || [];

  const optedSubjectIds = useMemo(() => {
    const raw = subjectsData?.data;
    const rows: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.subjects) ? raw.subjects : [];
    return new Set(rows.map((s) => String(s.id ?? "")).filter(Boolean));
  }, [subjectsData]);

  const hasOptedSubjects = optedSubjectIds.size > 0;

  const subjects = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    const source = hasOptedSubjects ? exams.filter((e) => optedSubjectIds.has(String(e.subject_id || e.subject_name || ""))) : exams;
    for (const e of source) {
      const id = String(e.subject_id || e.subject_name || "");
      if (!id) continue;
      const name = e.subject_name || `Subject ${e.subject_id}`;
      if (!map.has(id)) {
        map.set(id, { id, name });
      }
    }
    return Array.from(map.values());
  }, [exams, hasOptedSubjects, optedSubjectIds]);

  const filteredExams = useMemo(() => {
    const base = hasOptedSubjects
      ? exams.filter((e) => optedSubjectIds.has(String(e.subject_id || e.subject_name || "")))
      : exams;
    if (subjectFilter === "all") return base;
    return base.filter((e) => String(e.subject_id || e.subject_name || "") === subjectFilter);
  }, [exams, subjectFilter, optedSubjectIds, hasOptedSubjects]);

  const computePercent = (exam: any) => {
    const fromApi = Number(exam.percentage);
    if (Number.isFinite(fromApi)) return fromApi;
    const score = Number(exam.effective_obtained_marks ?? exam.obtained_marks ?? 0);
    const total = Number(exam.max_marks ?? 0);
    if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0) return null;
    return Math.round((score / total) * 100);
  };

  const subjectAverages = useMemo(() => {
    const agg = new Map<string, { name: string; count: number; percentSum: number }>();
    const source = hasOptedSubjects
      ? exams.filter((e) => optedSubjectIds.has(String(e.subject_id || e.subject_name || "")))
      : exams;
    for (const e of source) {
      const key = String(e.subject_id || e.subject_name || "");
      const name = e.subject_name || `Subject ${e.subject_id}`;
      if (!key) continue;
      const percent = computePercent(e);
      if (percent == null) continue;
      const entry = agg.get(key) || { name, count: 0, percentSum: 0 };
      entry.count += 1;
      entry.percentSum += Number(percent);
      agg.set(key, entry);
    }
    return Array.from(agg.entries()).map(([id, v]) => ({ id, name: v.name, avgPercent: Math.round((v.percentSum / v.count) * 100) / 100, count: v.count }));
  }, [exams, optedSubjectIds, hasOptedSubjects]);

  const radarData = useMemo(
    () => subjectAverages.map((s) => ({ subject: s.name, percentage: Number(s.avgPercent) })),
    [subjectAverages]
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-foreground">My Performance</h2>
        <p className="text-sm text-muted-foreground">Track your exam results and subject-wise averages.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Subject averages</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectAverages.length === 0 ? <EmptyState message="No exam records yet" /> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjectAverages.map((s) => (
                  <div key={s.id} className="p-3 rounded-lg border bg-muted/30">
                    <p className="font-medium text-foreground">{s.name}</p>
                    <p className="text-sm text-muted-foreground">Avg %: {s.avgPercent}%</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Subject radar</CardTitle>
          </CardHeader>
          <CardContent>
            {radarData.length === 0 ? (
              <EmptyState message="No subject averages for radar chart" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip formatter={(value: number) => [`${value}%`, "Average"]} />
                    <Radar dataKey="percentage" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-start">
        <Select value={subjectFilter} onValueChange={setSubjectFilter} disabled={subjects.length === 0}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter by subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exams</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExams.length === 0 ? <EmptyState message="No exams found" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percent</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((e) => (
                  <TableRow key={`${e.marksheet_id}-${e.exam_type}`}>
                    <TableCell className="font-medium">{e.exam_type}</TableCell>
                    <TableCell>{e.subject_name || `Subject ${e.subject_id}`}</TableCell>
                    <TableCell>{Number(e.effective_obtained_marks || 0)} / {Number(e.max_marks || 0)}</TableCell>
                    <TableCell>{computePercent(e) != null ? `${computePercent(e)}%` : "-"}</TableCell>
                    <TableCell>{e.exam_date ? formatIST(e.exam_date) : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
