"use client";
import { useState } from "react";
import { Container } from "@/components/Container";
import Image from "next/image";

export default function DetectPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<{
    "clean": string;
    "confidence": number;
  } | null>({
    "clean": "",
    "confidence": NaN,
  });
  const [loading, setLoading] = useState(false);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      // Define the onload callback to handle the conversion
      reader.onload = () => {
        const dataUrl = reader.result as string;  // This is the base64 encoded data URL
        resolve(dataUrl);
      };

      // Define the onerror callback in case of an error
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      // Read the file as a data URL (base64-encoded string)
      reader.readAsDataURL(file);
    });
  }

  //placeholder 
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const data_url = await fileToDataUrl(file);
      setSelectedImage(data_url);
      return data_url;
    }
  };

  //placeholder 
  const handleDetect = async () => {
    setLoading(true);

    const res = await fetch(process.env.NEXT_PUBLIC_ENDPOINT + "/api/predict" as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data_url: selectedImage }),
    });

    const data = await res.json();
    console.log(data);

    setResult({
      "clean": data.predictions.class.clean,
      "confidence": data.predictions.confidence,
    });

    setLoading(false);
  };

  // clear all states
  const handleReset = () => {
    setSelectedImage(null);
    setResult(
      {
        "clean": "",
        "confidence": NaN,
      }
    )
  }

  return (
    <Container>
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
          Plant Disease Detection
        </h1>

        <div className="mb-8">
          {!selectedImage && (
            <label className="flex flex-col items-center justify-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <span className="px-8 py-4 text-lg font-medium text-white bg-teal-600 rounded-md cursor-pointer hover:bg-teal-700 transition-all duration-200 transform hover:scale-105">
                Choose Image
              </span>
            </label>
          )}

          {selectedImage && (
            <div className="mt-4 relative w-full h-[400px]">
              <Image
                src={selectedImage}
                alt="Selected plant"
                fill
                className="object-contain"
              />
            </div>
          )}
        </div>

        {selectedImage && !result?.clean && !result?.confidence && (
          <button
            onClick={handleDetect}
            disabled={!selectedImage || loading}
            className={`px-8 py-4 text-lg font-medium text-white bg-teal-600 rounded-md transition-all duration-200 ${!selectedImage || loading
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-teal-700 transform hover:scale-105"
              }`}
          >
            {loading ? "Analyzing..." : "Detect Disease"}
          </button>
        )}

        {result?.clean && result?.confidence && (
          <button
            onClick={handleReset}
            className="mt-4 ml-4 px-8 py-4 text-lg font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-all duration-200 transform hover:scale-105"
          >
            Reset
          </button>
        )}

        {result?.clean && result.confidence && (
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
      </div>
    </Container>
  );
}