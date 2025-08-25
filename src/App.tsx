import React, { useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import WatermarkEditor from "./components/WatermarkEditor";
import BatchProcessor from "./components/BatchProcessor";
import "./App.css";

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<
    "home" | "watermark" | "batch"
  >("home");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning" = "success",
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleBackToHome = () => {
    setCurrentView("home");
  };

  if (currentView === "watermark") {
    return (
      <div className="app">
        <WatermarkEditor />
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </div>
    );
  }

  if (currentView === "batch") {
    return (
      <div className="app">
        <BatchProcessor onBack={handleBackToHome} />
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="home-container">
        <div className="home-header">
          <h1 className="home-title">File Zip Manager</h1>
          <p className="home-subtitle">专业的文件处理工具集</p>
        </div>

        <div className="home-content">
          <div className="feature-cards">
            <div
              className="feature-card watermark-card"
              onClick={() => setCurrentView("watermark")}
            >
              <div className="card-icon">
                <svg
                  className="w-16 h-16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="card-content">
                <h2 className="card-title">图片水印编辑器</h2>
                <p className="card-description">
                  为图片添加文字或图片水印，支持批量处理、自定义位置、透明度和样式
                </p>
                <div className="card-features">
                  <span className="feature-tag">批量处理</span>
                  <span className="feature-tag">自定义水印</span>
                  <span className="feature-tag">拖拽定位</span>
                  <span className="feature-tag">多种格式</span>
                </div>
              </div>
              <div className="card-arrow">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            <div
              className="feature-card batch-card"
              onClick={() => setCurrentView("batch")}
            >
              <div className="card-icon">
                <svg
                  className="w-16 h-16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div className="card-content">
                <h2 className="card-title">批处理工具</h2>
                <p className="card-description">
                  批量处理ZIP文件，支持密码解压、嵌套文件处理、自定义文件拷贝和清理
                </p>
                <div className="card-features">
                  <span className="feature-tag">批量解压</span>
                  <span className="feature-tag">密码管理</span>
                  <span className="feature-tag">文件拷贝</span>
                  <span className="feature-tag">自动清理</span>
                </div>
              </div>
              <div className="card-arrow">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="home-footer">
          <p className="footer-text">
            © 2024 File Zip Manager. 专业的文件处理解决方案
          </p>
        </div>
      </div>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default App;
