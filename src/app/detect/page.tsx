"use client";
import { useState, useEffect, useRef } from "react";
import { Container } from "@/components/Container";
import Image from "next/image";
import axios from "axios";
import ReactMarkdown from 'react-markdown';


type HistoryItem = {
  image: string | null;
  clean: string;
  confidence: number;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function DetectPage() {
  const [showBot, setShowBot] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<{ clean: string; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const data_url = await fileToDataUrl(file);
      setSelectedImage(data_url);
      setResult(null);
    }
  };

  const handleDetect = async () => {
    if (!selectedImage) return;
    setLoading(true);

    const res = await fetch(`${process.env.NEXT_PUBLIC_ENDPOINT}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data_url: selectedImage }),
    });

    const data = await res.json();

    const clean = data?.predictions?.class?.clean || "Unknown";
    const confidence = data?.predictions?.confidence || 0;

    const resultData = { clean, confidence };
    setResult(resultData);

    setHistory((prev) => [...prev, { image: selectedImage, ...resultData }]);
    setLoading(false);
  };

  const handleReset = () => {
    setSelectedImage(null);
    setResult(null);
  };

  const ChatBot = ({ problem, onClose }: { problem: string; onClose: () => void }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
      {
        role: "assistant",
        content: `Hi! It looks like your plant is affected by: **${problem}**. Would you like to know some possible solutions?`,
      },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
      if (!input.trim()) return;

      // Ensure role is 'user' when the message is from the user
      const newMessages: ChatMessage[] = [
        ...messages,
        { role: "user", content: input },
      ];
      setMessages(newMessages); // Update messages with correct typing
      setInput("");
      setLoading(true);

      try {
        const res = await axios.post("../api/predict/chat", {
          messages: newMessages,
        });

        const reply = res.data.reply || "Sorry, I couldn’t find a solution.";

        // Ensure role is 'assistant' for bot replies
        setMessages([
          ...newMessages,
          { role: "assistant", content: reply },
        ]);
      } catch (err) {
        console.error("Chatbot error:", err);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed bottom-4 right-4 w-[350px] max-h-[500px] bg-white dark:bg-gray-900 rounded-xl shadow-lg border overflow-hidden flex flex-col">
        <div className="bg-teal-600 text-white px-4 py-3 flex justify-between items-center">
          <span className="font-semibold">AgriBot</span>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`text-sm p-2 rounded ${msg.role === "user" ? "bg-teal-100 self-end text-right" : "bg-gray-200 self-start"}`}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex p-2 border-t">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask something..."
            className="flex-1 px-2 py-1 rounded border mr-2"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-teal-600 text-white px-3 py-1 rounded"
          >
            Send
          </button>
        </div>
      </div>
    );
  };

  return (
    <Container>
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
          Plant Disease Detection
        </h1>

        {/* Image Upload or Preview */}
        <div className="mb-8">
          {!selectedImage ? (
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <span className="px-8 py-4 text-lg font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 transition duration-200 transform hover:scale-105">
                Choose Image
              </span>
            </label>
          ) : (
            <div className="relative aspect-video w-full max-h-[400px]">
              <Image src={selectedImage} alt="Selected plant" fill className="object-contain rounded-md" />
            </div>
          )}
        </div>

        {/* Detect Button */}
        {selectedImage && !result && (
          <button
            onClick={handleDetect}
            disabled={loading}
            className={`px-8 py-4 text-lg font-medium text-white bg-teal-600 rounded-md transition duration-200 ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-teal-700 transform hover:scale-105"
              }`}
          >
            {loading ? "Analyzing..." : "Detect Disease"}
          </button>
        )}

        {/* Reset Button */}
        {result && (
          <button
            onClick={handleReset}
            className="mt-4 ml-4 px-8 py-4 text-lg font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition duration-200 transform hover:scale-105"
          >
            Reset
          </button>
        )}

        {/* Result */}
        {result && (
          <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
              Detection Result
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{result.clean}</p>
            <p className="text-gray-600 dark:text-gray-300">
              Confidence: {(result.confidence * 100).toFixed(2)}%
            </p>
          </div>
        )}

        {result && !showBot && (
          <button
            onClick={() => setShowBot(true)}
            className="mt-4 px-6 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 transition"
          >
            Ask Agribot
          </button>
        )}

        {showBot && result && (
          <ChatBot problem={result.clean} onClose={() => setShowBot(false)} />
        )}

        {/* Toggle History */}
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="mt-6 px-6 py-2 text-white bg-gray-700 rounded hover:bg-gray-800 transition"
          >
            {showHistory ? "Hide History" : "View History"}
          </button>
        )}

        {/* Detection History */}
        {showHistory && history.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Detection History</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {history.map((item, index) => (
                <div key={index} className="p-4 bg-white dark:bg-gray-900 rounded shadow">
                  <div className="flex items-center space-x-4">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={`History ${index}`}
                        width={100}
                        height={100}
                        className="rounded object-contain"
                      />
                    )}
                    <div>
                      <p className="text-gray-700 dark:text-gray-300">
                        Prediction: <strong>{item.clean}</strong>
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        Confidence: <strong>{(item.confidence * 100).toFixed(2)}%</strong>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
