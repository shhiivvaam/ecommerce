import { NextResponse } from "next/server";
import { serverFetch, toErrorResponse } from "@/lib/http";
import type { Category } from "@repo/types";

// Categories rarely change — we can revalidate every 5 minutes
export const revalidate = 300;

export async function GET(): Promise<NextResponse> {
  try {
    const categories = await serverFetch<Category[]>("/categories");
    return NextResponse.json(categories);
  } catch (error) {
    const { status, message } = toErrorResponse(error);
    return NextResponse.json({ error: message }, { status });
  }
}
