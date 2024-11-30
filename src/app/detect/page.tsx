"use client";
import { useState } from "react";
import { Container } from "@/components/Container";
import Image from "next/image";

export default function DetectPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  //placeholder 
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  //placeholder 
  const handleDetect = async () => {
    setLoading(true);

    setTimeout(() => {
      setResult("Leaf Blight detected with 92% confidence");
      setLoading(false);
    }, 2000);
  };

  return (
    <Container>
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-white">
          Plant Disease Detection
        </h1>

        <div className="mb-8">
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
            {selectedImage && (
              <span className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Image selected
              </span>
            )}
          </label>

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

        <button
          onClick={handleDetect}
          disabled={!selectedImage || loading}
          className={`px-8 py-4 text-lg font-medium text-white bg-teal-600 rounded-md transition-all duration-200 ${
            !selectedImage || loading
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-teal-700 transform hover:scale-105"
          }`}
        >
          {loading ? "Analyzing..." : "Detect Disease"}
        </button>

        {result && (
          <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
              Detection Result
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{result}</p>
          </div>
        )}
      </div>
    </Container>
  );
}