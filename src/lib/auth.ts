import { headers } from "next/headers";

export interface RequestUser {
  id: string;
  email: string | null;
}

export async function getRequestUser(): Promise<RequestUser | null> {
  const h = await headers();
  const id = h.get("x-user-id");
  if (!id) return null;
  const email = h.get("x-user-email");
  return { id, email: email && email.length > 0 ? email : null };
}

export async function requireUser(): Promise<RequestUser> {
  const user = await getRequestUser();
  if (!user) {
    throw new Error(
      "requireUser called without authenticated user — middleware should have redirected to /login",
    );
  }
  return user;
}
