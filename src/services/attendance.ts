import api from "./api";
import type { Attendance } from "@/types";

export const getAttendance = (params?: Record<string, string>) =>
  api.get<Attendance[]>("/attendance", { params });

export const markAttendance = (data: { student_id: number; subject_id: number; date: string; status: string }) =>
  api.post<Attendance>("/attendance", data);

export const markBulkAttendance = (data: { subject_id: number; date: string; records: { student_id: number; status: string }[] }) =>
  api.post("/attendance/bulk", data);
