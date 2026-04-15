"use client";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface QrScannerProps {
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
  onScanError?: (error: any) => void;
  onInitError?: (error: any) => void;
  fps?: number;
  qrbox?: number | { width: number; height: number };
  aspectRatio?: number;
  disableFlip?: boolean;
}

const QrScanner = ({
  onScanSuccess,
  onScanError,
  onInitError,
  fps = 10,
  qrbox = 250,
  aspectRatio = 1,
  disableFlip = false,
}: QrScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "qr-reader-element";

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(elementId);
    scannerRef.current = html5QrCode;

    const config = {
      fps,
      qrbox,
      aspectRatio,
      disableFlip,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    };

    html5QrCode
      .start(
        { facingMode: "environment" },
        config,
        (decodedText, decodedResult) => {
          // Stop scanning once we get a result to avoid multiple triggers
          html5QrCode
            .stop()
            .then(() => {
              onScanSuccess(decodedText, decodedResult);
            })
            .catch((err) => console.warn("Error stopping scanner", err));
        },
        onScanError,
      )
      .catch((err) => {
        console.error("Error starting QR scanner:", err);
        if (onInitError) onInitError(err);
      });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((err) => console.error("Error on cleanup stop:", err));
      }
    };
  }, [onScanSuccess, onScanError, fps, qrbox, aspectRatio, disableFlip]);

  return (
    <div style={{ position: "relative", width: "100%", overflow: "hidden", borderRadius: "12px", backgroundColor: "#000" }}>
      <div id={elementId} style={{ width: "100%" }} />
    </div>
  );
};

export default QrScanner;
