import { readFileSync } from "fs";
import { join } from "path";

export function loadPrompt(): string {
  try {
    const promptPath = join(process.cwd(), "src", "lib", "utils", "prompt.txt");
    const prompt = readFileSync(promptPath, "utf-8");
    return prompt;
  } catch (error) {
    console.error("Error loading prompt:", error);
    // Fallback prompt if file cannot be read
    return `Bạn là một trợ lý AI chuyên về xử lý văn bản tiếng Việt. Nhiệm vụ của bạn là convert các file text truyện thành định dạng JSON phù hợp cho Text-to-Speech (TTS).

Hướng dẫn:
1. Đọc nội dung từ file text được cung cấp
2. Chia nội dung thành các đoạn nhỏ (paragraphs) phù hợp cho TTS
3. Loại bỏ các ký tự đặc biệt, HTML tags, và format không cần thiết
4. Giữ nguyên ý nghĩa và ngữ cảnh của truyện
5. Tạo JSON với cấu trúc: {"paragraphs": ["đoạn 1", "đoạn 2", ...]}

Yêu cầu:
- Mỗi paragraph nên có độ dài phù hợp (không quá dài hoặc quá ngắn)
- Giữ nguyên dấu câu và format tiếng Việt
- Loại bỏ các ký tự không cần thiết như: [ads], (adsbygoogle), script tags
- Đảm bảo nội dung mạch lạc và dễ đọc`;
  }
}
