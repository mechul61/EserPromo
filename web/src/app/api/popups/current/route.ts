import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getActivePopupForPath } from "@/lib/commerce/popups";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") || "/";
  const user = await getCurrentUser();
  const data = await getActivePopupForPath(path, Boolean(user));
  return Response.json(data);
}
