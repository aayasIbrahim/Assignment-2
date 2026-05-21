import jwt, { type JwtPayload } from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { pool } from "../db";
import config from "../config";
import type { Roles } from "../types";

export const auth = (...roles: Roles[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      // 1. Get authorization header
      const authHeader = req.headers.authorization;

      // 2. Check token exists
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: "Access denied. No token provided",
        });
      }

      // 3. Extract token from Bearer token
      const token = authHeader.split(" ")[1];

      // 4. Verify token
      const decoded = jwt.verify(
        token as string,
        config.secret as string,
      ) as JwtPayload;

    //   console.log("decoded user => ", decoded);

      // 5. Find user in database
      const userData = await pool.query(
        `SELECT id, name, email, role FROM users WHERE email = $1`,
        [decoded.email],
      );

      const user = userData.rows[0];
    //   console.log(user)

      // 6. Check user exists
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User account not found",
        });
      }

      // 7. Role authorization
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message:
            "Unauthorized. You do not have permission to access this resource.",
        });
      }

      // 8. Attach user to request
      req.user = decoded;

      // 9. Next middleware
      next();
    } catch (error) {
      return next(error);
    }
  };
};