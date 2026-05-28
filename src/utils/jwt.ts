import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { RUser } from "../types";
import config from "../config";

export const verifyToken = (token: string, type: "access" | "refresh") => {
  const secret = type === "refresh" ? config.refresh_secret : config.secret;
  const decoded = jwt.verify(token, secret as string) as JwtPayload;
  return decoded;
};

export const signToken = (payload: RUser) => {
  const accessToken = jwt.sign(payload, config.secret as string, {
    expiresIn: config.access_expires_in as NonNullable<
      SignOptions["expiresIn"]
    >,
  });

  const refreshToken = jwt.sign(payload, config.refresh_secret as string, {
    expiresIn: config.refresh_expires_in as NonNullable<
      SignOptions["expiresIn"]
    >,
  });

  return { accessToken, refreshToken };
};
