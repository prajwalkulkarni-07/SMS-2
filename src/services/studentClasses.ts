import api from "./api";

export const getAllStudentClasses = (params?: any) => api.get("/student-classes", { params });
export const enrollStudent = (data: any) => api.post("/student-classes", data);
export const updateEnrollment = (id: number, data: any) => api.put(`/student-classes/${id}`, data);
export const removeEnrollment = (id: number) => api.delete(`/student-classes/${id}`);
export const getStudentsByClass = (classId: number, params?: any) => api.get(`/student-classes/class/${classId}/students`, { params });
export const getClassByStudent = (studentId: number, params?: any) => api.get(`/student-classes/student/${studentId}/class`, { params });
