import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { getTeacherExamMarks, getTeacherMarkClasses, upsertTeacherExamMarks } from "@/services/teachers";
import type { TeacherExamType } from "@/types";

const EXAM_OPTIONS: TeacherExamType[] = [
  "Periodic Test 1",
  "Periodic Test 2",
  "Mid Term Exam",
  "Periodic Test 3",
  "Periodic Test 4",
  "End Term Exam",
];

type MarkRow = {
  obtained_marks: string;
  lab_marks: string;
};

export default function UploadMarks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedExamType, setSelectedExamType] = useState<TeacherExamType | "">("");
  const [maxMarks, setMaxMarks] = useState<string>("");
  const [marksByStudent, setMarksByStudent] = useState<Record<number, MarkRow>>({});

  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ["teacher-mark-classes", user?.id],
    enabled: !!user?.id,
    queryFn: () => getTeacherMarkClasses(user!.id).then((r) => r.data),
  });

  const numericClassId = selectedClassId ? Number(selectedClassId) : null;

  const { data: marksheetData, isLoading: loadingMarksheet } = useQuery({
    queryKey: ["teacher-exam-marks", user?.id, numericClassId, selectedExamType],
    enabled: !!user?.id && !!numericClassId && !!selectedExamType,
    queryFn: () =>
      getTeacherExamMarks(user!.id, {
        class_id: numericClassId!,
        exam_type: selectedExamType as TeacherExamType,
      }).then((r) => r.data),
  });

  // @ts-ignore
  const classRows = classesData?.data || [];
  // @ts-ignore
  const marksheet = marksheetData?.data;
  const students = marksheet?.students || [];

  const isEndTerm = selectedExamType === "End Term Exam";

  useEffect(() => {
    if (!marksheet) return;

    setMaxMarks(marksheet.max_marks != null ? String(marksheet.max_marks) : "");

    const initialMap: Record<number, MarkRow> = {};
    for (const s of marksheet.students || []) {
      initialMap[s.student_id] = {
        obtained_marks: s.obtained_marks == null ? "" : String(s.obtained_marks),
        lab_marks: s.lab_marks == null ? "" : String(s.lab_marks),
      };
    }
    setMarksByStudent(initialMap);
  }, [marksheet]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !numericClassId || !selectedExamType) return;
      const numericMaxMarks = Number(maxMarks);

      return upsertTeacherExamMarks(user.id, {
        class_id: numericClassId,
        exam_type: selectedExamType,
        max_marks: numericMaxMarks,
        entries: students.map((s: any) => {
          const row = marksByStudent[s.student_id] || { obtained_marks: "", lab_marks: "" };
          const obtained = row.obtained_marks.trim() === "" ? null : Number(row.obtained_marks);
          const lab = row.lab_marks.trim() === "" ? null : Number(row.lab_marks);
          return {
            student_id: s.student_id,
            obtained_marks: obtained,
            lab_marks: isEndTerm ? lab : null,
          };
        }),
      });
    },
    onSuccess: () => {
      toast.success("Marks uploaded successfully");
      qc.invalidateQueries({ queryKey: ["teacher-exam-marks", user?.id, numericClassId, selectedExamType] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to upload marks");
    },
  });

  const hasClassExamSelection = !!numericClassId && !!selectedExamType;

  const totalFilled = useMemo(() => {
    return students.reduce((count: number, s: any) => {
      const value = marksByStudent[s.student_id]?.obtained_marks?.trim();
      return value ? count + 1 : count;
    }, 0);
  }, [students, marksByStudent]);

  const handleScoreChange = (studentId: number, field: "obtained_marks" | "lab_marks", value: string) => {
    setMarksByStudent((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { obtained_marks: "", lab_marks: "" }),
        [field]: value,
      },
    }));
  };

  const validateBeforeSave = () => {
    const numericMaxMarks = Number(maxMarks);
    if (!Number.isFinite(numericMaxMarks) || numericMaxMarks <= 0) {
      toast.error("Enter a valid max marks value");
      return false;
    }

    for (const s of students) {
      const row = marksByStudent[s.student_id] || { obtained_marks: "", lab_marks: "" };
      if (row.obtained_marks.trim() !== "") {
        const value = Number(row.obtained_marks);
        if (!Number.isFinite(value) || value < 0 || value > numericMaxMarks) {
          toast.error(`Invalid marks for ${s.student_name}`);
          return false;
        }
      }

      if (isEndTerm && row.lab_marks.trim() !== "") {
        const labValue = Number(row.lab_marks);
        if (!Number.isFinite(labValue) || labValue < 0) {
          toast.error(`Invalid lab marks for ${s.student_name}`);
          return false;
        }
      }
    }

    return true;
  };

  if (loadingClasses) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">Upload Marks</h2>
        <p className="text-sm text-muted-foreground">Select class and exam, then enter marks for each student.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exam Selection</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classRows.map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.class_label || `Class ${c.id}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Exam Type</Label>
            <Select value={selectedExamType} onValueChange={(v) => setSelectedExamType(v as TeacherExamType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select exam type" />
              </SelectTrigger>
              <SelectContent>
                {EXAM_OPTIONS.map((exam) => (
                  <SelectItem key={exam} value={exam}>{exam}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Max Marks</Label>
            <Input
              type="number"
              min={1}
              step="1"
              placeholder="Enter max marks"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              disabled={!hasClassExamSelection}
            />
          </div>
        </CardContent>
      </Card>

      {!hasClassExamSelection ? (
        <EmptyState message="Select class and exam type to start entering marks" />
      ) : loadingMarksheet ? (
        <LoadingSpinner />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-lg">Student Marks</CardTitle>
              <p className="text-sm text-muted-foreground">Filled: {totalFilled}/{students.length}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {students.length === 0 ? (
              <EmptyState message="No students found for this class" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Obtained Marks</TableHead>
                    {isEndTerm && <TableHead>Lab Marks</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s: any) => {
                    const row = marksByStudent[s.student_id] || { obtained_marks: "", lab_marks: "" };
                    return (
                      <TableRow key={s.student_id}>
                        <TableCell className="font-medium">{s.student_name}</TableCell>
                        <TableCell>{s.email || "-"}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            value={row.obtained_marks}
                            onChange={(e) => handleScoreChange(s.student_id, "obtained_marks", e.target.value)}
                            placeholder="Enter marks"
                            className="max-w-[160px]"
                          />
                        </TableCell>
                        {isEndTerm && (
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              step="1"
                              value={row.lab_marks}
                              onChange={(e) => handleScoreChange(s.student_id, "lab_marks", e.target.value)}
                              placeholder="Lab marks"
                              className="max-w-[160px]"
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  if (!validateBeforeSave()) return;
                  saveMutation.mutate();
                }}
                disabled={saveMutation.isPending || students.length === 0}
              >
                {saveMutation.isPending ? "Saving..." : "Save Marks"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
