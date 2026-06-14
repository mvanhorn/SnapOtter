import { ArrowLeft, CheckCircle2, Download } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/contexts/i18n-context";
import { formatFileSize, triggerDownload } from "@/lib/download";

interface ReviewPanelProps {
  filename: string;
  fileSize: number;
  fileType: string;
  originalSize: number;
  downloadUrl: string;
  onUndo: () => void;
  onStartOver: () => void;
  currentToolId: string;
}

export function ReviewPanel({
  filename,
  fileSize,
  fileType,
  originalSize,
  downloadUrl,
  onUndo,
  onStartOver,
  currentToolId: _currentToolId,
}: ReviewPanelProps) {
  const { t } = useTranslation();

  const sizeDelta = useMemo(() => {
    if (!originalSize || originalSize === 0) return 0;
    return Math.round((1 - fileSize / originalSize) * 100);
  }, [originalSize, fileSize]);

  const handleDownload = () => {
    triggerDownload(downloadUrl, filename);
  };

  return (
    <div className="space-y-3">
      <div className="border-t border-border" />

      {/* Success indicator */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        <span className="text-sm font-medium text-foreground">{t.toolPage.conversionComplete}</span>
      </div>

      {/* Size delta */}
      {originalSize > 0 && (
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.toolPage.original}</span>
            <span className="tabular-nums text-foreground">{formatFileSize(originalSize)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.toolPage.processed}</span>
            <span className="tabular-nums text-foreground">{formatFileSize(fileSize)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.toolPage.saved}</span>
            <span
              className={`tabular-nums font-medium ${
                sizeDelta > 0
                  ? "text-emerald-600"
                  : sizeDelta === 0
                    ? "text-muted-foreground"
                    : "text-foreground"
              }`}
            >
              {sizeDelta === 0
                ? t.toolPage.noChange
                : sizeDelta > 0
                  ? `-${sizeDelta}%`
                  : `+${Math.abs(sizeDelta)}%`}
            </span>
          </div>
        </div>
      )}

      {/* Download button with format + size */}
      <button
        type="button"
        onClick={handleDownload}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90"
      >
        <Download className="h-4 w-4" />
        {t.toolPage.download} {fileType} ({formatFileSize(fileSize)})
      </button>

      {/* Adjust settings */}
      <button
        type="button"
        onClick={onUndo}
        className="w-full py-2 rounded-lg border border-border text-foreground hover:bg-muted text-sm font-medium"
      >
        {t.toolPage.adjustSettings}
      </button>

      {/* Text links */}
      <div className="flex flex-col items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={onStartOver}
          className="text-muted-foreground hover:text-foreground"
        >
          {t.toolPage.startOver}
        </button>
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="h-3 w-3" />
          {t.toolPage.backToTools}
        </Link>
      </div>
    </div>
  );
}
