/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const {
          truyenName,
          startChapter,
          endChapter,
          viettelToken,
          selectedVoice,
          useSingleFemaleVoice = false,
          s2Voice = "hn-leyen",
          s4Voice = "hn-phuongtrang",
          s6Voice = "hcm-diemmy",
          s8Voice = "hn-thanhha",
          s10Voice = "hcm-diemmy",
          speed = 1.0,
          ttsReturnOption = 3,
          withoutFilter = false,
        } = await request.json();

        // Validate input
        if (
          !truyenName ||
          !startChapter ||
          !endChapter ||
          !viettelToken ||
          !selectedVoice
        ) {
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

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              message: `Bắt đầu generate audio với Viettel AI cho truyện "${truyenName}"...`,
            })}\n\n`
          )
        );

        // Get file paths
        const desktopPath = path.join(process.env.USERPROFILE || "", "Desktop");
        const audioPath = path.join(desktopPath, "truyen", truyenName, "audio");

        if (!fs.existsSync(audioPath)) {
          fs.mkdirSync(audioPath, { recursive: true });
        }

        // Role-based voice mapping for Viettel AI - chỉ thay đổi giọng nữ
        const roleVoiceMapping: { [key: string]: string } = {
          S2: s2Voice, // Nữ miền Trung
          S4: s4Voice, // Nữ miền Bắc
          S6: s6Voice, // Nữ miền Bắc
          S8: s8Voice, // Nữ miền Nam
          S10: s10Voice, // Nữ miền Nam - giọng chính
        };

        // Female roles that will use special voice mapping
        const femaleRoles = ["S2", "S4", "S6", "S8", "S10"];

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
              // Call Viettel AI TTS API
              const response = await fetch(
                "https://viettelai.vn/tts/speech_synthesis",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    accept: "*/*",
                  },
                  body: JSON.stringify({
                    text: text,
                    voice:
                      useSingleFemaleVoice && femaleRoles.includes(role)
                        ? selectedVoice
                        : roleVoiceMapping[role] || selectedVoice, // Chế độ 1 giọng nữ hoặc phân bố theo vai
                    speed: speed,
                    tts_return_option: ttsReturnOption,
                    token: viettelToken,
                    without_filter: withoutFilter,
                  }),
                }
              );

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                  `Viettel AI API error: ${
                    errorData.vi_message ||
                    errorData.en_message ||
                    response.statusText
                  }`
                );
              }

              // Get audio data
              const audioBuffer = await response.arrayBuffer();

              // Save audio file
              fs.writeFileSync(audioFilePath, Buffer.from(audioBuffer));

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
            } catch (error) {
              retryCount++;
              console.error(
                `Viettel TTS Error for chapter ${chapter}, dialogue ${dialogueIndex}, role ${role}:`,
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
                // Retry ngay lập tức không delay
                await new Promise((resolve) => setTimeout(resolve, 100));
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

        // Process dialogues with limited concurrency
        const concurrencyLimit = 3; // Giảm xuống 3 để tránh rate limit
        const chunks = [];
        for (let i = 0; i < allDialogues.length; i += concurrencyLimit) {
          chunks.push(allDialogues.slice(i, i + concurrencyLimit));
        }

        for (const chunk of chunks) {
          await Promise.all(chunk.map(processDialogue));
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              message: `Hoàn thành generate audio với Viettel AI cho ${
                endChapter - startChapter + 1
              } chương!`,
              completed: true,
            })}\n\n`
          )
        );
      } catch (error) {
        console.error("Error in Viettel TTS API:", error);
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
