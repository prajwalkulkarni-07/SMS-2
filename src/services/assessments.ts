import api from "./api";
import type { Assessment, Attempt } from "@/types";

export const getAssessments = (params?: Record<string, any>) => api.get<Assessment[]>("/assessments", { params });

export const getStudentAssessments = () => api.get<Assessment[]>("/assessments/my-assessments");

export const createAssessment = (data: Partial<Assessment>) =>
  api.post<Assessment>("/assessments", data);

export const getAssessmentById = (id: number, params?: Record<string, any>) =>
  api.get(`/assessments/${id}`, { params });

export const updateAssessment = (id: number, data: Partial<Assessment>) =>
  api.put(`/assessments/${id}`, data);

export const deleteAssessment = (id: number) =>
  api.delete(`/assessments/${id}`);

export const getAssessmentResults = (id: number) =>
  api.get(`/assessments/${id}/results`);

export const submitAttempt = (data: { assessment_id: number; answers: Record<number, number> }) =>
  api.post<Attempt>("/attempts/submit", data);

export const getMyAttempts = () =>
  api.get<Attempt[]>("/attempts/my-attempts");

export const getAttemptReview = (id: number) =>
  api.get(`/attempts/${id}/review`);

export const getAttempts = (params?: Record<string, any>) =>
  api.get<Attempt[]>("/attempts", { params });
