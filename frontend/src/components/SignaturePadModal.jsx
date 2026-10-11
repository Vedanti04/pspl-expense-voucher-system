import React, { useRef, useState, useEffect } from "react";
import { Pen, Upload, RotateCcw, Check, X } from "lucide-react";

export function SignaturePadModal({ isOpen, onClose, onSave, title = "Provide Signature", requiredRole = "Employee" }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [activeTab, setActiveTab] = useState("draw");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);

  useEffect(() => {
    if (isOpen && activeTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  function startDrawing(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  }

  function draw(e) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      alert("Please upload a PNG, JPG, or WebP image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("File size must not exceed 2MB.");
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = () => setUploadPreview(reader.result);
    reader.readAsDataURL(file);
  }

  function handleConfirm() {
    if (activeTab === "draw") {
      if (!hasDrawn) {
        alert("Please draw your signature before confirming.");
        return;
      }
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL("image/png");
      onSave({ type: "base64", data: dataUrl });
    } else {
      if (!uploadedFile) {
        alert("Please choose a signature image file to upload.");
        return;
      }
      onSave({ type: "file", file: uploadedFile, preview: uploadPreview });
    }
    onClose();
  }

  return (
    <div className="modal-backdrop-layer">
      <div className="modal-window-box max-w-lg">
        {/* Header */}
        <div className="modal-header-section">
          <div>
            <h3 className="modal-heading-title">{title}</h3>
            <p className="modal-sub-label">Official digital signature verification for {requiredRole}</p>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="sig-tabs-row">
          <button
            type="button"
            className={`sig-tab-btn ${activeTab === "draw" ? "active" : ""}`}
            onClick={() => setActiveTab("draw")}
          >
            <Pen size={15} /> Draw Signature
          </button>
          <button
            type="button"
            className={`sig-tab-btn ${activeTab === "upload" ? "active" : ""}`}
            onClick={() => setActiveTab("upload")}
          >
            <Upload size={15} /> Upload Image File
          </button>
        </div>

        {/* Draw Body */}
        {activeTab === "draw" && (
          <div className="sig-canvas-wrapper">
            <div className="sig-canvas-border">
              <canvas
                ref={canvasRef}
                width={480}
                height={160}
                className="sig-canvas-element"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <span className="sig-canvas-watermark">
                Sign inside the box using mouse or touch
              </span>
            </div>
            <div className="sig-canvas-controls">
              <button
                type="button"
                className="btn-clear-canvas"
                onClick={clearCanvas}
              >
                <RotateCcw size={13} /> Clear Canvas
              </button>
              <span className="sig-canvas-dim">Canvas 480 × 160 px</span>
            </div>
          </div>
        )}

        {/* Upload Body */}
        {activeTab === "upload" && (
          <div className="sig-upload-wrapper">
            {uploadPreview ? (
              <div className="sig-upload-preview-box">
                <img
                  src={uploadPreview}
                  alt="Signature preview"
                  className="sig-upload-img"
                />
                <span className="sig-upload-filename">{uploadedFile?.name}</span>
                <label className="btn-upload-reselect">
                  Change Signature Image
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden-file-input" onChange={handleFileUpload} />
                </label>
              </div>
            ) : (
              <label className="sig-upload-dropzone">
                <Upload size={36} className="dropzone-icon" />
                <span className="dropzone-main-text">Click to select signature image</span>
                <span className="dropzone-sub-text">PNG, JPG, or WEBP (Max 2MB)</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden-file-input" onChange={handleFileUpload} />
              </label>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="modal-footer-section">
          <button type="button" className="btn-modal-action secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-modal-action primary" onClick={handleConfirm}>
            <Check size={16} /> Attach Signature
          </button>
        </div>
      </div>
    </div>
  );
}