import { NextRequest, NextResponse } from "next/server";

const RELAYER_URL = "https://relayer.testnet.zama.org";

/**
 * Universal relayer proxy - forwards all requests to Zama relayer
 * More reliable than Next.js rewrites for POST requests
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const targetPath = "/" + path.join("/");
    const targetUrl = `${RELAYER_URL}${targetPath}`;

    const body = await request.text();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseText = await response.text();
    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Relayer timeout (2 min)" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Proxy error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const targetPath = "/" + path.join("/");
    const targetUrl = `${RELAYER_URL}${targetPath}`;

    const response = await fetch(targetUrl);
    const responseText = await response.text();

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Proxy error" },
      { status: 500 }
    );
  }
}

