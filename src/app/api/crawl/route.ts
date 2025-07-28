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

          // Process chapters in parallel with limited concurrency
          const maxConcurrent = 5; // Process 5 chapters at once
          const chapters = [];
          for (let chapter = startChapter; chapter <= endChapter; chapter++) {
            chapters.push(chapter);
          }

          // Process chapters in batches
          for (let i = 0; i < chapters.length; i += maxConcurrent) {
            const batch = chapters.slice(i, i + maxConcurrent);
            const promises = batch.map(async (chapter) => {
              try {
                await crawler.crawlChapter(title, chapter, includeTitle);
              } catch (error) {
                console.error(`Lỗi khi crawl chương ${chapter}:`, error);
              }
            });

            await Promise.all(promises);
            
            // Delay between batches
            if (i + maxConcurrent < chapters.length) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }

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
