import { NextResponse } from "next/server";

const EXTERNAL_REGISTER_URL = "https://api.reyva.co.in/api/auth/register";

export const dynamic = "force-dynamic";

type RegisterRequestBody = {
  name: string;
  email: string;
  password: string;
};

type RegisterResponseBody = {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterRequestBody;

    const res = await fetch(EXTERNAL_REGISTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Forward the incoming body directly to the external API
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = (await res.json()) as RegisterResponseBody | { message?: string };

    if (!res.ok) {
      // Preserve error payload and status from the external API when possible
      return NextResponse.json(
        data ?? { error: "Failed to register user" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in register route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}