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
import re

async def generate_audio(text, voice, rate, pitch, output_path):
    try:
        # Clean text - remove special characters that might cause issues
        # Keep original text without cleaning
        text = text.strip()
        
        # Ensure text is not empty
        if not text:
            print("Error: Empty text", file=sys.stderr)
            return False
        
        # Generate audio directly without length limits
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        await communicate.save(output_path)
        
        # Check if file was actually created and has content
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            return True
        else:
            print("Error: No audio was received. Please verify that your parameters are correct.", file=sys.stderr)
            return False
            
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
    
    # Debug info
    print(f"Debug: text length = {len(text)}", file=sys.stderr)
    print(f"Debug: voice = {voice}", file=sys.stderr)
    print(f"Debug: rate = {rate}", file=sys.stderr)
    print(f"Debug: pitch = {pitch}", file=sys.stderr)
    print(f"Debug: output_path = {output_path}", file=sys.stderr)
    
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

        // Make script executable on Unix systems
        if (process.platform !== "win32") {
          try {
            await execAsync(`chmod +x "${scriptPath}"`);
          } catch (error) {
            console.log("Could not make script executable:", error);
          }
        }

        // Detect available Python command
        let pythonCommand = "python3";
        try {
          await execAsync("python3 --version");
        } catch (error) {
          console.log(error);
          try {
            await execAsync("python --version");
            pythonCommand = "python";
          } catch (error2) {
            console.error("Neither python3 nor python is available");
            console.log(error2);
            pythonCommand = "python3"; // fallback
          }
        }
        console.log(`Using Python command: ${pythonCommand}`);

        // Process all dialogues from all chapters in parallel
        const allDialogues: Array<{
          chapter: number;
          dialogueIndex: number;
          dialogue: any;
        }> = [];

        // Collect dialogues from all chapters into separate arrays
        const chapterDialogues: {
          [chapter: number]: Array<{
            chapter: number;
            dialogueIndex: number;
            dialogue: any;
          }>;
        } = {};

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

            // Create separate array for this chapter
            chapterDialogues[chapter] = [];
            for (
              let dialogueIndex = 0;
              dialogueIndex < dialogues.length;
              dialogueIndex++
            ) {
              chapterDialogues[chapter].push({
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

          // Keep original text without cleaning
          const cleanText = text.trim();

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

          // Ensure path is absolute for Ubuntu
          const absoluteAudioFilePath = path.isAbsolute(audioFilePath)
            ? audioFilePath
            : path.resolve(audioFilePath);

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
              // Basic escape for command line
              const escapedText = cleanText.replace(/"/g, '\\"');

              const ttsCommand = `${pythonCommand} "${scriptPath}" "${escapedText}" "${voiceSetting.voice}" "${voiceSetting.rate}" "${voiceSetting.pitch}" "${absoluteAudioFilePath}"`;

              // console.log(`TTS Command: ${ttsCommand}`);

              let result;
              try {
                result = await execAsync(ttsCommand);
              } catch (error) {
                console.error("Python command failed:", error);
                throw error;
              }
              // console.log(`TTS Command output:`, result.stdout);
              // console.log(`TTS Command stderr:`, result.stderr);

              if (result.stdout.includes("SUCCESS")) {
                // Double check if file was actually created
                if (
                  fs.existsSync(absoluteAudioFilePath) &&
                  fs.statSync(absoluteAudioFilePath).size > 0
                ) {
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
                  throw new Error("Audio file was not created or is empty");
                }
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

        // Process all chapters in parallel
        const totalDialogues = Object.values(chapterDialogues).reduce(
          (sum, dialogues) => sum + dialogues.length,
          0
        );
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              message: `Bắt đầu xử lý ${totalDialogues} dialogues từ ${
                endChapter - startChapter + 1
              } chương song song (đa luồng toàn cục)...`,
            })}\n\n`
          )
        );

        const chapterOrder = Object.keys(chapterDialogues)
          .map(Number)
          .sort((a, b) => a - b);

        // Process each chapter in parallel
        const processChapter = async (chapter: number) => {
          const dialogues = chapterDialogues[chapter];

          // Send status: in progress
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                message: `Chương ${chapter} - Đang xử lý...`,
                chapter,
                type: "chapter_status",
                status: "in_progress",
                totalDialogues: dialogues.length,
                completedDialogues: 0,
              })}\n\n`
            )
          );

          // Process dialogues within this chapter with limited concurrency
          const concurrencyLimit = 3;
          const chunks = [];
          for (let i = 0; i < dialogues.length; i += concurrencyLimit) {
            chunks.push(dialogues.slice(i, i + concurrencyLimit));
          }

          let completedDialogues = 0;
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const promises = chunk.map(processDialogue);
            await Promise.all(promises);

            completedDialogues += chunk.length;

            // Update progress
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  message: `Chương ${chapter} - ${completedDialogues}/${dialogues.length} dialogues`,
                  chapter,
                  type: "chapter_progress",
                  status: "in_progress",
                  totalDialogues: dialogues.length,
                  completedDialogues: completedDialogues,
                  progress: Math.round(
                    (completedDialogues / dialogues.length) * 100
                  ),
                })}\n\n`
              )
            );

            // Small delay between chunks
            if (i < chunks.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
          }

          // Send status: completed
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                message: `Chương ${chapter} - Hoàn thành`,
                chapter,
                type: "chapter_status",
                status: "completed",
                totalDialogues: dialogues.length,
                completedDialogues: dialogues.length,
                progress: 100,
              })}\n\n`
            )
          );
        };

        // Process all chapters in parallel
        const chapterPromises = chapterOrder.map(processChapter);
        await Promise.all(chapterPromises);

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
