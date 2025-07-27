import { NextResponse } from "next/server";
import { CrawlerFactory } from "@/lib/crawlers/crawler-factory";

export async function GET() {
  try {
    const sources = CrawlerFactory.getAvailableSources();
    return NextResponse.json({ sources });
  } catch (error) {
    console.error("Error getting sources:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
