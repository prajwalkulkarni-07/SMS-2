import api from "./api";
import type { Class } from "@/types";

export const getClasses = () => api.get<Class[]>("/classes");
export const getSectionsByClassNumber = (classNumber: string) => api.get(`/classes/by-class-number/${classNumber}`);
export const getClassById = (id: number) => api.get(`/classes/${id}`);
export const createClass = (data: Partial<Class>) => api.post<Class>("/classes", data);
export const updateClass = (id: number, data: Partial<Class>) => api.put<Class>(`/classes/${id}`, data);
export const deleteClass = (id: number) => api.delete(`/classes/${id}`);
