// SERVER-SIDE ONLY - Do not import in client components
import { TangThuVienCrawler } from "./tang-thu-vien-crawler";
import { TruyenFullCrawler } from "./truyen-full-crawler";

export interface Crawler {
  crawl(
    title: string,
    startChapter: number,
    endChapter: number,
    includeTitle?: boolean
  ): Promise<void>;
}

export class CrawlerFactory {
  static getAvailableSources(): string[] {
    return ["Tàng Thư Viện", "TruyenFull Moi"];
  }

  static createCrawler(sourceName: string): Crawler {
    switch (sourceName) {
      case "Tàng Thư Viện":
        return new TangThuVienCrawler();
      case "TruyenFull Moi":
        return new TruyenFullCrawler();
      default:
        throw new Error(`Unknown source: ${sourceName}`);
    }
  }
}
