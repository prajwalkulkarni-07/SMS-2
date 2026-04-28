import api from "./api";

export const getStudentSubjects = (studentId: number, academic_year?: string) =>
  api.get(`/student-subjects/${studentId}`, { params: academic_year ? { academic_year } : {} });

export const setStudentSubjects = (
  studentId: number,
  payload: { academic_year: string; class_id: number; subject_ids: number[] }
) => api.put(`/student-subjects/${studentId}`, payload);
