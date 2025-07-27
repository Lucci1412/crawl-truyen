import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const truyenName = searchParams.get("truyen");

    // Get the Desktop/truyen directory path
    const desktopPath = path.join(
      process.env.USERPROFILE || "",
      "Desktop",
      "truyen"
    );

    if (!fs.existsSync(desktopPath)) {
      return NextResponse.json({
        truyenList: [],
        chapterRange: { min: 0, max: 0 },
      });
    }

    // Get list of truyen directories
    const truyenList = fs
      .readdirSync(desktopPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    // If specific truyen is requested, get chapter range
    if (truyenName) {
      const truyenPath = path.join(desktopPath, truyenName, "text");
      if (fs.existsSync(truyenPath)) {
        const files = fs
          .readdirSync(truyenPath)
          .filter((file) => file.endsWith(".txt"))
          .map((file) => {
            const match = file.match(/^(\d+)\.txt$/);
            return match ? parseInt(match[1]) : 0;
          })
          .filter((num) => num > 0)
          .sort((a, b) => a - b);

        if (files.length > 0) {
          return NextResponse.json({
            truyenList,
            chapterRange: { min: files[0], max: files[files.length - 1] },
          });
        }
      }

      return NextResponse.json({
        truyenList,
        chapterRange: { min: 0, max: 0 },
      });
    }

    // Return just the truyen list
    return NextResponse.json({ truyenList });
  } catch (error) {
    console.error("Error in /api/truyen:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
 