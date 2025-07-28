import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const truyenName = searchParams.get("truyen");
  const startChapter = searchParams.get("startChapter");
  const endChapter = searchParams.get("endChapter");

  if (!truyenName || !startChapter || !endChapter) {
    return new Response("Missing parameters", { status: 400 });
  }

  try {
    // Use Desktop path for local development
    const desktopPath = path.join(
      process.env.USERPROFILE || "",
      "Desktop",
      "truyen"
    );

    const mergeFilePath = path.join(
      desktopPath,
      truyenName,
      "audio",
      `${startChapter}-${endChapter}_merge_audio.mp3`
    );

    if (!fs.existsSync(mergeFilePath)) {
      return new Response("Merge file not found", { status: 404 });
    }

    const fileContent = fs.readFileSync(mergeFilePath);
    const fileName = `${truyenName}_${startChapter}-${endChapter}_merge_audio.mp3`;

    return new Response(fileContent, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Download merge error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
