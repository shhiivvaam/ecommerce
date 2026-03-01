import { NextResponse } from "next/server";

const EXTERNAL_CATEGORIES_URL = "https://api.reyva.co.in/api/categories";

export const dynamic = "force-dynamic";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count: { products: number };
};

export async function GET() {
  try {
    const res = await fetch(EXTERNAL_CATEGORIES_URL, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: res.status }
      );
    }

    const data: Category[] = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
