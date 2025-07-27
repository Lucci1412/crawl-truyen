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
  const [activeTab, setActiveTab] = useState<"crawl" | "convert">("crawl");

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
            onClick={() => setActiveTab("convert")}
            className="flex-1"
          >
            🔄 Convert JSON
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

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Files được lưu tại: Desktop/truyen/[tên-truyen]/text/ và json/</p>
        </div>
      </div>
    </div>
  );
}
