import {NextResponse} from "next/server";

const ALOC_BASE_URL =
  process.env.ALOC_BASE_URL || "https://dev.aloc.com.ng/api/v1";

export async function GET(request: Request) {
  const apiKey = process.env.ALOC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        message:
          "ALOC_API_KEY is missing. Add it to .env.local and restart the app.",
      },
      {status: 500},
    );
  }

  const limit = new URL(request.url).searchParams.get("limit") || "10";
  const url = new URL(`${ALOC_BASE_URL}/questions`);
  url.searchParams.set("subject", "mathematics");
  url.searchParams.set("examType", "jamb");
  url.searchParams.set("year", "2023");
  url.searchParams.set("limit", Math.min(Number(limit) || 10, 15).toString());

  try {
    const response = await fetch(url, {
      headers: {"X-API-Key": apiKey, Accept: "application/json"},
      cache: "no-store",
    });
    const body = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          message: body.message || `ALOC returned ${response.status}.`,
          error: body.error,
        },
        {status: response.status},
      );
    }

    return NextResponse.json({
      data: body.data || [],
      pagination: body.pagination,
      meta: body.meta,
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "The ALOC service could not be reached. Check your connection and try again.",
      },
      {status: 502},
    );
  }
}
