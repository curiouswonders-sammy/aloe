export type UserRole = "student" | "teacher" | "coach";

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  sender?: Pick<AppUser, "id" | "fullName" | "role">;
  recipient?: Pick<AppUser, "id" | "fullName" | "role">;
}
