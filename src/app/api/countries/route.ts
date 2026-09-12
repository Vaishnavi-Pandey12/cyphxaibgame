import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://restcountries.com/v3.1/all?fields=name,capital,currencies,population,flags,cca3",
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) throw new Error(`Countries API responded with ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Countries API proxy error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch countries" },
      { status: 500 }
    );
  }
}
