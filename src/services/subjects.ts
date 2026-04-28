import api from "./api";
import type { Subject } from "@/types";

export const getSubjects = () => api.get<Subject[]>("/subjects");
export const createSubject = (data: Partial<Subject>) => api.post<Subject>("/subjects", data);
export const updateSubject = (id: number, data: Partial<Subject>) => api.put<Subject>(`/subjects/${id}`, data);
export const deleteSubject = (id: number) => api.delete(`/subjects/${id}`);
