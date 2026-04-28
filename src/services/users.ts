import api from "./api";
import type { User } from "@/types";

export const getUsers = (params?: Record<string, string>) =>
  api.get<User[]>("/users", { params });

export const getUserById = (id: number) =>
  api.get<User>(`/users/${id}`);

export const createUser = (data: Partial<User> & { class_id?: number; roll_number?: string; qualification?: string; subject_id?: number }) =>
  api.post<User>("/users", data);

export const resetUserPassword = (id: number) =>
  api.post(`/users/${id}/reset-password`);

export const updateUser = (id: number, data: Partial<User>) =>
  api.put<User>(`/users/${id}`, data);

export const deleteUser = (id: number) =>
  api.delete(`/users/${id}`);
