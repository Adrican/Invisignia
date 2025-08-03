import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Este email no es válido"),
  password: z.string().min(1, "Se requiere contraseña"),
});

export const registerSchema = z.object({
  email: z.email("Este email no es válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirma tu contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;