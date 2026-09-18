import {NextResponse} from "next/server";

const ALOC_BASE_URL =
  process.env.ALOC_BASE_URL || "https://dev.aloc.com.ng/api/v1";
const SUBJECTS = new Set([
  "mathematics",
  "english",
  "chemistry",
  "biology",
  "physics",
]);

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

  const subject =
    new URL(request.url).searchParams.get("subject") || "mathematics";
  const year = new URL(request.url).searchParams.get("year") || "all";

  if (!SUBJECTS.has(subject)) {
    return NextResponse.json(
      {
        message:
          "Choose one of Mathematics, English, Chemistry, Biology, or Physics.",
      },
      {status: 400},
    );
  }

  if (year !== "all" && !/^(19|20)\d{2}$/.test(year)) {
    return NextResponse.json(
      {message: "Choose a valid exam year or All available years."},
      {status: 400},
    );
  }

  try {
    const questions = [];
    let cursor: string | null = null;
    let lastBody: {pagination?: unknown; meta?: unknown} = {};

    for (let page = 0; page < 2 && questions.length < 30; page += 1) {
      const url = new URL(`${ALOC_BASE_URL}/questions`);
      url.searchParams.set("subject", subject);
      url.searchParams.set("examType", "jamb");
      url.searchParams.set("limit", "15");
      if (year !== "all") url.searchParams.set("year", year);
      if (cursor) url.searchParams.set("cursor", cursor);

      const response = await fetch(url, {
        headers: {"X-API-Key": apiKey, Accept: "application/json"},
        cache: "no-store",
      });
      const body = await response.json();
      lastBody = body;

      if (!response.ok) {
        return NextResponse.json(
          {
            message: body.message || `ALOC returned ${response.status}.`,
            error: body.error,
          },
          {status: response.status},
        );
      }

      questions.push(...(body.data || []));
      cursor = body.pagination?.nextCursor || null;
      if (!body.pagination?.hasMore || !cursor) break;
    }

    return NextResponse.json({
      data: questions.slice(0, 30),
      pagination: lastBody.pagination,
      meta: lastBody.meta,
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
