import { cookies } from "next/headers";
import { readDB } from "./db";
import { User } from "./types";

const COOKIE_NAME = "dealflow360_uid";

export function getCurrentUser(): User | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const cookieVal = decodeURIComponent(raw);
  const uid = cookieVal.includes(":") ? cookieVal.split(":")[0] : cookieVal;
  const db = readDB();
  return db.users.find((u) => u.id === uid) ?? null;
}

export function setCurrentUser(userOrId: string | User, role?: string) {
  let cookieVal: string;
  if (typeof userOrId === "object") {
    cookieVal = `${userOrId.id}:${userOrId.role}`;
  } else if (role) {
    cookieVal = `${userOrId}:${role}`;
  } else {
    // If only ID passed, lookup user role
    const db = readDB();
    const u = db.users.find((user) => user.id === userOrId);
    cookieVal = u ? `${u.id}:${u.role}` : userOrId;
  }
  cookies().set(COOKIE_NAME, cookieVal, { path: "/", httpOnly: true, sameSite: "lax" });
}

export function clearCurrentUser() {
  cookies().delete(COOKIE_NAME);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
