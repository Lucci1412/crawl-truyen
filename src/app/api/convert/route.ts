import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { loadPrompt } from "@/lib/utils/prompt-loader";

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const { truyenName, startChapter, endChapter, apiKey } = body;

        // Validate input
        if (!truyenName || !startChapter || !endChapter || !apiKey) {
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

        // Get file paths
        const desktopPath = path.join(
          process.env.USERPROFILE || "",
          "Desktop",
          "truyen"
        );
        const truyenPath = path.join(desktopPath, truyenName);
        const textPath = path.join(truyenPath, "text");
        const jsonPath = path.join(truyenPath, "json");

        if (!fs.existsSync(textPath)) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error: "Text directory not found",
              })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Create JSON directory
        if (!fs.existsSync(jsonPath)) {
          fs.mkdirSync(jsonPath, { recursive: true });
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              message: `Bắt đầu convert truyện "${truyenName}"...`,
            })}\n\n`
          )
        );

        // Load prompt from file
        const prompt = loadPrompt();

        // Process chapters in parallel with retry logic
        const processChapter = async (chapter: number) => {
          const chapterFile = path.join(textPath, `${chapter}.txt`);
          if (!fs.existsSync(chapterFile)) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  message: `Không tìm thấy file chương ${chapter}`,
                })}\n\n`
              )
            );
            return;
          }

          const content = fs.readFileSync(chapterFile, "utf8");
          let retryCount = 0;
          const maxRetries = 5;

          while (retryCount < maxRetries) {
            try {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    message: `Đang xử lý chương ${chapter} với AI... (lần thử ${
                      retryCount + 1
                    })`,
                  })}\n\n`
                )
              );

              // Debug: Log API key (first 10 chars)
              console.log(`Debug - API Key: ${apiKey.substring(0, 10)}...`);

              // Call Google Gemini API using REST endpoint
              const geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey,
                  },
                  body: JSON.stringify({
                    contents: [
                      {
                        parts: [
                          {
                            text: `${prompt}\n\nNội dung cần convert:\n${content}`,
                          },
                        ],
                      },
                    ],
                  }),
                }
              );

              console.log(
                `Debug - Gemini Response Status: ${geminiResponse.status}`
              );

              if (!geminiResponse.ok) {
                const errorText = await geminiResponse.text();
                console.log(`Debug - Gemini Error Response: ${errorText}`);
                throw new Error(
                  `Gemini API error: ${geminiResponse.status} - ${errorText}`
                );
              }

              const geminiData = await geminiResponse.json();
              const aiResponse =
                geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

              if (!aiResponse) {
                throw new Error("No response from Gemini API");
              }

              // Parse AI response to extract JSON - try multiple approaches
              let parsedContent = null;

              // Method 1: Try to find JSON with proper structure
              const jsonMatch = aiResponse.match(
                /\{[^{}]*"name"[^{}]*"dialogues"[^{}]*\[[\s\S]*\]\}/
              );
              if (jsonMatch) {
                try {
                  parsedContent = JSON.parse(jsonMatch[0]);
                } catch (e) {
                  console.log(
                    `Method 1 failed for chapter ${chapter}:`,
                    e.message
                  );
                }
              }

              // Method 2: Try to find any JSON object
              if (!parsedContent) {
                const jsonMatch2 = aiResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch2) {
                  try {
                    parsedContent = JSON.parse(jsonMatch2[0]);
                  } catch (e) {
                    console.log(
                      `Method 2 failed for chapter ${chapter}:`,
                      e.message
                    );
                  }
                }
              }

              // Method 3: Try to extract JSON from markdown code blocks
              if (!parsedContent) {
                const codeBlockMatch = aiResponse.match(
                  /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
                );
                if (codeBlockMatch) {
                  try {
                    parsedContent = JSON.parse(codeBlockMatch[1]);
                  } catch (e) {
                    console.log(
                      `Method 3 failed for chapter ${chapter}:`,
                      e.message
                    );
                  }
                }
              }

              // Method 4: Try to find JSON between specific markers
              if (!parsedContent) {
                const markersMatch = aiResponse.match(
                  /```json\s*(\{[\s\S]*?\})\s*```/
                );
                if (markersMatch) {
                  try {
                    parsedContent = JSON.parse(markersMatch[1]);
                  } catch (e) {
                    console.log(
                      `Method 4 failed for chapter ${chapter}:`,
                      e.message
                    );
                  }
                }
              }

              // Method 5: Try to complete incomplete JSON
              if (!parsedContent) {
                // Look for incomplete JSON that might be cut off
                const incompleteMatch = aiResponse.match(
                  /\{[\s\S]*"dialogues"\s*:\s*\[[\s\S]*$/
                );
                if (incompleteMatch) {
                  try {
                    // Try to complete the JSON by adding missing closing brackets
                    let incompleteJson = incompleteMatch[0];

                    // Count opening and closing braces/brackets
                    let openBraces1 = (incompleteJson.match(/\{/g) || [])
                      .length;
                    let closeBraces1 = (incompleteJson.match(/\}/g) || [])
                      .length;
                    let openBrackets1 = (incompleteJson.match(/\[/g) || [])
                      .length;
                    let closeBrackets1 = (incompleteJson.match(/\]/g) || [])
                      .length;

                    // Add missing closing brackets
                    while (closeBrackets1 < openBrackets1) {
                      incompleteJson += "]";
                      closeBrackets1++;
                    }
                    while (closeBraces1 < openBraces1) {
                      incompleteJson += "}";
                      closeBraces1++;
                    }

                    parsedContent = JSON.parse(incompleteJson);
                    console.log(
                      `Method 5 succeeded for chapter ${chapter} - completed incomplete JSON`
                    );
                  } catch (e) {
                    console.log(
                      `Method 5 failed for chapter ${chapter}:`,
                      e.message
                    );
                  }
                }
              }
              
              // Method 6: Try to extract and complete JSON from code blocks with incomplete content
              if (!parsedContent) {
                const codeBlockMatch = aiResponse.match(/```json\s*(\{[\s\S]*?)$/);
                if (codeBlockMatch) {
                  try {
                    let incompleteJson = codeBlockMatch[1];
                    
                    // If the JSON ends with a comma, remove it
                    incompleteJson = incompleteJson.replace(/,\s*$/, '');
                    
                    // Count brackets and complete
                    let openBraces2 = (incompleteJson.match(/\{/g) || []).length;
                    let closeBraces2 = (incompleteJson.match(/\}/g) || []).length;
                    let openBrackets2 = (incompleteJson.match(/\[/g) || []).length;
                    let closeBrackets2 = (incompleteJson.match(/\]/g) || []).length;
                    
                    // Add missing closing brackets
                    while (closeBrackets2 < openBrackets2) {
                      incompleteJson += "]";
                      closeBrackets2++;
                    }
                    while (closeBraces2 < openBraces2) {
                      incompleteJson += "}";
                      closeBraces2++;
                    }
                    
                    parsedContent = JSON.parse(incompleteJson);
                    console.log(`Method 6 succeeded for chapter ${chapter} - completed code block JSON`);
                  } catch (e) {
                    console.log(`Method 6 failed for chapter ${chapter}:`, e.message);
                  }
                }
              }
              
              // Method 7: Try to complete JSON that ends with incomplete object
              if (!parsedContent) {
                const incompleteObjectMatch = aiResponse.match(/\{[\s\S]*"dialogues"\s*:\s*\[[\s\S]*\{[\s\S]*"role"\s*:\s*"[^"]*"[\s\S]*"text"\s*:\s*"[^"]*$/);
                if (incompleteObjectMatch) {
                  try {
                    let incompleteJson = incompleteObjectMatch[0];
                    
                    // Remove trailing comma if exists
                    incompleteJson = incompleteJson.replace(/,\s*$/, '');
                    
                    // Add closing quote and brackets
                    incompleteJson += '"';
                    
                    // Count and complete brackets
                    let openBraces3 = (incompleteJson.match(/\{/g) || []).length;
                    let closeBraces3 = (incompleteJson.match(/\}/g) || []).length;
                    let openBrackets3 = (incompleteJson.match(/\[/g) || []).length;
                    let closeBrackets3 = (incompleteJson.match(/\]/g) || []).length;
                    
                    while (closeBrackets3 < openBrackets3) {
                      incompleteJson += "]";
                      closeBrackets3++;
                    }
                    while (closeBraces3 < openBraces3) {
                      incompleteJson += "}";
                      closeBraces3++;
                    }
                    
                    parsedContent = JSON.parse(incompleteJson);
                    console.log(`Method 7 succeeded for chapter ${chapter} - completed incomplete object JSON`);
                  } catch (e) {
                    console.log(`Method 7 failed for chapter ${chapter}:`, e.message);
                  }
                }
              }

              if (parsedContent) {
                // Save individual JSON file for this chapter
                const jsonFile = path.join(jsonPath, `${chapter}.json`);
                fs.writeFileSync(
                  jsonFile,
                  JSON.stringify(parsedContent, null, 2),
                  "utf8"
                );

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      message: `Đã convert xong chương ${chapter}`,
                    })}\n\n`
                  )
                );
                return; // Success, exit retry loop
              } else {
                console.log(
                  `No valid JSON found in AI response for chapter ${chapter}. Response preview:`,
                  aiResponse.substring(0, 200)
                );
                throw new Error("Invalid JSON response from AI");
              }
            } catch (error) {
              console.error(
                `Error processing chapter ${chapter} (attempt ${
                  retryCount + 1
                }):`,
                error
              );
              retryCount++;

              if (retryCount >= maxRetries) {
                // Final fallback: use original content
                const fallbackContent = {
                  name: `Chuong${chapter}`,
                  dialogues: [
                    {
                      role: "S0",
                      text: content,
                    },
                  ],
                };

                const jsonFile = path.join(jsonPath, `${chapter}.json`);
                fs.writeFileSync(
                  jsonFile,
                  JSON.stringify(fallbackContent, null, 2),
                  "utf8"
                );

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      message: `Lỗi xử lý chương ${chapter} sau ${maxRetries} lần thử, sử dụng nội dung gốc`,
                    })}\n\n`
                  )
                );
              } else {
                // Wait before retry
                await new Promise((resolve) =>
                  setTimeout(resolve, 1000 * retryCount)
                );
              }
            }
          }
        };

        // Process chapters in parallel
        const chapterPromises = [];
        for (let chapter = startChapter; chapter <= endChapter; chapter++) {
          chapterPromises.push(processChapter(chapter));
        }

        // Wait for all chapters to complete
        await Promise.all(chapterPromises);

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              message: `Hoàn thành convert ${
                endChapter - startChapter + 1
              } chương!`,
              completed: true,
            })}\n\n`
          )
        );
      } catch (error) {
        console.error("Error in convert API:", error);
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
