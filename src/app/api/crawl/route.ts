import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { CrawlerFactory } from "@/lib/crawlers/crawler-factory";

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const {
          sourceName,
          title,
          startChapter,
          endChapter,
          includeTitle = true,
        } = body;

        // Validate input
        if (!sourceName || !title || !startChapter || !endChapter) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: "Missing required fields",
              })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Create directory structure
        const desktopPath = path.join(
          process.env.USERPROFILE || "",
          "Desktop",
          "truyen"
        );
        const truyenPath = path.join(desktopPath, title);
        const textPath = path.join(truyenPath, "text");

        if (!fs.existsSync(desktopPath)) {
          fs.mkdirSync(desktopPath, { recursive: true });
        }
        if (!fs.existsSync(truyenPath)) {
          fs.mkdirSync(truyenPath, { recursive: true });
        }
        if (!fs.existsSync(textPath)) {
          fs.mkdirSync(textPath, { recursive: true });
        }

        // Send initial message with directory info
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              message: `Bắt đầu crawl truyện "${title}" từ ${sourceName}...`,
            })}\n\n`
          )
        );

        // Send directory info separately
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              message: `Files sẽ được lưu tại: ${textPath}`,
              type: "directory",
            })}\n\n`
          )
        );

        // Use actual crawler
        const crawler = CrawlerFactory.createCrawler(sourceName);

        // Create a custom logger for progress updates
        const sendProgress = (message: string) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ message })}\n\n`)
          );
        };

        try {
          // Override console.log temporarily to capture progress
          const originalConsoleLog = console.log;
          console.log = (...args) => {
            const message = args.join(" ");
            sendProgress(message);
            originalConsoleLog(...args);
          };

          await crawler.crawl(title, startChapter, endChapter, includeTitle);

          // Restore console.log
          console.log = originalConsoleLog;
        } catch (error) {
          console.error("Error in crawler:", error);
        }

        // Send completion message
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              message: `Hoàn thành crawl ${
                endChapter - startChapter + 1
              } chương!`,
              completed: true,
            })}\n\n`
          )
        );
      } catch (error) {
        console.error("Error in crawl API:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Internal server error" })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
