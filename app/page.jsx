"use client";
import { useState } from "react";
import {
  Upload,
  Zap,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function Home() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImage(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processImage(file);
    }
  };

  const processImage = async (file) => {
  setImage(file);
  setLoading(true);
  setResult("");

  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch("https://ai-model-api-d5dm.onrender.com/detect", {
      method: "POST",
      headers: {
        "x-api-key": process.env.NEXT_PUBLIC_X_API_KEY, // Replace with your actual API key
      },
      body: formData,
    });

    const data = await response.json();
    setResult(data.message); // Because your API returns { message: "..." }
  } catch (error) {
    console.error("Error:", error);
    setResult("Error processing image");
  } finally {
    setLoading(false);
  }
};


  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const getResultIcon = () => {
    if (loading) return <Loader2 className="animate-spin" />;
    if (
      result.toLowerCase().includes("ai") ||
      result.toLowerCase().includes("artificial")
    ) {
      return <AlertCircle className="text-orange-400" />;
    }
    return <CheckCircle className="text-green-400" />;
  };

  const getResultColor = () => {
    if (
      result.toLowerCase().includes("ai") ||
      result.toLowerCase().includes("artificial")
    ) {
      return "from-orange-500/20 to-red-500/20 border-orange-500/30";
    }
    return "from-green-500/20 to-blue-500/20 border-green-500/30";
  };

  return (
    <div>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=`60` height=`60` viewBox=`0 0 60 60` xmlns=`http://www.w3.org/2000/svg`%3E%3Cg fill=`none` fill-rule=`evenodd`%3E%3Cg fill=`%239C92AC` fill-opacity=`0.05`%3E%3Ccircle cx=`30` cy=`30` r=`1`/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]">
          </div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              AI Detection
            </h1>
          </div>
          <p className="text-xl text-slate-300 max-w-2xl">
            Advanced neural analysis to detect AI-generated content with cutting-edge precision
          </p>
        </div>

        {/* Main content */}
        <div className="w-full max-w-4xl">
          {/* Upload area */}
          <div 
            className={`relative group transition-all duration-300 ${
              dragOver ? 'scale-105' : 'hover:scale-102'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              id="file-upload"
            />
            
            <div className={`
              relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 
              backdrop-blur-xl border-2 border-dashed rounded-3xl p-12 text-center
              transition-all duration-300 shadow-2xl
              ${dragOver 
                ? 'border-purple-400 bg-purple-500/10 shadow-purple-500/25' 
                : 'border-slate-600 hover:border-slate-500 hover:shadow-slate-500/25'
              }
            `}>
              <div className="flex flex-col items-center gap-6">
                <div className={`
                  p-6 rounded-full transition-all duration-300
                  ${dragOver 
                    ? 'bg-purple-500/20 text-purple-300' 
                    : 'bg-slate-700/50 text-slate-300 group-hover:bg-slate-600/50'
                  }
                `}>
                  <Upload className="w-12 h-12" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    {dragOver ? 'Drop your image here' : 'Upload Image for Analysis'}
                  </h3>
                  <p className="text-slate-400 text-lg">
                    Drag & drop or click to select • PNG, JPG, WebP supported
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Zap className="w-4 h-4" />
                  <span>Powered by advanced AI detection algorithms</span>
                </div>
              </div>
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="mt-8 flex flex-col items-center gap-4 animate-fade-in">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-pink-500 rounded-full animate-spin animate-reverse delay-150"></div>
              </div>
              <p className="text-lg text-slate-300 font-medium">Analyzing image...</p>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-150"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-300"></div>
              </div>
            </div>
          )}

          {/* Image preview and results */}
          {image && !loading && (
            <div className="mt-8 grid md:grid-cols-2 gap-8 animate-fade-in">
              {/* Image preview */}
              <div className="group">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Uploaded Image
                </h3>
                <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-600 shadow-2xl">
                  <img 
                    src={URL.createObjectURL(image)} 
                    alt="Uploaded image"
                    className="w-full max-h-80 object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none"></div>
                </div>
              </div>

              {/* Results */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  Detection Results
                </h3>
                
                {result ? (
                  <div className={`
                    relative p-6 rounded-2xl backdrop-blur-xl border shadow-2xl
                    bg-gradient-to-br ${getResultColor()}
                    animate-fade-in
                  `}>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getResultIcon()}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">
                          Analysis Complete
                        </h4>
                        <p className="text-slate-200 leading-relaxed">
                          {result}
                        </p>
                      </div>
                    </div>
                    
                    {/* Confidence indicator */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between text-sm text-slate-300">
                        <span>Confidence Level</span>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div 
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < 4 ? 'bg-white/60' : 'bg-white/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-600 text-center">
                    <p className="text-slate-400">Results will appear here after analysis</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-slate-500 text-sm">
          <p>Secure • Private • Lightning Fast</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animate-reverse {
          animation-direction: reverse;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
    </div>
  );
}
