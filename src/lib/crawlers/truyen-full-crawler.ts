import fs from "fs";
import path from "path";

export class TruyenFullCrawler {
  private baseUrl = "https://truyenfullmoi.com";

  async crawl(
    title: string,
    startChapter: number,
    endChapter: number,
    includeTitle: boolean = true
  ): Promise<void> {
    console.log(
      `Bắt đầu crawl từ TruyenFull Moi: ${title}, chương ${startChapter}-${endChapter}`
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

        const chapterUrl = `${this.baseUrl}/${title}/chuong-${chapter}.html`;
        const content = await this.fetchChapterContent(
          chapterUrl,
          includeTitle
        );

        if (content) {
          const chapterFile = path.join(textPath, `${chapter}.txt`);
          fs.writeFileSync(chapterFile, content, "utf8");
          console.log(`chương ${chapter} - done`);
        } else {
          console.log(`chương ${chapter} - lỗi`);
        }

        // Delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Lỗi khi crawl chương ${chapter}:`, error);
      }
    }
  }

  async crawlChapter(
    title: string,
    chapter: number,
    includeTitle: boolean = true
  ): Promise<void> {
    try {
      console.log(`Đang crawl chương ${chapter}...`);

      const chapterUrl = `${this.baseUrl}/${title}/chuong-${chapter}.html`;
      const content = await this.fetchChapterContent(chapterUrl, includeTitle);

      if (content) {
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

        const chapterFile = path.join(textPath, `${chapter}.txt`);
        fs.writeFileSync(chapterFile, content, "utf8");
        console.log(`chương ${chapter} - done`);
      } else {
        console.log(`chương ${chapter} - lỗi`);
      }
    } catch (error) {
      console.error(`Lỗi khi crawl chương ${chapter}:`, error);
    }
  }

  private async fetchChapterContent(
    url: string,
    includeTitle: boolean = true
  ): Promise<string | null> {
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
        console.log(`HTTP error! status: ${response.status} for URL: ${url}`);
        return null;
      }

      const html = await response.text();

      // Debug: Log a small portion of HTML to see structure
      console.log(
        `Debug - HTML preview (first 500 chars): ${html.substring(0, 500)}`
      );

      // Extract title from specific div structure for truyenfullmoi.com
      let title = "Chương không xác định";

      // Try to extract title from various patterns
      const titleSelectors = [
        /<h1[^>]*>([^<]+)<\/h1>/,
        /<h2[^>]*>([^<]+)<\/h2>/,
        /<h3[^>]*>([^<]+)<\/h3>/,
        /<title[^>]*>([^<]+)<\/title>/,
        /<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/div>/i,
      ];

      for (const selector of titleSelectors) {
        const match = html.match(selector);
        if (match) {
          title = match[1].trim();
          break;
        }
      }

      // Clean up title - extract only chapter part
      const chapterMatch = title.match(/Chương\s+\d+[^:]*:?\s*([^<]*)/i);
      if (chapterMatch) {
        title = chapterMatch[0].trim();
      }

      // Clean up title - decode HTML entities
      title = title.replace(/&nbsp;/g, " ");
      title = title.replace(/&amp;/g, "&");
      title = title.replace(/&lt;/g, "<");
      title = title.replace(/&gt;/g, ">");
      title = title.replace(/&quot;/g, '"');
      title = title.replace(/&#39;/g, "'");
      title = title.replace(/&iacute;/g, "í");
      title = title.replace(/&aacute;/g, "á");
      title = title.replace(/&eacute;/g, "é");
      title = title.replace(/&oacute;/g, "ó");
      title = title.replace(/&uacute;/g, "ú");
      title = title.replace(/&yacute;/g, "ý");
      title = title.replace(/&igrave;/g, "ì");
      title = title.replace(/&agrave;/g, "à");
      title = title.replace(/&egrave;/g, "è");
      title = title.replace(/&ograve;/g, "ò");
      title = title.replace(/&ugrave;/g, "ù");
      title = title.replace(/&ygrave;/g, "ỳ");
      title = title.replace(/&atilde;/g, "ã");
      title = title.replace(/&otilde;/g, "õ");
      title = title.replace(/&ntilde;/g, "ñ");
      title = title.replace(/&ccedil;/g, "ç");
      title = title.replace(/&Agrave;/g, "À");
      title = title.replace(/&Aacute;/g, "Á");
      title = title.replace(/&Egrave;/g, "È");
      title = title.replace(/&Eacute;/g, "É");
      title = title.replace(/&Igrave;/g, "Ì");
      title = title.replace(/&Iacute;/g, "Í");
      title = title.replace(/&Ograve;/g, "Ò");
      title = title.replace(/&Oacute;/g, "Ó");
      title = title.replace(/&Ugrave;/g, "Ù");
      title = title.replace(/&Uacute;/g, "Ú");
      title = title.replace(/&Ygrave;/g, "Ỳ");
      title = title.replace(/&Yacute;/g, "Ý");

      // Decode numeric HTML entities (&#123; format)
      title = title.replace(/&#(\d+);/g, (match, dec) =>
        String.fromCharCode(dec)
      );

      // Extract content from specific div structure for truyenfullmoi.com
      let content = null;

      // Try multiple patterns for content extraction
      const contentSelectors = [
        /<div[^>]*id="chapter-c"[^>]*class="chapter-c"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="chapter-c"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*id="chapter-c"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*chapter-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*id="[^"]*chapter-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*id="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<article[^>]*>([\s\S]*?)<\/article>/i,
        /<div[^>]*class="[^"]*chapter[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class="[^"]*text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      ];

      // Get content only from within the chapter-c div
      let chapterContent = null;

      // Method 1: Find the chapter-c div and extract content until closing tag
      const chapterDivMatch = html.match(
        /<div[^>]*id="chapter-c"[^>]*class="chapter-c"[^>]*>([\s\S]*?)<\/div>/i
      );
      if (chapterDivMatch) {
        chapterContent = chapterDivMatch[1];
        console.log(
          `Debug - Method 1: Found chapter-c content, length: ${chapterContent.length}`
        );
      }

      // Method 2: If Method 1 didn't work, try without class requirement
      if (!chapterContent) {
        const chapterMatch = html.match(
          /<div[^>]*id="chapter-c"[^>]*>([\s\S]*?)<\/div>/i
        );
        if (chapterMatch) {
          chapterContent = chapterMatch[1];
          console.log(
            `Debug - Method 2: Found chapter-c content, length: ${chapterContent.length}`
          );
        }
      }

      // Method 3: Find the chapter-c div and get content until next major div or end
      if (!chapterContent) {
        const chapterStart = html.indexOf('<div id="chapter-c"');
        if (chapterStart !== -1) {
          const afterChapterStart = html.substring(chapterStart);
          const contentStart = afterChapterStart.indexOf(">") + 1;
          const contentAfterStart = afterChapterStart.substring(contentStart);

          // Find the end of chapter-c div or next major div
          const nextDivMatch = contentAfterStart.match(/<\/div>/);
          if (nextDivMatch) {
            chapterContent = contentAfterStart.substring(0, nextDivMatch.index);
            console.log(
              `Debug - Method 3: Found chapter-c content, length: ${chapterContent.length}`
            );
          } else {
            // If no closing div found, take everything
            chapterContent = contentAfterStart;
            console.log(
              `Debug - Method 3: Found chapter-c content (no closing tag), length: ${chapterContent.length}`
            );
          }
        }
      }

      // Use the chapter content if found, otherwise fall back to selectors
      if (chapterContent) {
        content = chapterContent;
        console.log(
          `Debug - Using chapter-c content, length: ${content.length}`
        );
      } else {
        // Fallback to selectors if chapter-c not found
        for (const selector of contentSelectors) {
          const match = html.match(selector);
          if (match) {
            content = match[1];
            console.log(`Debug - Found content with selector: ${selector}`);
            break;
          }
        }
      }

      if (content) {
        console.log(`Debug - Found content, length: ${content.length}`);

        // Remove Google AdSense and other ad-related content
        content = content.replace(
          /<div[^>]*class="[^"]*google-auto-placed[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
          ""
        );
        content = content.replace(
          /<ins[^>]*adsbygoogle[^>]*>[\s\S]*?<\/ins>/gi,
          ""
        );
        content = content.replace(
          /\(adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]\)\.push\(\{\}\);?/gi,
          ""
        );
        content = content.replace(
          /<script[^>]*adsbygoogle[^>]*>[\s\S]*?<\/script>/gi,
          ""
        );

        // Remove other ad-related divs
        content = content.replace(
          /<div[^>]*class="[^"]*ad[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
          ""
        );
        content = content.replace(
          /<div[^>]*id="[^"]*ad[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
          ""
        );

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

        // Remove multiple consecutive line breaks
        content = content.replace(/\n{3,}/g, "\n\n");

        // Remove navigation and footer content
        content = content.replace(/Chương trước.*?Chương tiếp/gs, "");
        content = content.replace(/Báo lỗi chương.*?Bình luận/gs, "");
        content = content.replace(/Website Truyện Full Mới.*?Miễn phí/gs, "");
        content = content.replace(/genres\s*=\s*JSON\.parse.*?$/gs, "");
        content = content.replace(/story=\{.*?\};/gs, "");
        content = content.replace(/chapterID=.*?;/gs, "");
        content = content.replace(/chapNo=.*?;/gs, "");
        content = content.replace(/Truyện Nghiện Full.*?Khác/gs, "");
        content = content.replace(/ISO3166.*?License\./gs, "");
        content = content.replace(/Hoạt động theo giấy phép.*?License\./gs, "");

        // Remove any remaining navigation links
        content = content.replace(/SiteMap.*?$/gs, "");
        content = content.replace(/Đọc Truyện Chữ Full.*?$/gs, "");

        // Clean up any remaining extra whitespace
        content = content.replace(/\s+/g, " ").trim();
        content = content.replace(/\n\s*\n/g, "\n\n");

        console.log(`Debug - Final content length: ${content.length}`);
        return includeTitle ? `${title}\n\n${content}` : content;
      }

      console.log(`Debug - No content found for URL: ${url}`);
      return null;
    } catch (error) {
      console.error("Error fetching chapter content:", error);
      return null;
    }
  }
}
