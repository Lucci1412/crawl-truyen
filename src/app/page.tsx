/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AVAILABLE_SOURCES } from "@/lib/constants";

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    "crawl" | "convert" | "generate-audio" | "merge-audio"
  >("crawl");

  // Crawl state
  const [sourceName, setSourceName] = useState("Tàng Thư Viện");
  const [title, setTitle] = useState("");
  const [startChapter, setStartChapter] = useState(1);
  const [endChapter, setEndChapter] = useState(10);
  const [includeTitle, setIncludeTitle] = useState(true);
  const [crawlLog, setCrawlLog] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState(0);
  const [crawledTitles, setCrawledTitles] = useState<string[]>([]);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [saveDirectory, setSaveDirectory] = useState("");

  // Convert state
  const [truyenList, setTruyenList] = useState<string[]>([]);
  const [selectedTruyen, setSelectedTruyen] = useState("");
  const [chapterRange, setChapterRange] = useState({ min: 0, max: 0 });
  const [startConvertChapter, setStartConvertChapter] = useState(1);
  const [endConvertChapter, setEndConvertChapter] = useState(10);
  const [apiKey, setApiKey] = useState("");
  const [convertLog, setConvertLog] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [convertProgress, setConvertProgress] = useState(0);

  // Generate Audio state
  const [selectedTruyenForAudio, setSelectedTruyenForAudio] = useState("");
  const [startAudioChapter, setStartAudioChapter] = useState(1);
  const [endAudioChapter, setEndAudioChapter] = useState(10);
  const [audioLog, setAudioLog] = useState("");
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [chapterLogs, setChapterLogs] = useState<{ [key: number]: string[] }>(
    {}
  );

  // Merge Audio state
  const [selectedTruyenForMerge, setSelectedTruyenForMerge] = useState("");
  const [startMergeChapter, setStartMergeChapter] = useState(1);
  const [endMergeChapter, setEndMergeChapter] = useState(10);

  const [mergeLog, setMergeLog] = useState("");
  const [isMergingAudio, setIsMergingAudio] = useState(false);
  const [isMergePaused, setIsMergePaused] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);

  const availableSources = AVAILABLE_SOURCES;

  useEffect(() => {
    loadTruyenList();
    // Load API key from localStorage on component mount
    const savedApiKey = localStorage.getItem("apiKey");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    // Load crawled titles from localStorage
    const savedCrawledTitles = localStorage.getItem("crawledTitles");
    if (savedCrawledTitles) {
      try {
        const titles = JSON.parse(savedCrawledTitles);
        setCrawledTitles(titles);
      } catch (error) {
        console.error("Error parsing crawled titles:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedTruyen) {
      loadChapterRange(selectedTruyen);
    }
  }, [selectedTruyen]);

  // Auto-sync truyện selection across tabs
  useEffect(() => {
    // When title changes in crawl tab, sync to other tabs
    if (title && activeTab === "crawl") {
      setSelectedTruyen(title);
      setSelectedTruyenForAudio(title);
      setSelectedTruyenForMerge(title);
    }
  }, [title, activeTab]);

  const loadTruyenList = async () => {
    try {
      const response = await fetch("/api/truyen");
      const data = await response.json();
      setTruyenList(data.truyenList || []);
    } catch (error) {
      console.error("Error loading truyen list:", error);
    }
  };

  const loadChapterRange = async (truyenName: string) => {
    try {
      const response = await fetch(
        `/api/truyen?truyen=${encodeURIComponent(truyenName)}`
      );
      const data = await response.json();
      setChapterRange(data.chapterRange || { min: 0, max: 0 });
      setStartConvertChapter(data.chapterRange?.min || 1);
      setEndConvertChapter(data.chapterRange?.max || 10);
    } catch (error) {
      console.error("Error loading chapter range:", error);
    }
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    // Save to localStorage
    localStorage.setItem("apiKey", value);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);

    // Auto-set selected truyện for other tabs when typing
    setSelectedTruyen(value);
    setSelectedTruyenForAudio(value);
    setSelectedTruyenForMerge(value);
  };

  const addCrawledTitle = (newTitle: string) => {
    if (newTitle && !crawledTitles.includes(newTitle)) {
      const updatedTitles = [newTitle, ...crawledTitles];
      setCrawledTitles(updatedTitles);
      localStorage.setItem("crawledTitles", JSON.stringify(updatedTitles));
    }
  };

  const removeCrawledTitle = (titleToRemove: string) => {
    const updatedTitles = crawledTitles.filter(
      (title) => title !== titleToRemove
    );
    setCrawledTitles(updatedTitles);
    localStorage.setItem("crawledTitles", JSON.stringify(updatedTitles));
  };

  const selectCrawledTitle = (selectedTitle: string) => {
    setTitle(selectedTitle);
    setShowTitleDropdown(false);

    // Auto-set selected truyện for other tabs
    setSelectedTruyen(selectedTitle);
    setSelectedTruyenForAudio(selectedTitle);
    setSelectedTruyenForMerge(selectedTitle);
  };

  const handleCrawl = async () => {
    if (!title || !startChapter || !endChapter) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setIsCrawling(true);
    setCrawlLog("");
    setCrawlProgress(0);
    setSaveDirectory("");

    try {
      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceName,
          title,
          startChapter,
          endChapter,
          includeTitle,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              // Handle directory info message separately
              if (data.type === "directory") {
                setSaveDirectory(data.message);
                continue;
              }

              // Validate data.message exists before using it
              if (data.message) {
                setCrawlLog((prev) => prev + data.message + "\n");

                if (data.completed) {
                  setCrawlProgress(100);
                  // Add title to crawled titles when crawl is completed
                  addCrawledTitle(title);
                } else if (data.message.includes("Đang crawl chương")) {
                  const chapterMatch = data.message.match(/chương (\d+)/);
                  if (chapterMatch) {
                    const currentChapter = parseInt(chapterMatch[1]);
                    const progress =
                      ((currentChapter - startChapter + 1) /
                        (endChapter - startChapter + 1)) *
                      100;
                    setCrawlProgress(Math.min(progress, 100));
                  }
                }
              } else if (data.error) {
                // Handle error messages
                setCrawlLog((prev) => prev + `Lỗi: ${data.error}\n`);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      setCrawlLog((prev) => prev + `\nLỗi: ${error}`);
    } finally {
      setIsCrawling(false);
    }
  };

  const handleConvert = async () => {
    if (
      !selectedTruyen ||
      !apiKey ||
      !startConvertChapter ||
      !endConvertChapter
    ) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setIsConverting(true);
    setConvertLog("");
    setConvertProgress(0);

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          truyenName: selectedTruyen,
          startChapter: startConvertChapter,
          endChapter: endConvertChapter,
          apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              // Validate data.message exists before using it
              if (data.message) {
                setConvertLog((prev) => prev + data.message + "\n");

                if (data.completed) {
                  setConvertProgress(100);
                } else if (data.message.includes("Đang phân tích chương")) {
                  const chapterMatch = data.message.match(/chương (\d+)-(\d+)/);
                  if (chapterMatch) {
                    const start = parseInt(chapterMatch[1]);
                    const end = parseInt(chapterMatch[2]);
                    const progress =
                      ((start - startConvertChapter + 1) /
                        (endConvertChapter - startConvertChapter + 1)) *
                      100;
                    setConvertProgress(Math.min(progress, 100));
                  }
                }
              } else if (data.error) {
                // Handle error messages
                setConvertLog((prev) => prev + `Lỗi: ${data.error}\n`);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      setConvertLog((prev) => prev + `\nLỗi: ${error}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!selectedTruyenForAudio || !startAudioChapter || !endAudioChapter) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setIsGeneratingAudio(true);
    setIsPaused(false);
    setAudioLog("");
    setAudioProgress(0);
    setChapterLogs({});

    try {
      const response = await fetch("/api/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          truyenName: selectedTruyenForAudio,
          startChapter: startAudioChapter,
          endChapter: endAudioChapter,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              // Validate data.message exists before using it
              if (data.message) {
                setAudioLog((prev) => prev + data.message + "\n");

                // Update chapter-specific logs
                if (data.chapter) {
                  setChapterLogs((prev) => {
                    const chapterLog = prev[data.chapter] || [];
                    return {
                      ...prev,
                      [data.chapter]: [...chapterLog, data.message],
                    };
                  });
                }

                if (data.completed) {
                  setAudioProgress(100);
                } else if (data.message.includes("Chương")) {
                  const chapterMatch = data.message.match(/Chương (\d+)/);
                  if (chapterMatch) {
                    const currentChapter = parseInt(chapterMatch[1]);
                    const progress =
                      ((currentChapter - startAudioChapter + 1) /
                        (endAudioChapter - startAudioChapter + 1)) *
                      100;
                    setAudioProgress(Math.min(progress, 100));
                  }
                }
              } else if (data.error) {
                // Handle error messages
                setAudioLog((prev) => prev + `Lỗi: ${data.error}\n`);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      setAudioLog((prev) => prev + `\nLỗi: ${error}`);
    } finally {
      setIsGeneratingAudio(false);
      setIsPaused(false);
    }
  };

  const handlePauseResumeAudio = () => {
    setIsPaused(!isPaused);
  };

  const handleStopAudio = () => {
    setIsGeneratingAudio(false);
    setIsPaused(false);
    setAudioProgress(0);
  };

  const handleMergeAudio = async () => {
    if (!selectedTruyenForMerge || !startMergeChapter || !endMergeChapter) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setIsMergingAudio(true);
    setIsMergePaused(false);
    setMergeLog("");
    setMergeProgress(0);

    try {
      const response = await fetch("/api/merge-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          truyenName: selectedTruyenForMerge,
          startChapter: startMergeChapter,
          endChapter: endMergeChapter,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              // Validate data.message exists before using it
              if (data.message) {
                setMergeLog((prev) => prev + data.message + "\n");

                if (data.completed) {
                  setMergeProgress(100);
                }
              } else if (data.error) {
                // Handle error messages
                setMergeLog((prev) => prev + `Lỗi: ${data.error}\n`);
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      setMergeLog((prev) => prev + `\nLỗi: ${error}`);
    } finally {
      setIsMergingAudio(false);
      setIsMergePaused(false);
    }
  };

  const handlePauseResumeMerge = () => {
    setIsMergePaused(!isMergePaused);
  };

  const handleStopMerge = () => {
    setIsMergingAudio(false);
    setIsMergePaused(false);
    setMergeProgress(0);
  };

  const handleDownloadMerge = async (
    truyenName: string,
    startChapter: number,
    endChapter: number
  ) => {
    try {
      const response = await fetch(
        `/api/download-merge?truyen=${truyenName}&startChapter=${startChapter}&endChapter=${endChapter}`
      );

      if (!response.ok) {
        throw new Error("Download merge failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${truyenName}_${startChapter}-${endChapter}_merge_audio.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download merge error:", error);
      alert("Lỗi khi download file merge audio!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Tool Crawl Truyện
          </h1>
          <p className="text-gray-600">
            Crawl truyện từ nhiều nguồn và convert thành JSON cho TTS
          </p>
        </div>

        <div className="flex space-x-4 mb-6">
          <Button
            variant={activeTab === "crawl" ? "default" : "outline"}
            onClick={() => setActiveTab("crawl")}
            className="flex-1"
          >
            🕷️ Crawl Truyện
          </Button>
          <Button
            variant={activeTab === "convert" ? "default" : "outline"}
            onClick={() => {
              setActiveTab("convert");
              // Auto-sync truyện from crawl tab if not set
              if (!selectedTruyen && title) {
                setSelectedTruyen(title);
              }
            }}
            className="flex-1"
          >
            🔄 Convert JSON
          </Button>
          <Button
            variant={activeTab === "generate-audio" ? "default" : "outline"}
            onClick={() => {
              setActiveTab("generate-audio");
              // Auto-sync truyện from crawl tab if not set
              if (!selectedTruyenForAudio && title) {
                setSelectedTruyenForAudio(title);
              }
            }}
            className="flex-1"
          >
            🔊 Generate Audio
          </Button>
          <Button
            variant={activeTab === "merge-audio" ? "default" : "outline"}
            onClick={() => {
              setActiveTab("merge-audio");
              // Auto-sync truyện from crawl tab if not set
              if (!selectedTruyenForMerge && title) {
                setSelectedTruyenForMerge(title);
              }
            }}
            className="flex-1"
          >
            🎵 Merge Audio
          </Button>
        </div>

        {activeTab === "crawl" && (
          <Card>
            <CardHeader>
              <CardTitle>Crawl Truyện</CardTitle>
              <CardDescription>
                Crawl truyện từ các nguồn được hỗ trợ và lưu vào Desktop/truyen/
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Nguồn</Label>
                  <Select value={sourceName} onValueChange={setSourceName}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSources.map((source: string) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Tên truyện (slug)</Label>
                  <div className="relative">
                    <Input
                      id="title"
                      placeholder="vd: tam-tien-khai-ky-luc"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      onFocus={() => setShowTitleDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowTitleDropdown(false), 200)
                      }
                    />
                    {crawledTitles.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                        onClick={() => setShowTitleDropdown(!showTitleDropdown)}
                      >
                        ▼
                      </Button>
                    )}

                    {showTitleDropdown && crawledTitles.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {crawledTitles.map((crawledTitle, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => selectCrawledTitle(crawledTitle)}
                          >
                            <span className="flex-1">{crawledTitle}</span>
                            <button
                              type="button"
                              className="ml-2 text-red-500 hover:text-red-700 text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCrawledTitle(crawledTitle);
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {crawledTitles.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Đã crawl: {crawledTitles.slice(0, 3).join(", ")}
                      {crawledTitles.length > 3 &&
                        ` và ${crawledTitles.length - 3} truyện khác`}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startChapter">Chương bắt đầu</Label>
                  <Input
                    id="startChapter"
                    type="number"
                    value={startChapter}
                    onChange={(e) =>
                      setStartChapter(parseInt(e.target.value) || 1)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endChapter">Chương kết thúc</Label>
                  <Input
                    id="endChapter"
                    type="number"
                    value={endChapter}
                    onChange={(e) =>
                      setEndChapter(parseInt(e.target.value) || 10)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeTitle"
                      checked={includeTitle}
                      onChange={(e) => setIncludeTitle(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="includeTitle">
                      Bao gồm title trong file
                    </Label>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCrawl}
                disabled={isCrawling}
                className="w-full"
              >
                {isCrawling ? "Đang crawl..." : "Bắt đầu Crawl"}
              </Button>

              {isCrawling && (
                <div className="space-y-2">
                  <Progress value={crawlProgress} className="w-full" />
                  <p className="text-sm text-gray-600">
                    Tiến độ: {crawlProgress.toFixed(1)}%
                  </p>
                </div>
              )}

              {saveDirectory && (
                <div className="space-y-2">
                  <Label>Thư mục lưu</Label>
                  <div className="p-3 bg-gray-50 rounded-md border text-sm font-mono">
                    {saveDirectory}
                  </div>
                </div>
              )}

              {crawlLog && (
                <div className="space-y-2">
                  <Label>Log</Label>
                  <Textarea
                    value={crawlLog}
                    readOnly
                    className="h-40 font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "convert" && (
          <Card>
            <CardHeader>
              <CardTitle>Convert JSON</CardTitle>
              <CardDescription>
                Convert file text thành JSON để sử dụng cho TTS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="truyen">Truyện</Label>
                  <Select
                    value={selectedTruyen}
                    onValueChange={setSelectedTruyen}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn truyện" />
                    </SelectTrigger>
                    <SelectContent>
                      {truyenList.map((truyen) => (
                        <SelectItem key={truyen} value={truyen}>
                          {truyen}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">Google Gemini API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Nhập API key"
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startConvertChapter">Chương bắt đầu</Label>
                  <Input
                    id="startConvertChapter"
                    type="number"
                    value={startConvertChapter}
                    onChange={(e) =>
                      setStartConvertChapter(parseInt(e.target.value) || 1)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endConvertChapter">Chương kết thúc</Label>
                  <Input
                    id="endConvertChapter"
                    type="number"
                    value={endConvertChapter}
                    onChange={(e) =>
                      setEndConvertChapter(parseInt(e.target.value) || 10)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phạm vi chương</Label>
                  <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                    {chapterRange.min > 0
                      ? `${chapterRange.min} - ${chapterRange.max}`
                      : "Không có dữ liệu"}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleConvert}
                disabled={isConverting}
                className="w-full"
              >
                {isConverting ? "Đang convert..." : "Bắt đầu Convert"}
              </Button>

              {isConverting && (
                <div className="space-y-2">
                  <Progress value={convertProgress} className="w-full" />
                  <p className="text-sm text-gray-600">
                    Tiến độ: {convertProgress.toFixed(1)}%
                  </p>
                </div>
              )}

              {convertLog && (
                <div className="space-y-2">
                  <Label>Log</Label>
                  <Textarea
                    value={convertLog}
                    readOnly
                    className="h-40 font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "generate-audio" && (
          <Card>
            <CardHeader>
              <CardTitle>Generate Audio</CardTitle>
              <CardDescription>
                Tạo file audio từ JSON files sử dụng edge-tts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="truyenForAudio">Truyện</Label>
                  <Select
                    value={selectedTruyenForAudio}
                    onValueChange={setSelectedTruyenForAudio}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn truyện" />
                    </SelectTrigger>
                    <SelectContent>
                      {truyenList.map((truyen) => (
                        <SelectItem key={truyen} value={truyen}>
                          {truyen}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startAudioChapter">Chương bắt đầu</Label>
                  <Input
                    id="startAudioChapter"
                    type="number"
                    value={startAudioChapter}
                    onChange={(e) =>
                      setStartAudioChapter(parseInt(e.target.value) || 1)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endAudioChapter">Chương kết thúc</Label>
                  <Input
                    id="endAudioChapter"
                    type="number"
                    value={endAudioChapter}
                    onChange={(e) =>
                      setEndAudioChapter(parseInt(e.target.value) || 10)
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateAudio}
                  disabled={isGeneratingAudio}
                  className="flex-1"
                >
                  {isGeneratingAudio
                    ? "Đang generate audio..."
                    : "Bắt đầu Generate Audio"}
                </Button>

                {isGeneratingAudio && (
                  <>
                    <Button
                      onClick={handlePauseResumeAudio}
                      variant="outline"
                      className="px-4"
                    >
                      {isPaused ? "▶️ Tiếp tục" : "⏸️ Tạm dừng"}
                    </Button>
                    <Button
                      onClick={handleStopAudio}
                      variant="destructive"
                      className="px-4"
                    >
                      ⏹️ Dừng
                    </Button>
                  </>
                )}
              </div>

              {isGeneratingAudio && (
                <div className="space-y-2">
                  <Progress value={audioProgress} className="w-full" />
                  <p className="text-sm text-gray-600">
                    Tiến độ: {audioProgress.toFixed(1)}%
                  </p>
                </div>
              )}

              {Object.keys(chapterLogs).length > 0 && (
                <div className="space-y-2">
                  <Label>Log Theo Chương</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(chapterLogs).map(([chapter, logs]) => (
                      <div
                        key={chapter}
                        className="border rounded-lg p-3 bg-gray-50"
                      >
                        <h4 className="font-semibold text-sm mb-2">
                          Chương {chapter}
                        </h4>
                        <div className="max-h-32 overflow-y-auto">
                          {logs.map((log, index) => (
                            <div key={index} className="text-xs font-mono mb-1">
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "merge-audio" && (
          <Card>
            <CardHeader>
              <CardTitle>Merge Audio</CardTitle>
              <CardDescription>
                Ghép các file audio thành một file hoàn chỉnh
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="truyenForMerge">Truyện</Label>
                  <Select
                    value={selectedTruyenForMerge}
                    onValueChange={setSelectedTruyenForMerge}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn truyện" />
                    </SelectTrigger>
                    <SelectContent>
                      {truyenList.map((truyen) => (
                        <SelectItem key={truyen} value={truyen}>
                          {truyen}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startMergeChapter">Chương bắt đầu</Label>
                  <Input
                    id="startMergeChapter"
                    type="number"
                    value={startMergeChapter}
                    onChange={(e) =>
                      setStartMergeChapter(parseInt(e.target.value) || 1)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endMergeChapter">Chương kết thúc</Label>
                  <Input
                    id="endMergeChapter"
                    type="number"
                    value={endMergeChapter}
                    onChange={(e) =>
                      setEndMergeChapter(parseInt(e.target.value) || 10)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phạm vi chương merge</Label>
                  <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                    Chương {startMergeChapter} - {endMergeChapter}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleMergeAudio}
                  disabled={isMergingAudio}
                  className="flex-1"
                >
                  {isMergingAudio
                    ? "Đang merge audio..."
                    : "Bắt đầu Merge Audio"}
                </Button>

                {isMergingAudio && (
                  <>
                    <Button
                      onClick={handlePauseResumeMerge}
                      variant="outline"
                      className="px-4"
                    >
                      {isMergePaused ? "▶️ Tiếp tục" : "⏸️ Tạm dừng"}
                    </Button>
                    <Button
                      onClick={handleStopMerge}
                      variant="destructive"
                      className="px-4"
                    >
                      ⏹️ Dừng
                    </Button>
                  </>
                )}
              </div>

              {isMergingAudio && (
                <div className="space-y-2">
                  <Progress value={mergeProgress} className="w-full" />
                  <p className="text-sm text-gray-600">
                    Tiến độ: {mergeProgress.toFixed(1)}%
                  </p>
                </div>
              )}

              {mergeLog && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Log</Label>
                    {selectedTruyenForMerge && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadMerge(selectedTruyenForMerge, startMergeChapter, endMergeChapter)}
                      >
                        📥 Download Merge Audio
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={mergeLog}
                    readOnly
                    className="h-40 font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Files được lưu tại: Desktop/truyen/[tên-truyen]/text/, json/, và
            audio/[số-chương]/
          </p>
        </div>
      </div>
    </div>
  );
}
