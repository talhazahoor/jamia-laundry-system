'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check, RefreshCw } from 'lucide-react';

interface WebcamCaptureModalProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
  studentName?: string;
}

export default function WebcamCaptureModal({
  onCapture,
  onClose,
  studentName,
}: WebcamCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 480, facingMode: 'user' },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        setCameraError('Webcam not available or permission denied. Please allow camera access.');
      }
    }
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, 400, 400);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(dataUrl);
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden max-w-md w-full text-white shadow-2xl">
        <div className="p-3 bg-slate-800 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">
              کیمرہ سے تصویر بنائیں {studentName ? `(${studentName})` : ''}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center">
          {cameraError ? (
            <div className="bg-red-900/50 border border-red-500/50 p-4 rounded text-center text-sm text-red-200">
              {cameraError}
            </div>
          ) : capturedImage ? (
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured Student"
                className="w-64 h-64 object-cover rounded-lg border-2 border-emerald-500 shadow"
              />
              <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded shadow">
                تصویر محفوظ ہونے کے لیے تیار ہے
              </span>
            </div>
          ) : (
            <div className="relative w-64 h-64 bg-black rounded-lg overflow-hidden border border-slate-700 shadow">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-2 border-dashed border-emerald-400/40 rounded-lg pointer-events-none" />
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Action buttons */}
          <div className="mt-4 flex gap-3">
            {!capturedImage ? (
              <button
                onClick={takePhoto}
                disabled={!!cameraError}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 shadow"
              >
                <Camera className="w-4 h-4" />
                <span>تصویر کھینچیں (Capture Photo)</span>
              </button>
            ) : (
              <>
                <button
                  onClick={retake}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-2 rounded flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>دوبارہ کھینچیں</span>
                </button>
                <button
                  onClick={confirmPhoto}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4" />
                  <span>محفوظ کریں (Save Photo)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
