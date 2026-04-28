import api from "./api";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/types";

export const loginApi = (data: LoginPayload) =>
  api.post<AuthResponse>("/auth/login", data);

export const registerApi = (data: RegisterPayload) =>
  api.post<AuthResponse>("/auth/register", data);

export const changePasswordApi = (data: { newPassword: string; currentPassword?: string }) =>
  api.post("/auth/change-password", data);
