import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: string;
  challenge?: string;
  pendingUserId?: string;
}

const sessionPassword = process.env.SESSION_SECRET;
if (!sessionPassword) {
  throw new Error("SESSION_SECRET env var is required");
}

export const sessionOptions: SessionOptions = {
  password: sessionPassword,
  cookieName: "amen-circle-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
