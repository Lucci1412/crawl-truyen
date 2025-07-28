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
import { Checkbox } from "@/components/ui/checkbox";
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

  // Auto workflow state
  const [autoWorkflow, setAutoWorkflow] = useState(false);
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);
  const [isInAutoWorkflow, setIsInAutoWorkflow] = useState(false);

  // Convert state
  const [truyenList, setTruyenList] = useState<string[]>([]);
  const [selectedTruyen, setSelectedTruyen] = useState("");
  const [chapterRange, setChapterRange] = useState({ min: 0, max: 0 });
  const [startConvertChapter, setStartConvertChapter] = useState(1);
  const [endConvertChapter, setEndConvertChapter] = useState(10);
  const [apiKey, setApiKey] = useState("");
  const [convertLog, setConvertLog] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [isConvertPaused, setIsConvertPaused] = useState(false);
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
  const [chapterStatus, setChapterStatus] = useState<{
    [key: number]: {
      status: "pending" | "in_progress" | "completed";
      progress: number;
      totalDialogues: number;
      completedDialogues: number;
    };
  }>({});

  // Loop crawl state
  const [useLoopCrawl, setUseLoopCrawl] = useState(false);
  const [loopChapterRanges, setLoopChapterRanges] = useState("");
  const [currentLoopIndex, setCurrentLoopIndex] = useState(0);
  const [loopProgress, setLoopProgress] = useState(0);
  const [isLoopProcessing, setIsLoopProcessing] = useState(false);

  // Viettel AI TTS state
  const [useViettelAI, setUseViettelAI] = useState(false);
  const [viettelToken, setViettelToken] = useState("");
  const [selectedViettelVoice, setSelectedViettelVoice] =
    useState("hcm-diemmy");
  const [viettelSpeed, setViettelSpeed] = useState(1.0);
  const [viettelReturnOption, setViettelReturnOption] = useState(3); // MP3
  const [viettelWithoutFilter, setViettelWithoutFilter] = useState(false);
  const [useSingleFemaleVoice, setUseSingleFemaleVoice] = useState(false);

  // Individual voice settings for female roles
  const [s2Voice, setS2Voice] = useState("hn-leyen");
  const [s4Voice, setS4Voice] = useState("hn-phuongtrang");
  const [s6Voice, setS6Voice] = useState("hcm-diemmy");
  const [s8Voice, setS8Voice] = useState("hn-thanhha");
  const [s10Voice, setS10Voice] = useState("hcm-diemmy");

  // Merge Audio state
  const [selectedTruyenForMerge, setSelectedTruyenForMerge] = useState("");
  const [startMergeChapter, setStartMergeChapter] = useState(1);
  const [endMergeChapter, setEndMergeChapter] = useState(10);

  const [mergeLog, setMergeLog] = useState("");
  const [isMergingAudio, setIsMergingAudio] = useState(false);
  const [isMergePaused, setIsMergePaused] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);

  const availableSources = AVAILABLE_SOURCES;

  // Viettel AI voices
  const viettelVoices = [
    {
      name: "Quỳnh Anh chất lượng cao",
      description: "Nữ miền Bắc",
      code: "hn-quynhanh",
      location: "BAC",
    },
    {
      name: "Diễm My chất lượng cao",
      description: "Nữ miền Nam",
      code: "hcm-diemmy",
      location: "NAM",
    },
    {
      name: "Mai Ngọc chất lượng cao",
      description: "Nữ miền Trung",
      code: "hue-maingoc",
      location: "TRUNG",
    },
    {
      name: "Phương Trang chất lượng cao",
      description: "Nữ miền Bắc",
      code: "hn-phuongtrang",
      location: "BAC",
    },
    {
      name: "Thảo Chi chất lượng cao",
      description: "Nữ miền Bắc",
      code: "hn-thaochi",
      location: "BAC",
    },
    {
      name: "Thanh Hà chất lượng cao",
      description: "Nữ miền Bắc",
      code: "hn-thanhha",
      location: "BAC",
    },
    {
      name: "Phương Ly chất lượng cao",
      description: "Nữ miền Nam",
      code: "hcm-phuongly",
      location: "NAM",
    },
    {
      name: "Thùy Dung chất lượng cao",
      description: "Nữ miền Nam",
      code: "hcm-thuydung",
      location: "NAM",
    },
    {
      name: "Thanh Tùng",
      description: "Nam miền Bắc",
      code: "hn-thanhtung",
      location: "BAC",
    },
    {
      name: "Bảo Quốc",
      description: "Nam miền Trung",
      code: "hue-baoquoc",
      location: "TRUNG",
    },
    {
      name: "Minh Quân",
      description: "Nam miền Nam",
      code: "hcm-minhquan",
      location: "NAM",
    },
    {
      name: "Thanh Phương chất lượng cao",
      description: "Nữ miền Bắc",
      code: "hn-thanhphuong",
      location: "BAC",
    },
    {
      name: "Nam Khánh chất lượng cao",
      description: "Nam miền Bắc",
      code: "hn-namkhanh",
      location: "BAC",
    },
    {
      name: "Lê Yến chất lượng cao",
      description: "Nữ miền Nam",
      code: "hn-leyen",
      location: "NAM",
    },
    {
      name: "Tiến Quân chất lượng cao",
      description: "Nam miền Bắc",
      code: "hn-tienquan",
      location: "BAC",
    },
    {
      name: "Thùy Duyên chất lượng cao",
      description: "Nữ miền Nam",
      code: "hcm-thuyduyen",
      location: "NAM",
    },
  ];

  // Role-based voice mapping for Viettel AI
  const roleVoiceMapping = {
    S0: "hcm-diemmy", // Nữ miền Nam - giọng chính
    S1: "hn-quynhanh", // Nữ miền Bắc
    S2: "hue-maingoc", // Nữ miền Trung
    S3: "hn-thanhtung", // Nam miền Bắc
    S4: "hue-baoquoc", // Nam miền Trung
    S5: "hcm-minhquan", // Nam miền Nam
    S6: "hn-phuongtrang", // Nữ miền Bắc
    S7: "hcm-phuongly", // Nữ miền Nam
    S8: "hcm-thuydung", // Nữ miền Nam
    S9: "hn-thaochi", // Nữ miền Bắc
  };

  useEffect(() => {
    loadTruyenList();
    // Load API key from localStorage on component mount
    const savedApiKey = localStorage.getItem("apiKey");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    // Load Viettel token from localStorage
    const savedViettelToken = localStorage.getItem("viettelToken");
    if (savedViettelToken) {
      setViettelToken(savedViettelToken);
    }

    // Set default values for Viettel AI settings
    setViettelSpeed(1.0);
    setViettelReturnOption(3);
    setViettelWithoutFilter(false);

    // Load individual voice settings from localStorage
    const savedS2Voice = localStorage.getItem("s2Voice");
    if (savedS2Voice) setS2Voice(savedS2Voice);

    const savedS4Voice = localStorage.getItem("s4Voice");
    if (savedS4Voice) setS4Voice(savedS4Voice);

    const savedS6Voice = localStorage.getItem("s6Voice");
    if (savedS6Voice) setS6Voice(savedS6Voice);

    const savedS8Voice = localStorage.getItem("s8Voice");
    if (savedS8Voice) setS8Voice(savedS8Voice);

    const savedS10Voice = localStorage.getItem("s10Voice");
    if (savedS10Voice) setS10Voice(savedS10Voice);
  }, []);

  // Auto-sync chapter range when startChapter/endChapter change
  useEffect(() => {
    setStartAudioChapter(startChapter);
    setEndAudioChapter(endChapter);
    setStartMergeChapter(startChapter);
    setEndMergeChapter(endChapter);
  }, [startChapter, endChapter]);

  // Auto-sync chapter range when switching tabs
  useEffect(() => {
    if (activeTab === "generate-audio") {
      setStartAudioChapter(startChapter);
      setEndAudioChapter(endChapter);
    }
    if (activeTab === "merge-audio") {
      setStartMergeChapter(startChapter);
      setEndMergeChapter(endChapter);
    }
  }, [activeTab, startChapter, endChapter]);

  // Load crawled titles from localStorage
  useEffect(() => {
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
      // Don't auto-load chapter range if we're in auto workflow
      if (!isAutoProcessing && !isInAutoWorkflow) {
        loadChapterRange(selectedTruyen);
      }
    }
  }, [selectedTruyen, isAutoProcessing, isInAutoWorkflow]);

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

      // Only update chapter range if we're not in auto workflow
      if (!isInAutoWorkflow) {
        setStartConvertChapter(data.chapterRange?.min || 1);
        setEndConvertChapter(data.chapterRange?.max || 10);
      }
    } catch (error) {
      console.error("Error loading chapter range:", error);
    }
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    // Save to localStorage
    localStorage.setItem("apiKey", value);
  };

  const handleViettelTokenChange = (value: string) => {
    setViettelToken(value);
    // Save to localStorage
    localStorage.setItem("viettelToken", value);
  };

  const handleS2VoiceChange = (value: string) => {
    setS2Voice(value);
    localStorage.setItem("s2Voice", value);
  };

  const handleS4VoiceChange = (value: string) => {
    setS4Voice(value);
    localStorage.setItem("s4Voice", value);
  };

  const handleS6VoiceChange = (value: string) => {
    setS6Voice(value);
    localStorage.setItem("s6Voice", value);
  };

  const handleS8VoiceChange = (value: string) => {
    setS8Voice(value);
    localStorage.setItem("s8Voice", value);
  };

  const handleS10VoiceChange = (value: string) => {
    setS10Voice(value);
    localStorage.setItem("s10Voice", value);
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

  const handleCrawlWithValues = async (
    crawlTitle: string,
    crawlStartChapter: number,
    crawlEndChapter: number
  ) => {
    if (!crawlTitle || !crawlStartChapter || !crawlEndChapter) {
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
          title: crawlTitle,
          startChapter: crawlStartChapter,
          endChapter: crawlEndChapter,
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
                  addCrawledTitle(crawlTitle);
                } else if (data.message.includes("Đang crawl chương")) {
                  const chapterMatch = data.message.match(/chương (\d+)/);
                  if (chapterMatch) {
                    const currentChapter = parseInt(chapterMatch[1]);
                    const progress =
                      ((currentChapter - crawlStartChapter + 1) /
                        (crawlEndChapter - crawlStartChapter + 1)) *
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

  const handleConvertWithValues = async (
    truyenName: string,
    startChapter: number,
    endChapter: number
  ) => {
    if (!truyenName || !apiKey || !startChapter || !endChapter) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setIsConverting(true);
    setIsConvertPaused(false);
    setConvertLog("");
    setConvertProgress(0);

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          truyenName,
          startChapter,
          endChapter,
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
                      ((start - startChapter + 1) /
                        (endChapter - startChapter + 1)) *
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
    setIsConvertPaused(false);
    setConvertLog("");
    setConvertProgress(0);

    try {
      const startChapterNum = parseInt(startConvertChapter.toString());
      const endChapterNum = parseInt(endConvertChapter.toString());

      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          truyenName: selectedTruyen,
          startChapter: startChapterNum,
          endChapter: endChapterNum,
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

  const handlePauseResumeConvert = () => {
    setIsConvertPaused(!isConvertPaused);
  };

  const handleStopConvert = () => {
    setIsConverting(false);
    setIsConvertPaused(false);
    setConvertProgress(0);
  };

  const handleGenerateAudio = async () => {
    if (!selectedTruyenForAudio || !startAudioChapter || !endAudioChapter) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    // Validate Viettel AI settings if enabled
    if (useViettelAI) {
      if (!viettelToken) {
        alert("Vui lòng nhập Viettel AI token!");
        return;
      }
      if (!selectedViettelVoice) {
        alert("Vui lòng chọn giọng đọc Viettel AI!");
        return;
      }
    }

    setIsGeneratingAudio(true);
    setIsPaused(false);
    setAudioLog("");
    setAudioProgress(0);
    setChapterLogs({});

    try {
      // Choose API endpoint based on Viettel AI setting
      const apiEndpoint = useViettelAI
        ? "/api/generate-audio-viettel"
        : "/api/generate-audio";
      const requestBody = useViettelAI
        ? {
            truyenName: selectedTruyenForAudio,
            startChapter: startAudioChapter,
            endChapter: endAudioChapter,
            viettelToken: viettelToken,
            selectedVoice: selectedViettelVoice,
            useSingleFemaleVoice: useSingleFemaleVoice,
            s2Voice: s2Voice,
            s4Voice: s4Voice,
            s6Voice: s6Voice,
            s8Voice: s8Voice,
            s10Voice: s10Voice,
            speed: viettelSpeed,
            ttsReturnOption: viettelReturnOption,
            withoutFilter: viettelWithoutFilter,
          }
        : {
            truyenName: selectedTruyenForAudio,
            startChapter: startAudioChapter,
            endChapter: endAudioChapter,
          };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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

                // Handle chapter status updates
                if (data.type === "chapter_status" && data.chapter) {
                  setChapterStatus((prev) => ({
                    ...prev,
                    [data.chapter]: {
                      status: data.status,
                      progress: data.progress || 0,
                      totalDialogues: data.totalDialogues || 0,
                      completedDialogues: data.completedDialogues || 0,
                    },
                  }));
                }

                // Handle chapter progress updates
                if (data.type === "chapter_progress" && data.chapter) {
                  setChapterStatus((prev) => ({
                    ...prev,
                    [data.chapter]: {
                      status: data.status,
                      progress: data.progress || 0,
                      totalDialogues: data.totalDialogues || 0,
                      completedDialogues: data.completedDialogues || 0,
                    },
                  }));
                }

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

  const handleGenerateAudioWithValues = async (
    audioTruyenName: string,
    audioStartChapter: number,
    audioEndChapter: number
  ) => {
    if (!audioTruyenName || !audioStartChapter || !audioEndChapter) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    // Validate Viettel AI settings if enabled
    if (useViettelAI) {
      if (!viettelToken) {
        alert("Vui lòng nhập Viettel AI token!");
        return;
      }
      if (!selectedViettelVoice) {
        alert("Vui lòng chọn giọng đọc Viettel AI!");
        return;
      }
    }

    setIsGeneratingAudio(true);
    setIsPaused(false);
    setAudioLog("");
    setAudioProgress(0);
    setChapterLogs({});

    try {
      // Choose API endpoint based on Viettel AI setting
      const apiEndpoint = useViettelAI
        ? "/api/generate-audio-viettel"
        : "/api/generate-audio";
      const requestBody = useViettelAI
        ? {
            truyenName: audioTruyenName,
            startChapter: audioStartChapter,
            endChapter: audioEndChapter,
            viettelToken: viettelToken,
            selectedVoice: selectedViettelVoice,
            useSingleFemaleVoice: useSingleFemaleVoice,
            s2Voice: s2Voice,
            s4Voice: s4Voice,
            s6Voice: s6Voice,
            s8Voice: s8Voice,
            s10Voice: s10Voice,
            speed: viettelSpeed,
            ttsReturnOption: viettelReturnOption,
            withoutFilter: viettelWithoutFilter,
          }
        : {
            truyenName: audioTruyenName,
            startChapter: audioStartChapter,
            endChapter: audioEndChapter,
          };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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

                // Handle chapter status updates
                if (data.type === "chapter_status" && data.chapter) {
                  setChapterStatus((prev) => ({
                    ...prev,
                    [data.chapter]: {
                      status: data.status,
                      progress: data.progress || 0,
                      totalDialogues: data.totalDialogues || 0,
                      completedDialogues: data.completedDialogues || 0,
                    },
                  }));
                }

                // Handle chapter progress updates
                if (data.type === "chapter_progress" && data.chapter) {
                  setChapterStatus((prev) => ({
                    ...prev,
                    [data.chapter]: {
                      status: data.status,
                      progress: data.progress || 0,
                      totalDialogues: data.totalDialogues || 0,
                      completedDialogues: data.completedDialogues || 0,
                    },
                  }));
                }

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
                      ((currentChapter - audioStartChapter + 1) /
                        (audioEndChapter - audioStartChapter + 1)) *
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

  const handleMergeAudioWithValues = async (
    mergeTruyenName: string,
    mergeStartChapter: number,
    mergeEndChapter: number
  ) => {
    if (!mergeTruyenName || !mergeStartChapter || !mergeEndChapter) {
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
          truyenName: mergeTruyenName,
          startChapter: mergeStartChapter,
          endChapter: mergeEndChapter,
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

  const handleLoopCrawl = async () => {
    if (!title || !loopChapterRanges || !apiKey) {
      alert(
        "Vui lòng nhập đầy đủ thông tin: tên truyện, khoảng chương và API key!"
      );
      return;
    }

    // Parse chapter ranges
    const ranges = loopChapterRanges
      .split("\n")
      .map((range) => range.trim())
      .filter((range) => range.length > 0)
      .map((range) => {
        const [start, end] = range.split("-").map(Number);
        return { start, end };
      })
      .filter((range) => !isNaN(range.start) && !isNaN(range.end));

    if (ranges.length === 0) {
      alert(
        "Vui lòng nhập khoảng chương hợp lệ (mỗi hàng một khoảng, vd: 1-10)!"
      );
      return;
    }

    setIsLoopProcessing(true);
    setCurrentLoopIndex(0);
    setLoopProgress(0);

    try {
      for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        setCurrentLoopIndex(i);
        setLoopProgress((i / ranges.length) * 100);

        console.log(
          `🔄 Bắt đầu vòng lặp ${i + 1}/${ranges.length}: Chương ${
            range.start
          }-${range.end}`
        );

        // Step 1: Crawl
        setStartChapter(range.start);
        setEndChapter(range.end);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await handleCrawlWithValues(title, range.start, range.end);
        while (isCrawling) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Step 2: Convert JSON
        console.log("🔄 Chuyển sang Convert JSON");
        setActiveTab("convert");
        setSelectedTruyen(title);
        setStartConvertChapter(range.start);
        setEndConvertChapter(range.end);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await handleConvertWithValues(title, range.start, range.end);
        while (isConverting) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Step 3: Generate Audio
        console.log("🔄 Chuyển sang Generate Audio");
        setActiveTab("generate-audio");
        setSelectedTruyenForAudio(title);
        setStartAudioChapter(range.start);
        setEndAudioChapter(range.end);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await handleGenerateAudioWithValues(title, range.start, range.end);
        while (isGeneratingAudio) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Step 4: Merge Audio
        console.log("🔄 Chuyển sang Merge Audio");
        setActiveTab("merge-audio");
        setSelectedTruyenForMerge(title);
        setStartMergeChapter(range.start);
        setEndMergeChapter(range.end);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        await handleMergeAudioWithValues(title, range.start, range.end);
        while (isMergingAudio) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        console.log(`✅ Hoàn thành vòng lặp ${i + 1}/${ranges.length}`);
      }

      setLoopProgress(100);
      console.log("✅ Loop Crawl hoàn thành!");
      alert(
        `🎉 Loop Crawl hoàn thành! Đã xử lý ${ranges.length} khoảng chương.`
      );
    } catch (error) {
      console.error("Loop crawl error:", error);
      alert("❌ Lỗi trong quá trình Loop Crawl!");
    } finally {
      setIsLoopProcessing(false);
      setActiveTab("crawl");
    }
  };

  const handleAutoWorkflow = async () => {
    if (!title || !startChapter || !endChapter || !apiKey) {
      alert("Vui lòng nhập đầy đủ thông tin: tên truyện, chương, và API key!");
      return;
    }

    setIsAutoProcessing(true);
    setIsInAutoWorkflow(true);

    try {
      // Step 1: Crawl
      console.log("🔄 Bắt đầu Auto Workflow: Crawl");
      setActiveTab("crawl");
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for tab switch

      await handleCrawl();

      // Wait for crawl to complete
      while (isCrawling) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Step 2: Convert
      console.log("🔄 Chuyển sang Convert");
      setActiveTab("convert");
      setSelectedTruyen(title);
      setStartConvertChapter(startChapter);
      setEndConvertChapter(endChapter);

      // Wait for state to update
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Call convert with explicit values to avoid closure issues
      await handleConvertWithValues(title, startChapter, endChapter);

      // Wait for convert to complete
      while (isConverting) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Step 3: Generate Audio
      console.log("🔄 Chuyển sang Generate Audio");
      setActiveTab("generate-audio");
      setSelectedTruyenForAudio(title);
      setStartAudioChapter(startChapter);
      setEndAudioChapter(endChapter);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await handleGenerateAudio();

      // Wait for audio generation to complete
      while (isGeneratingAudio) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Step 4: Merge Audio
      console.log("🔄 Chuyển sang Merge Audio");
      setActiveTab("merge-audio");
      setSelectedTruyenForMerge(title);
      setStartMergeChapter(startChapter);
      setEndMergeChapter(endChapter);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await handleMergeAudio();

      // Wait for merge to complete
      while (isMergingAudio) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      console.log("✅ Auto Workflow hoàn thành!");
      alert(
        "🎉 Auto Workflow hoàn thành! Tất cả các bước đã được thực hiện thành công."
      );
    } catch (error) {
      console.error("Auto workflow error:", error);
      alert("❌ Lỗi trong quá trình Auto Workflow!");
    } finally {
      setIsAutoProcessing(false);
      setIsInAutoWorkflow(false);
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
              // Auto-sync chapter range from crawl tab
              setStartAudioChapter(startChapter);
              setEndAudioChapter(endChapter);
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
              // Auto-sync chapter range from crawl tab
              setStartMergeChapter(startChapter);
              setEndMergeChapter(endChapter);
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
                    disabled={useLoopCrawl}
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
                    disabled={useLoopCrawl}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKeyCrawl">Google Gemini API Key</Label>
                  <Input
                    id="apiKeyCrawl"
                    type="password"
                    placeholder="Nhập API key cho auto workflow"
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Chỉ cần thiết khi sử dụng Auto Workflow
                  </p>
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

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoWorkflow"
                      checked={autoWorkflow}
                      onChange={(e) => setAutoWorkflow(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label
                      htmlFor="autoWorkflow"
                      className="text-blue-600 font-medium"
                    >
                      🤖 Tự động hóa workflow (Crawl → Convert → Generate Audio
                      → Merge)
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useLoopCrawl"
                      checked={useLoopCrawl}
                      onChange={(e) => setUseLoopCrawl(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label
                      htmlFor="useLoopCrawl"
                      className="text-green-600 font-medium"
                    >
                      🔄 Vòng lặp hoàn chỉnh (Crawl → Convert → Generate Audio →
                      Merge)
                    </Label>
                  </div>
                </div>

                {useLoopCrawl && (
                  <div className="space-y-2">
                    <Label htmlFor="loopChapterRanges">
                      Khoảng chương (mỗi hàng là 1 khoảng)
                    </Label>
                    <Textarea
                      id="loopChapterRanges"
                      placeholder="1-10&#10;11-20&#10;21-30"
                      value={loopChapterRanges}
                      onChange={(e) => setLoopChapterRanges(e.target.value)}
                      rows={4}
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500">
                      Nhập các khoảng chương, mỗi hàng là 1 khoảng. Mỗi khoảng
                      sẽ thực hiện đầy đủ: Crawl → Convert → Generate Audio →
                      Merge.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={
                    useLoopCrawl
                      ? handleLoopCrawl
                      : autoWorkflow
                      ? handleAutoWorkflow
                      : handleCrawl
                  }
                  disabled={isCrawling || isAutoProcessing || isLoopProcessing}
                  className="flex-1"
                >
                  {isLoopProcessing
                    ? "🔄 Đang vòng lặp..."
                    : isAutoProcessing
                    ? "🤖 Đang tự động hóa..."
                    : isCrawling
                    ? "Đang crawl..."
                    : useLoopCrawl
                    ? "🔄 Bắt đầu Loop Crawl"
                    : autoWorkflow
                    ? "🤖 Bắt đầu Auto Workflow"
                    : "Bắt đầu Crawl"}
                </Button>

                {autoWorkflow && !useLoopCrawl && (
                  <Button
                    onClick={handleCrawl}
                    disabled={isCrawling || isAutoProcessing}
                    variant="outline"
                    className="px-4"
                  >
                    Chỉ Crawl
                  </Button>
                )}
              </div>

              {isCrawling && (
                <div className="space-y-2">
                  <Progress value={crawlProgress} className="w-full" />
                  <p className="text-sm text-gray-600">
                    Tiến độ: {crawlProgress.toFixed(1)}%
                  </p>
                </div>
              )}

              {isLoopProcessing && (
                <div className="space-y-2">
                  <Progress value={loopProgress} className="w-full" />
                  <p className="text-sm text-gray-600">
                    Vòng lặp: {currentLoopIndex + 1} /{" "}
                    {
                      loopChapterRanges
                        .split("\n")
                        .filter((line) => line.trim().length > 0).length
                    }{" "}
                    - Tiến độ: {loopProgress.toFixed(1)}%
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

              <div className="flex gap-2">
                <Button
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="flex-1"
                >
                  {isConverting ? "Đang convert..." : "Bắt đầu Convert"}
                </Button>

                {isConverting && (
                  <>
                    <Button
                      onClick={handlePauseResumeConvert}
                      variant="outline"
                      className="px-4"
                    >
                      {isConvertPaused ? "▶️ Tiếp tục" : "⏸️ Tạm dừng"}
                    </Button>
                    <Button
                      onClick={handleStopConvert}
                      variant="destructive"
                      className="px-4"
                    >
                      ⏹️ Dừng
                    </Button>
                  </>
                )}
              </div>

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

              {/* Viettel AI TTS Settings */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useViettelAI"
                    checked={useViettelAI}
                    onCheckedChange={(checked) =>
                      setUseViettelAI(checked as boolean)
                    }
                  />
                  <Label htmlFor="useViettelAI">Sử dụng Viettel AI TTS</Label>
                </div>

                {useViettelAI && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="viettelToken">Viettel AI Token</Label>
                        <Input
                          id="viettelToken"
                          type="password"
                          placeholder="Nhập Viettel AI token"
                          value={viettelToken}
                          onChange={(e) =>
                            handleViettelTokenChange(e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="viettelVoice">Giọng đọc mặc định</Label>
                        <Select
                          value={selectedViettelVoice}
                          onValueChange={setSelectedViettelVoice}
                          defaultValue="hcm-diemmy"
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {viettelVoices.map((voice) => (
                              <SelectItem key={voice.code} value={voice.code}>
                                {voice.name} - {voice.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Chế độ giọng nữ</Label>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="singleFemaleVoice"
                            name="femaleVoiceMode"
                            checked={useSingleFemaleVoice}
                            onChange={() => setUseSingleFemaleVoice(true)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <Label
                            htmlFor="singleFemaleVoice"
                            className="text-sm"
                          >
                            Sử dụng 1 giọng nữ cho tất cả vai nữ (S2, S4, S6,
                            S8, S10...)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="multipleFemaleVoice"
                            name="femaleVoiceMode"
                            checked={!useSingleFemaleVoice}
                            onChange={() => setUseSingleFemaleVoice(false)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <Label
                            htmlFor="multipleFemaleVoice"
                            className="text-sm"
                          >
                            Phân bố giọng nữ theo từng vai (mặc định)
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="viettelSpeed">Tốc độ đọc</Label>
                        <Select
                          value={viettelSpeed.toString()}
                          onValueChange={(value) =>
                            setViettelSpeed(parseFloat(value))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="1.0 - Bình thường" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0.8">0.8 - Chậm nhất</SelectItem>
                            <SelectItem value="0.9">0.9 - Chậm</SelectItem>
                            <SelectItem value="1.0">
                              1.0 - Bình thường
                            </SelectItem>
                            <SelectItem value="1.1">1.1 - Nhanh</SelectItem>
                            <SelectItem value="1.2">
                              1.2 - Nhanh nhất
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="viettelReturnOption">
                          Định dạng file
                        </Label>
                        <Select
                          value={viettelReturnOption.toString()}
                          onValueChange={(value) =>
                            setViettelReturnOption(parseInt(value))
                          }
                          defaultValue="3"
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">WAV</SelectItem>
                            <SelectItem value="3">MP3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="viettelWithoutFilter"
                            checked={viettelWithoutFilter}
                            onCheckedChange={(checked) =>
                              setViettelWithoutFilter(checked as boolean)
                            }
                          />
                          <Label htmlFor="viettelWithoutFilter">
                            Sử dụng filter chất lượng
                          </Label>
                        </div>
                        <p className="text-xs text-gray-500">
                          {viettelWithoutFilter
                            ? "Tốc độ chậm hơn, chất lượng cao"
                            : "Tốc độ nhanh hơn, chất lượng thường"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Lưu ý:</strong> Chỉ thay đổi giọng đọc cho các
                        role nữ, các role khác giữ nguyên:
                      </p>
                      {useSingleFemaleVoice ? (
                        <div className="text-xs text-blue-700 mt-2">
                          <p>
                            <strong>Chế độ 1 giọng nữ:</strong> Tất cả vai nữ
                            (S2, S4, S6, S8, S10...) sẽ sử dụng giọng
                            {selectedViettelVoice}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-blue-700">
                            <strong>Chế độ phân bố theo vai:</strong> Tùy chỉnh
                            giọng cho từng vai nữ
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label htmlFor="s2Voice" className="text-xs">
                                S2 - Lê Yến (Nữ miền Nam)
                              </Label>
                              <Select
                                value={s2Voice}
                                onValueChange={handleS2VoiceChange}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {viettelVoices.map((voice) => (
                                    <SelectItem
                                      key={voice.code}
                                      value={voice.code}
                                    >
                                      {voice.name} - {voice.description}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="s4Voice" className="text-xs">
                                S4 - Phương Trang (Nữ miền Bắc)
                              </Label>
                              <Select
                                value={s4Voice}
                                onValueChange={handleS4VoiceChange}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {viettelVoices.map((voice) => (
                                    <SelectItem
                                      key={voice.code}
                                      value={voice.code}
                                    >
                                      {voice.name} - {voice.description}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="s6Voice" className="text-xs">
                                S6 - Diễm My (Nữ miền Nam)
                              </Label>
                              <Select
                                value={s6Voice}
                                onValueChange={handleS6VoiceChange}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {viettelVoices.map((voice) => (
                                    <SelectItem
                                      key={voice.code}
                                      value={voice.code}
                                    >
                                      {voice.name} - {voice.description}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="s8Voice" className="text-xs">
                                S8 - Thanh Hà (Nữ miền Bắc)
                              </Label>
                              <Select
                                value={s8Voice}
                                onValueChange={handleS8VoiceChange}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {viettelVoices.map((voice) => (
                                    <SelectItem
                                      key={voice.code}
                                      value={voice.code}
                                    >
                                      {voice.name} - {voice.description}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label htmlFor="s10Voice" className="text-xs">
                                S10 - Diễm My (Nữ miền Nam)
                              </Label>
                              <Select
                                value={s10Voice}
                                onValueChange={handleS10VoiceChange}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {viettelVoices.map((voice) => (
                                    <SelectItem
                                      key={voice.code}
                                      value={voice.code}
                                    >
                                      {voice.name} - {voice.description}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            • S0, S1, S3, S5, S7, S9: Giữ nguyên giọng mặc định
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                    {Object.entries(chapterLogs).map(([chapter, logs]) => {
                      const status = chapterStatus[parseInt(chapter)];
                      const getStatusColor = () => {
                        if (!status) return "bg-gray-50";
                        switch (status.status) {
                          case "completed":
                            return "bg-green-50 border-green-200";
                          case "in_progress":
                            return "bg-yellow-50 border-yellow-200";
                          default:
                            return "bg-gray-50";
                        }
                      };
                      const getStatusText = () => {
                        if (!status) return "";
                        switch (status.status) {
                          case "completed":
                            return "✅ Hoàn thành";
                          case "in_progress":
                            return `🔄 Đang xử lý (${status.progress}%)`;
                          default:
                            return "";
                        }
                      };

                      return (
                        <div
                          key={chapter}
                          className={`border rounded-lg p-3 ${getStatusColor()}`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-sm">
                              Chương {chapter}
                            </h4>
                            {status && (
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  status.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : status.status === "in_progress"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {getStatusText()}
                              </span>
                            )}
                          </div>
                          {status && status.status === "in_progress" && (
                            <div className="mb-2">
                              <Progress
                                value={status.progress}
                                className="w-full h-2"
                              />
                              <p className="text-xs text-gray-600 mt-1">
                                {status.completedDialogues}/
                                {status.totalDialogues} dialogues
                              </p>
                            </div>
                          )}
                          <div className="max-h-32 overflow-y-auto">
                            {logs.map((log, index) => (
                              <div
                                key={index}
                                className="text-xs font-mono mb-1"
                              >
                                {log}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
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
                        onClick={() =>
                          handleDownloadMerge(
                            selectedTruyenForMerge,
                            startMergeChapter,
                            endMergeChapter
                          )
                        }
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
