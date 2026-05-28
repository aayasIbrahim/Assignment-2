import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { pool } from "../db";
import type { Roles } from "../types";
import { verifyToken } from "../utils/jwt";
import { sendResponse } from "../utils/sendResponse";

export const auth = async (req: Request, res: Response, next: NextFunction) => {
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

    // 3. Extract token cleanly
    let token = authHeader;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1] || "";
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token is malformed",
      });
    }

    // 4. Verify token
    const payload = verifyToken(token, "access");
    if (!payload) {
      return sendResponse(res, 401, {
        message: "Invalid access token",
      });
    }

      // console.log("decode user => ", payload);

    // 5. Find user in database
    const userData = await pool.query(
      `SELECT id, name, email, role FROM users WHERE email = $1`,
      [payload.email],
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

    // 7 Attach user to request
    req.user = user;

    // 8. Next middleware
    next();
  } catch (error) {
    return next(error);
  }
};

export const authorizeRoles = (...roles: Roles[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // 1. Check if the user is authenticated (logged in)
    if (!req.user) {
      return sendResponse(_res, 401, { message: "Unauthorized", error: true });
    }

    // 2. Check if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role)) {
      return sendResponse(_res, 403, {
        message: "Forbidden - you don't have permission",
        error: true,
      });
    }

    // 3. User is authorized, proceed to the next middleware/controller
    return next();
  };
};
