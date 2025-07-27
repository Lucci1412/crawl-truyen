import fs from "fs";
import path from "path";

export class TangThuVienCrawler {
  private baseUrl = "https://truyen.tangthuvien.net/doc-truyen";

  async crawl(
    title: string,
    startChapter: number,
    endChapter: number,
    includeTitle: boolean = true
  ): Promise<void> {
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

        const chapterUrl = `${this.baseUrl}/${title}/chuong-${chapter}`;
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

  private async fetchChapterContent(
    url: string,
    includeTitle: boolean = true
  ): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();

      // Extract title from more-chap btn - try multiple patterns
      let title = "Chương không xác định";

      // Pattern 1: more-chap btn
      const titleMatch1 = html.match(
        /<a[^>]*class="more-chap btn"[^>]*>([^<]+)<\/a>/
      );
      if (titleMatch1) {
        title = titleMatch1[1].trim();
      } else {
        // Pattern 2: h5 with more-chap
        const titleMatch2 = html.match(
          /<h5[^>]*>.*?<a[^>]*class="more-chap[^"]*"[^>]*>([^<]+)<\/a>/
        );
        if (titleMatch2) {
          title = titleMatch2[1].trim();
        } else {
          // Pattern 3: any h1, h2, h3 with chapter info
          const titleMatch3 = html.match(
            /<(h[1-3])[^>]*>([^<]*chương[^<]*)<\/h[1-3]>/i
          );
          if (titleMatch3) {
            title = titleMatch3[2].trim();
          } else {
            // Pattern 4: title tag
            const titleMatch4 = html.match(/<title[^>]*>([^<]+)<\/title>/);
            if (titleMatch4) {
              title = titleMatch4[1].trim();
            }
          }
        }
      }

      // Clean up title - decode all HTML entities
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
      title = title.replace(/&ecirc;/g, "ê");
      title = title.replace(/&ocirc;/g, "ô");
      title = title.replace(/&acirc;/g, "â");
      title = title.replace(/&icirc;/g, "î");
      title = title.replace(/&ucirc;/g, "û");
      title = title.replace(/&Ecirc;/g, "Ê");
      title = title.replace(/&Ocirc;/g, "Ô");
      title = title.replace(/&Acirc;/g, "Â");
      title = title.replace(/&Icirc;/g, "Î");
      title = title.replace(/&Ucirc;/g, "Û");

      // Decode numeric HTML entities (&#123; format)
      title = title.replace(/&#(\d+);/g, (match, dec) =>
        String.fromCharCode(dec)
      );

      // Extract content from first boxchap - try multiple patterns
      let content = null;

      // Pattern 1: box-chap class
      const contentMatch1 = html.match(
        /<div[^>]*class="box-chap[^"]*"[^>]*>([\s\S]*?)<\/div>/
      );
      if (contentMatch1) {
        content = contentMatch1[1];
      } else {
        // Pattern 2: any div with chapter content
        const contentMatch2 = html.match(
          /<div[^>]*class="[^"]*chapter[^"]*"[^>]*>([\s\S]*?)<\/div>/
        );
        if (contentMatch2) {
          content = contentMatch2[1];
        } else {
          // Pattern 3: article tag
          const contentMatch3 = html.match(
            /<article[^>]*>([\s\S]*?)<\/article>/
          );
          if (contentMatch3) {
            content = contentMatch3[1];
          }
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
        content = content.replace(/&iacute;/g, "í");
        content = content.replace(/&aacute;/g, "á");
        content = content.replace(/&eacute;/g, "é");
        content = content.replace(/&oacute;/g, "ó");
        content = content.replace(/&uacute;/g, "ú");
        content = content.replace(/&yacute;/g, "ý");
        content = content.replace(/&igrave;/g, "ì");
        content = content.replace(/&agrave;/g, "à");
        content = content.replace(/&egrave;/g, "è");
        content = content.replace(/&ograve;/g, "ò");
        content = content.replace(/&ugrave;/g, "ù");
        content = content.replace(/&ygrave;/g, "ỳ");
        content = content.replace(/&atilde;/g, "ã");
        content = content.replace(/&otilde;/g, "õ");
        content = content.replace(/&ntilde;/g, "ñ");
        content = content.replace(/&ccedil;/g, "ç");
        content = content.replace(/&Agrave;/g, "À");
        content = content.replace(/&Aacute;/g, "Á");
        content = content.replace(/&Egrave;/g, "È");
        content = content.replace(/&Eacute;/g, "É");
        content = content.replace(/&Igrave;/g, "Ì");
        content = content.replace(/&Iacute;/g, "Í");
        content = content.replace(/&Ograve;/g, "Ò");
        content = content.replace(/&Oacute;/g, "Ó");
        content = content.replace(/&Ugrave;/g, "Ù");
        content = content.replace(/&Uacute;/g, "Ú");
        content = content.replace(/&Ygrave;/g, "Ỳ");
        content = content.replace(/&Yacute;/g, "Ý");
        content = content.replace(/&ecirc;/g, "ê");
        content = content.replace(/&ocirc;/g, "ô");
        content = content.replace(/&acirc;/g, "â");
        content = content.replace(/&icirc;/g, "î");
        content = content.replace(/&ucirc;/g, "û");
        content = content.replace(/&Ecirc;/g, "Ê");
        content = content.replace(/&Ocirc;/g, "Ô");
        content = content.replace(/&Acirc;/g, "Â");
        content = content.replace(/&Icirc;/g, "Î");
        content = content.replace(/&Ucirc;/g, "Û");

        // Decode numeric HTML entities (&#123; format)
        content = content.replace(/&#(\d+);/g, (match, dec) =>
          String.fromCharCode(dec)
        );

        // Clean up extra whitespace and normalize line breaks
        content = content.replace(/\s+/g, " ").trim();
        content = content.replace(/\n\s*\n/g, "\n\n");

        return includeTitle ? `${title}\n\n${content}` : content;
      }

      return null;
    } catch (error) {
      console.error("Error fetching chapter content:", error);
      return null;
    }
  }
}
