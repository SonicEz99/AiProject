"use client";
import { useState, useRef, useEffect } from "react";
import {
  Upload,
  Zap,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  StopCircle,
  RotateCcw,
} from "lucide-react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(null); // Track if file is image or video
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [ws, setWs] = useState(null); // WebSocket state

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const videoPlayerRef = useRef(null);

  const sendFrame = () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;
  const context = canvas?.getContext("2d");

  if (!video || !canvas || !context || !ws || ws.readyState !== WebSocket.OPEN) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(
    (blob) => {
      if (blob) {
        console.log("📤 Sending frame:", blob.size, "bytes");
        ws.send(blob);
      } else {
        console.warn("⚠️ Blob creation failed");
      }
    },
    "image/jpeg",
    0.8
  );
};

  // Initialize WebSocket connection
  useEffect(() => {
    if (cameraActive) {
      const websocket = new WebSocket("ws://127.0.0.1:8000/stream"); // Update with your FastAPI WebSocket endpoint
      websocket.onopen = () => {
        console.log("WebSocket connected");
      };
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setResult(data.numberPlate || "No number plate detected");
      };
      websocket.onclose = () => {
        console.log("WebSocket disconnected");
      };
      websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setResult("Error in WebSocket connection");
      };
      setWs(websocket);

      return () => {
        websocket.close();
      };
    }
  }, [cameraActive]);

  // Send video frames to WebSocket
  // useEffect(() => {
  //   if (cameraActive && ws && ws.readyState === WebSocket.OPEN) {
  //     const video = videoRef.current;
  //     const canvas = canvasRef.current;
  //     const context = canvas.getContext("2d");

  //     // const sendFrame = () => {
  //     //   console.log("🌀 sendFrame called");
  //     //   if (!video || !canvas || !ws || ws.readyState !== WebSocket.OPEN)
  //     //     return;

  //     //   canvas.width = video.videoWidth;
  //     //   canvas.height = video.videoHeight;
  //     //   context.drawImage(video, 0, 0, canvas.width, canvas.height);

  //     //   canvas.toBlob(
  //     //     (blob) => {
  //     //       if (blob) {
  //     //         console.log("📤 Sending frame:", blob.size, "bytes");
  //     //         ws.send(blob);
  //     //       } else {
  //     //         console.warn("⚠️ Blob creation failed");
  //     //       }
  //     //     },
  //     //     "image/jpeg",
  //     //     0.8 // JPEG quality
  //     //   );
  //     // };

  //     const interval = setInterval(sendFrame, 100); // Send 10 frames per second
  //     return () => clearInterval(interval);
  //   }
  // }, [cameraActive, ws]);

  useEffect(() => {
  let interval;

  if (cameraActive && ws) {
    const startFrameSending = () => {
      interval = setInterval(() => {
        sendFrame(); // must be defined in outer scope
      }, 200); // lower frame rate for debugging
    };

    if (ws.readyState === WebSocket.OPEN) {
      console.log("🟢 WebSocket is open, start sending");
      startFrameSending();
    } else {
      ws.onopen = () => {
        console.log("🟢 WebSocket onopen triggered, start sending");
        startFrameSending();
      };
    }
  }

  return () => {
    if (interval) clearInterval(interval);
  };
}, [cameraActive, ws]);


  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFileType(selectedFile.type.startsWith("video/") ? "video" : "image");
    processFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (
      droppedFile &&
      (droppedFile.type.startsWith("image/") ||
        droppedFile.type.startsWith("video/"))
    ) {
      setFileType(droppedFile.type.startsWith("video/") ? "video" : "image");
      processFile(droppedFile);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
    if (ws) {
      ws.close();
      setWs(null);
    }
  };

  const switchCamera = async () => {
    if (stream) {
      stopCamera();
      setFacingMode(facingMode === "user" ? "environment" : "user");
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "camera-capture.jpg", {
            type: "image/jpeg",
          });
          setFileType("image");
          processFile(file);
          stopCamera();
        }
      },
      "image/jpeg",
      0.8
    );
  };

  const processFile = async (file) => {
    setFile(file);
    setLoading(true);
    setResult("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/detect", {
        method: "POST",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_X_API_KEY, // Replace with your actual API key
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.numberPlate || "No number plate detected");
    } catch (error) {
      console.error("Error:", error);
      setResult("Error processing file. Please try again.");
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
    if (result.includes("Error") || result.includes("No number plate")) {
      return <AlertCircle className="text-orange-400" />;
    }
    return <CheckCircle className="text-green-400" />;
  };

  const getResultColor = () => {
    if (result.includes("Error") || result.includes("No number plate")) {
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

        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=`60` height=`60` viewBox=`0 0 60 60` xmlns=`http://www.w3.org/2000/svg`%3E%3Cg fill=`none` fill-rule=`evenodd`%3E%3Cg fill=`%239C92AC` fill-opacity=`0.05`%3E%3Ccircle cx=`30` cy=`30` r=`1`/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>

        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Number Plate Detection
              </h1>
            </div>
            <p className="text-xl text-slate-300 max-w-2xl">
              Advanced neural analysis to detect vehicle number plates with high
              accuracy
            </p>
          </div>

          <div className="w-full max-w-4xl">
            {cameraActive ? (
              <div className="mb-8">
                <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-2 border-slate-600 rounded-3xl p-6 shadow-2xl">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-h-96 object-cover rounded-2xl bg-black"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                      <button
                        onClick={switchCamera}
                        className="p-3 bg-slate-700/80 hover:bg-slate-600/80 rounded-full text-white transition-all duration-200 backdrop-blur-sm"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                      <button
                        onClick={captureImage}
                        className="p-4 bg-purple-500 hover:bg-purple-600 rounded-full text-white transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                      >
                        <Camera className="w-6 h-6" />
                      </button>
                      <button
                        onClick={stopCamera}
                        className="p-3 bg-red-500/80 hover:bg-red-600/80 rounded-full text-white transition-all duration-200 backdrop-blur-sm"
                      >
                        <StopCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-slate-300">
                      Streaming video for real-time number plate detection
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`relative group transition-all duration-300 ${
                  dragOver ? "scale-105" : "hover:scale-102"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="file-upload"
                />
                <div
                  className={`
                    relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 
                    backdrop-blur-xl border-2 border-dashed rounded-3xl p-12 text-center
                    transition-all duration-300 shadow-2xl
                    ${
                      dragOver
                        ? "border-purple-400 bg-purple-500/10 shadow-purple-500/25"
                        : "border-slate-600 hover:border-slate-500 hover:shadow-slate-500/25"
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-6">
                    <div
                      className={`
                        p-6 rounded-full transition-all duration-300
                        ${
                          dragOver
                            ? "bg-purple-500/20 text-purple-300"
                            : "bg-slate-700/50 text-slate-300 group-hover:bg-slate-600/50"
                        }
                      `}
                    >
                      <Upload className="w-12 h-12" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-white mb-2">
                        {dragOver
                          ? "Drop your file here"
                          : "Upload Image or Video for Analysis"}
                      </h3>
                      <p className="text-slate-400 text-lg mb-4">
                        Drag & drop or click to select • PNG, JPG, WebP, MP4,
                        WebM supported
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Zap className="w-4 h-4" />
                      <span>
                        Powered by advanced number plate detection algorithms
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={startCamera}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full text-white font-medium transition-all duration-200 shadow-lg hover:shadow-purple-500/25 mt-4"
            >
              <Camera className="w-5 h-5" />
              Use Camera for Real-Time Detection
            </button>

            {cameraActive && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  Real-Time Detection Results
                </h3>
                {result ? (
                  <div
                    className={`
                      relative p-6 rounded-2xl backdrop-blur-xl border shadow-2xl
                      bg-gradient-to-br ${getResultColor()}
                    `}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getResultIcon()}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">
                          Real-Time Analysis
                        </h4>
                        <p className="text-slate-200 leading-relaxed">
                          Number Plate: {result}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-600 text-center">
                    <p className="text-slate-400">
                      Waiting for detection results...
                    </p>
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-pink-500 rounded-full animate-spin reverse delay-150"></div>
                </div>
                <p className="text-lg text-slate-300 font-medium">
                  Analyzing {fileType}...
                </p>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-150"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-300"></div>
                </div>
              </div>
            )}

            {file && !loading && (
              <div className="mt-8 grid md:grid-cols-2 gap-8">
                <div className="group">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    {file.name === "camera-capture.jpg"
                      ? "Captured Image"
                      : fileType === "video"
                      ? "Uploaded Video"
                      : "Uploaded Image"}
                  </h3>
                  <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-600 shadow-2xl">
                    {fileType === "video" ? (
                      <video
                        ref={videoPlayerRef}
                        src={URL.createObjectURL(file)}
                        controls
                        className="w-full max-h-80 object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="File for analysis"
                        className="w-full max-h-80 object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none"></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    Detection Results
                  </h3>
                  {result ? (
                    <div
                      className={`
                        relative p-6 rounded-2xl backdrop-blur-xl border shadow-2xl
                        bg-gradient-to-br ${getResultColor()}
                      `}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {getResultIcon()}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-2">
                            Analysis Complete
                          </h4>
                          <p className="text-slate-200 leading-relaxed">
                            Number Plate: {result}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between text-sm text-slate-300">
                          <span>Confidence Level</span>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < 4 ? "bg-white/60" : "bg-white/20"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-slate-800/30 backdrop-blur-xl border border-slate-600 text-center">
                      <p className="text-slate-400">
                        Results will appear here after analysis
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-16 text-center text-slate-500 text-sm">
            <p>Secure • Private • Lightning Fast</p>
          </div>
        </div>

        <style jsx>{`
          .hover\\:scale-102:hover {
            transform: scale(1.02);
          }
          .delay-150 {
            animation-delay: 150ms;
          }
          .delay-300 {
            animation-delay: 300ms;
          }
          .delay-1000 {
            animation-delay: 1000ms;
          }
          .delay-2000 {
            animation-delay: 2000ms;
          }
          .reverse {
            animation-direction: reverse;
          }
        `}</style>
      </div>
    </div>
  );
}
