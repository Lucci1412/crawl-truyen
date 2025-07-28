/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

// Voice settings for different roles
const voiceSettings = {
  S0: { voice: "vi-VN-NamMinhNeural", rate: "+06%", pitch: "-6Hz" },
  S1: { voice: "vi-VN-NamMinhNeural", rate: "+06%", pitch: "+2Hz" },
  S2: { voice: "vi-VN-HoaiMyNeural", rate: "+06%", pitch: "+2Hz" },
  S3: { voice: "vi-VN-NamMinhNeural", rate: "+06%", pitch: "+20Hz" },
  S4: { voice: "vi-VN-HoaiMyNeural", rate: "+06%", pitch: "+20Hz" },
  S5: { voice: "vi-VN-NamMinhNeural", rate: "+06%", pitch: "-15Hz" },
  S6: { voice: "vi-VN-HoaiMyNeural", rate: "+06%", pitch: "-6Hz" },
  S7: { voice: "vi-VN-NamMinhNeural", rate: "+06%", pitch: "+4Hz" },
  S8: { voice: "vi-VN-HoaiMyNeural", rate: "+06%", pitch: "+4Hz" },
  S9: { voice: "vi-VN-NamMinhNeural", rate: "+06%", pitch: "+10Hz" },
};

export async function POST(request: NextRequest) {
  const { truyenName, startChapter, endChapter } = await request.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              message: `Bắt đầu generate audio cho truyện "${truyenName}"...`,
            })}\n\n`
          )
        );

        // Create audio directory
        const desktopPath = path.join(process.env.USERPROFILE || "", "Desktop");
        const audioPath = path.join(desktopPath, "truyen", truyenName, "audio");

        if (!fs.existsSync(audioPath)) {
          fs.mkdirSync(audioPath, { recursive: true });
        }

        // Create Python script for TTS
        const pythonScript = `
import asyncio
import edge_tts
import sys
import os

async def generate_audio(text, voice, rate, pitch, output_path):
    try:
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        await communicate.save(output_path)
        return True
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return False

async def main():
    if len(sys.argv) != 6:
        print("Usage: python script.py <text> <voice> <rate> <pitch> <output_path>")
        sys.exit(1)
    
    text = sys.argv[1]
    voice = sys.argv[2]
    rate = sys.argv[3]
    pitch = sys.argv[4]
    output_path = sys.argv[5]
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    success = await generate_audio(text, voice, rate, pitch, output_path)
    if success:
        print("SUCCESS")
    else:
        print("FAILED")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
`;

        const scriptPath = path.join(process.cwd(), "tts_script.py");
        fs.writeFileSync(scriptPath, pythonScript);

        // Process all dialogues from all chapters in parallel
        const allDialogues: Array<{
          chapter: number;
          dialogueIndex: number;
          dialogue: any;
        }> = [];

        // Collect all dialogues from all chapters
        for (let chapter = startChapter; chapter <= endChapter; chapter++) {
          try {
            const jsonPath = path.join(
              desktopPath,
              "truyen",
              truyenName,
              "json",
              `${chapter}.json`
            );

            if (!fs.existsSync(jsonPath)) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    message: `Chương ${chapter} - Không tìm thấy file JSON`,
                    chapter,
                    type: "error",
                  })}\n\n`
                )
              );
              continue;
            }

            const jsonContent = fs.readFileSync(jsonPath, "utf-8");
            const chapterData = JSON.parse(jsonContent);
            const dialogues = chapterData.dialogues || [];

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  message: `Chương ${chapter} - ${dialogues.length} dialogues`,
                  chapter,
                  type: "info",
                })}\n\n`
              )
            );

            // Add all dialogues from this chapter to the queue
            for (
              let dialogueIndex = 0;
              dialogueIndex < dialogues.length;
              dialogueIndex++
            ) {
              allDialogues.push({
                chapter,
                dialogueIndex,
                dialogue: dialogues[dialogueIndex],
              });
            }
          } catch (error) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  message: `Lỗi xử lý chương ${chapter}: ${error}`,
                  chapter,
                  type: "error",
                })}\n\n`
              )
            );
          }
        }

        // Process all dialogues in parallel with limited concurrency
        const processDialogue = async (item: {
          chapter: number;
          dialogueIndex: number;
          dialogue: any;
        }) => {
          const { chapter, dialogueIndex, dialogue } = item;
          const role = dialogue.role || "S0";
          const text = dialogue.text || "";

          if (!text.trim()) {
            return;
          }

          // Clean and prepare text for TTS
          let cleanText = text
            .replace(/"/g, '\\"')
            .replace(/\n/g, " ")
            .replace(/\r/g, " ")
            .replace(/\t/g, " ")
            .replace(/\s+/g, " ")
            .trim();

          // Limit text length to avoid TTS issues
          if (cleanText.length > 500) {
            cleanText = cleanText.substring(0, 500) + "...";
          }

          // Skip empty text
          if (!cleanText || cleanText.length === 0) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  message: `Chương ${chapter} - ${String(
                    dialogueIndex + 1
                  ).padStart(4, "0")}_${role}: Bỏ qua text rỗng`,
                  chapter,
                  dialogueIndex,
                  type: "skip",
                })}\n\n`
              )
            );
            return;
          }

          // Create chapter-specific audio directory
          const chapterAudioPath = path.join(audioPath, chapter.toString());
          if (!fs.existsSync(chapterAudioPath)) {
            fs.mkdirSync(chapterAudioPath, { recursive: true });
          }

          // Create filename with format: 0003_S1_202507.mp3
          const currentDate = new Date();
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, "0");
          const dialogueNumber = String(dialogueIndex + 1).padStart(4, "0");
          const audioFileName = `${dialogueNumber}_${role}_${year}${month}.mp3`;
          const audioFilePath = path.join(chapterAudioPath, audioFileName);

          let retryCount = 0;
          const maxRetries = 3;
          let success = false;

          while (retryCount < maxRetries && !success) {
            try {
              // Get voice settings for this role
              const voiceSetting =
                voiceSettings[role as keyof typeof voiceSettings] ||
                voiceSettings.S0;

              // Generate audio using Python script
              const pythonCommand = `python "${scriptPath}" "${cleanText}" "${voiceSetting.voice}" "${voiceSetting.rate}" "${voiceSetting.pitch}" "${audioFilePath}"`;

              const result = await execAsync(pythonCommand);
              console.log(`TTS Command output:`, result.stdout);

              if (result.stdout.includes("SUCCESS")) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      message: `Chương ${chapter} - ${dialogueNumber}_${role}: ${text.substring(
                        0,
                        50
                      )}...`,
                      chapter,
                      dialogueIndex,
                      type: "success",
                    })}\n\n`
                  )
                );
                success = true;
              } else {
                throw new Error("Python script failed");
              }
            } catch (error) {
              retryCount++;
              console.error(
                `TTS Error for chapter ${chapter}, dialogue ${dialogueIndex}, role ${role}:`,
                error
              );
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    message: `Chương ${chapter} - lỗi generate audio cho ${role} (lần thử ${retryCount}/${maxRetries}): ${error}`,
                    chapter,
                    dialogueIndex,
                    type: "retry",
                  })}\n\n`
                )
              );

              if (retryCount >= maxRetries) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      message: `Chương ${chapter} - thất bại generate audio cho ${role} sau ${maxRetries} lần thử`,
                      chapter,
                      dialogueIndex,
                      type: "error",
                    })}\n\n`
                  )
                );
                // Continue to next dialogue even if this one failed
                success = true;
              } else {
                // Wait before retry
                await new Promise((resolve) =>
                  setTimeout(resolve, 1000 * retryCount)
                );
              }
            }
          }
        };

        // Process all dialogues from all chapters in parallel
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              message: `Bắt đầu xử lý ${allDialogues.length} dialogues từ ${
                endChapter - startChapter + 1
              } chương song song...`,
            })}\n\n`
          )
        );

        // Process all dialogues in parallel with limited concurrency
        const promises = allDialogues.map(processDialogue);
        await Promise.all(promises);

        // Clean up Python script
        try {
          if (fs.existsSync(scriptPath)) {
            fs.unlinkSync(scriptPath);
          }
        } catch (error) {
          console.error("Error cleaning up script:", error);
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              message: `Hoàn thành generate audio ${
                endChapter - startChapter + 1
              } chương!`,
              completed: true,
            })}\n\n`
          )
        );
      } catch (error) {
        console.error("Error in generate audio API:", error);
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
