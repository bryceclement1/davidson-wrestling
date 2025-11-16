export type UserRole = "admin" | "standard";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  wrestlerId?: number | null;
}
