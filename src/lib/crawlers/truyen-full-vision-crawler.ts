/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from "fs";
import path from "path";

export class TruyenFullVisionCrawler {
  private baseUrl = "https://truyenfullmoi.com";

  async crawl(
    title: string,
    startChapter: number,
    endChapter: number,
    includeTitle: boolean = true
  ): Promise<void> {
    console.log(
      `Bắt đầu crawl từ TruyenFull Vision: ${title}, chương ${startChapter}-${endChapter}`
    );

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

    for (let chapter = startChapter; chapter <= endChapter; chapter++) {
      try {
        console.log(`Đang crawl chương ${chapter}...`);

        // TruyenFull Moi URL structure
        const chapterUrl = `${this.baseUrl}/${title}/chuong-${chapter}.html`;
        const content = await this.fetchChapterContent(
          chapterUrl,
          includeTitle
        );

        if (content) {
          const chapterFile = path.join(textPath, `chương-${chapter}.txt`);
          fs.writeFileSync(chapterFile, content, "utf8");
          console.log(`Đã lưu chương ${chapter}`);
        } else {
          console.log(`Không thể crawl chương ${chapter}`);
        }

        // Delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Lỗi khi crawl chương ${chapter}:`, error);
      }
    }
  }

  private async fetchChapterContent(url: string, includeTitle: boolean = true): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
      });

      if (!response.ok) {
        return null; // Try next URL pattern
      }

      const html = await response.text();

      // Extract title from specific div structure for truyenfullmoi.com
      let title = "Chương không xác định";
      const titleMatch = html.match(
        /<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/div>/i
      );
      if (titleMatch) {
        title = titleMatch[1].trim();
      } else {
        // Fallback to h1, h2, h3
        const titleSelectors = [
          /<h1[^>]*>([^<]+)<\/h1>/,
          /<h2[^>]*>([^<]+)<\/h2>/,
          /<h3[^>]*>([^<]+)<\/h3>/,
          /<title[^>]*>([^<]+)<\/title>/,
        ];

        for (const selector of titleSelectors) {
          const match = html.match(selector);
          if (match) {
            title = match[1].trim();
            break;
          }
        }
      }

      // Try to extract content from various possible containers
      const contentSelectors = [
        /<div[^>]*class="[^"]*chapter-content[^"]*"[^>]*>([\s\S]*?)<\/div>/,
        /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/,
        /<div[^>]*id="[^"]*chapter-content[^"]*"[^>]*>([\s\S]*?)<\/div>/,
        /<div[^>]*id="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/,
        /<article[^>]*>([\s\S]*?)<\/article>/,
      ];

      let content = null;
      for (const selector of contentSelectors) {
        const match = html.match(selector);
        if (match) {
          content = match[1];
          break;
        }
      }

      if (content) {
        // Clean up HTML tags
        content = content.replace(/<[^>]*>/g, "");

        // Decode HTML entities
        content = content.replace(/&nbsp;/g, " ");
        content = content.replace(/&amp;/g, "&");
        content = content.replace(/&lt;/g, "<");
        content = content.replace(/&gt;/g, ">");
        content = content.replace(/&quot;/g, '"');
        content = content.replace(/&#39;/g, "'");
        content = content.replace(/&#8217;/g, "'");
        content = content.replace(/&#8216;/g, "'");
        content = content.replace(/&#8220;/g, '"');
        content = content.replace(/&#8221;/g, '"');

        // Clean up extra whitespace and normalize line breaks
        content = content.replace(/\s+/g, " ").trim();
        content = content.replace(/\n\s*\n/g, "\n\n");

        return `${title}\n\n${content}`;
      }

      return null;
    } catch (error) {
      console.error("Error fetching chapter content:", error);
      return null;
    }
  }
}
