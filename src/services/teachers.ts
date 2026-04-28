import api from "./api";
import type { Teacher, TeacherExamMarksheet, TeacherMarkClass, TeacherExamType } from "@/types";

export const getTeachers = () => api.get<Teacher[]>("/teachers");
export const getTeacherSubjects = (teacherId: number) => api.get(`/teachers/${teacherId}/subjects`);
export const getTeacherById = (teacherId: number) => api.get(`/teachers/${teacherId}`);
export const addTeacherAssignment = (
	teacherId: number,
	payload: { class_id: number; subject_id?: number }
) => api.post(`/teachers/${teacherId}/assignments`, payload);

export const getTeacherMarkClasses = (teacherId: number) =>
	api.get<TeacherMarkClass[]>(`/teachers/${teacherId}/mark-classes`);

export const getTeacherExamMarks = (
	teacherId: number,
	params: { class_id: number; exam_type: TeacherExamType }
) => api.get<TeacherExamMarksheet>(`/teachers/${teacherId}/marks`, { params });

export const upsertTeacherExamMarks = (
	teacherId: number,
	payload: {
		class_id: number;
		exam_type: TeacherExamType;
		max_marks: number;
		entries: Array<{
			student_id: number;
			obtained_marks: number | null;
			lab_marks?: number | null;
		}>;
	}
) => api.post(`/teachers/${teacherId}/marks`, payload);

export const getTeacherPerformanceSummary = (teacherId: number, params?: { exam_type?: string }) =>
	api.get(`/teachers/${teacherId}/performance-summary`, { params: params || {} });
