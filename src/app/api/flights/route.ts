import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat") || "40.7128";
    const lon = searchParams.get("lon") || "-74.0060";
    const dist = searchParams.get("dist") || "50";

    // Replaced airplanes.live with ADSB.lol (open endpoint, identical JSON format)
    const apiUrl = `https://api.adsb.lol/v2/point/${lat}/${lon}/${dist}`;

    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "CyphxAIBGame/1.0",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `ADSB.lol API responded with status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Flight telemetry proxy error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch flight telemetry data" },
      { status: 500 }
    );
  }
}