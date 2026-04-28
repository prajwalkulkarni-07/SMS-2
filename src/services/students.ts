import api from "./api";
import type { Student } from "@/types";

export const getStudents = () => api.get<Student[]>("/students");

export const getStudentSubjectExams = (studentId: number, subjectId?: number, classId?: number) =>
	api.get(`/students/${studentId}/exams`, {
		params: {
			...(subjectId != null ? { subject_id: subjectId } : {}),
			...(classId != null ? { class_id: classId } : {}),
		},
	});
