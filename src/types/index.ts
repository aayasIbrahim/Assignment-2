export const USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer",
} as const;
export type Roles = "contributor" | "maintainer";

export type User = {
  id: number;
  name: string;
  email: string;
  password: string;
  role: Roles;
  created_at: Date;
  updated_at: Date;
};
export type RUser = Omit<User, "id" | "created_at" | "updated_at" | "password">;
