import bcrypt from "bcrypt";
import { pool } from "../../db";
import type { ILoginPayload, ISignUpPayload } from "./auth.interface";
import { signToken } from "../../utils/jwt";
import type { RUser, User } from "../../types";
const signUpIntoDB = async (payload: ISignUpPayload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
         INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,$4) RETURNING id, name, email, role, created_at, updated_at
        `,
    [name, email, hashPassword, role],
  );

  return result;
};

const loginIntoDB = async (payload: ILoginPayload) => {
  const { email, password } = payload;
  // 1. Check if the user exists -> Done  //should be email
  const userData = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email,
  ]);
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials!");
  }
  // 2. Compare the password -> Done
  const user = userData.rows[0] as User;

  const matchPassword = await bcrypt.compare(password, user.password);

  if (!matchPassword) {
    throw new Error("Invalid Credentials and password dontchange");
  }
  //3. Generate Token
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const accessToken = signToken(jwtPayload as User);

  // Exclude password from user object and collect remaining fields into a new object for securit
  const { password: _, ...userWithoutPassword } = user ;
  return { accessToken, userWithoutPassword };
};
export const authService = {
  signUpIntoDB,
  loginIntoDB,
};
