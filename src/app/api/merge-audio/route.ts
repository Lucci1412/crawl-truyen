import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const { truyenName, startChapter, endChapter } = body;

        // Validate input
        if (!truyenName || !startChapter || !endChapter) {
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
        const truyenPath = path.join(desktopPath, truyenName);
        const audioPath = path.join(truyenPath, "audio");
        // Create output file path with automatic naming
        const autoFileName = `${startChapter}-${endChapter}_merge_audio`;
        const outputPath = path.join(
          truyenPath,
          "audio",
          `${autoFileName}.mp3`
        );

        if (!fs.existsSync(audioPath)) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: "Thư mục audio không tồn tại",
              })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Send initial message
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              message: `Bắt đầu merge audio cho truyện "${truyenName}"...`,
            })}\n\n`
          )
        );

        // Collect all audio files for the specified chapters
        const audioFiles: string[] = [];
        for (let chapter = startChapter; chapter <= endChapter; chapter++) {
          const chapterAudioPath = path.join(audioPath, chapter.toString());

          if (!fs.existsSync(chapterAudioPath)) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  message: `Chương ${chapter} - Không tìm thấy thư mục audio`,
                })}\n\n`
              )
            );
            continue;
          }

          const chapterFiles = fs
            .readdirSync(chapterAudioPath)
            .filter((file) => file.endsWith(".mp3"))
            .sort((a, b) => {
              // Sort by dialogue number (first part of filename: 0001, 0002, etc.)
              const aNumber = parseInt(a.split("_")[0]);
              const bNumber = parseInt(b.split("_")[0]);
              return aNumber - bNumber;
            });

          audioFiles.push(
            ...chapterFiles.map((file) => path.join(chapterAudioPath, file))
          );
        }

        if (audioFiles.length === 0) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: "Không tìm thấy file audio nào",
              })}\n\n`
            )
          );
          controller.close();
          return;
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              message: `Tìm thấy ${audioFiles.length} file audio để merge`,
            })}\n\n`
          )
        );

        // Create a temporary file list for ffmpeg
        const tempListFile = path.join(truyenPath, "temp_audio_list.txt");
        const fileListContent = audioFiles
          .map((file) => `file '${file}'`)
          .join("\n");
        fs.writeFileSync(tempListFile, fileListContent);

        try {
          // Use ffmpeg to concatenate audio files
          const ffmpegCommand = `ffmpeg -f concat -safe 0 -i "${tempListFile}" -c copy "${outputPath}" -y`;

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                message: `Đang merge ${audioFiles.length} file audio...`,
              })}\n\n`
            )
          );

          await execAsync(ffmpegCommand);

          // Clean up temporary file
          if (fs.existsSync(tempListFile)) {
            fs.unlinkSync(tempListFile);
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                message: `Hoàn thành merge audio! File: ${outputPath}`,
                completed: true,
              })}\n\n`
            )
          );
        } catch (error) {
          // Clean up temporary file on error
          if (fs.existsSync(tempListFile)) {
            fs.unlinkSync(tempListFile);
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: `Lỗi merge audio: ${error}`,
              })}\n\n`
            )
          );
        }
      } catch (error) {
        console.error("Error in merge audio API:", error);
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
