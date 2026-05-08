// apps/web/src/pages/editor-page.tsx
import { Monitor } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CanvasResizeDialog } from "@/components/editor/common/canvas-resize-dialog";
import {
  AutosaveRecoveryBanner,
  ExportDialog,
  saveEditorState,
  useAutosave,
} from "@/components/editor/common/export-dialog";
import { FillDialog } from "@/components/editor/common/fill-dialog";
import { ImageResizeDialog } from "@/components/editor/common/image-resize-dialog";
import { HorizontalRuler, VerticalRuler } from "@/components/editor/common/rulers";
import { WelcomeScreen } from "@/components/editor/common/welcome-screen";
import { EditorCanvas } from "@/components/editor/editor-canvas";
import { EditorOptionsBar } from "@/components/editor/editor-options-bar";
import { EditorRightPanel } from "@/components/editor/editor-right-panel";
import { EditorStatusBar } from "@/components/editor/editor-status-bar";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { useEditorShortcuts } from "@/hooks/use-editor-shortcuts";
import { useMobile } from "@/hooks/use-mobile";
import { useEditorStore } from "@/stores/editor-store";

export function EditorPage() {
  const isMobile = useMobile();
  const sourceImageUrl = useEditorStore((s) => s.sourceImageUrl);
  const isDirty = useEditorStore((s) => s.isDirty);
  const loadImage = useEditorStore((s) => s.loadImage);
  const rulersVisible = useEditorStore((s) => s.rulersVisible);
  const [showExport, setShowExport] = useState(false);
  const [showCanvasResize, setShowCanvasResize] = useState(false);
  const [showImageResize, setShowImageResize] = useState(false);
  const [fillDialogOpen, setFillDialogOpen] = useState(false);

  // Autosave recovery
  const { recoveryData, dismissRecovery, restoreRecovery } = useAutosave();

  // Issue #10: Shortcuts belong at page level, not canvas level
  useEditorShortcuts({
    onSave: () => saveEditorState(),
    onExport: () => setShowExport(true),
    onFillDialog: () => setFillDialogOpen(true),
  });

  // Listen for fill-dialog custom event (dispatched from Shift+Backspace shortcut)
  useEffect(() => {
    const handler = () => setFillDialogOpen(true);
    window.addEventListener("snapotter:open-fill-dialog", handler);
    return () => window.removeEventListener("snapotter:open-fill-dialog", handler);
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => loadImage(url, img.naturalWidth, img.naturalHeight);
          img.src = url;
          return;
        }
      }
    },
    [loadImage],
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("url");
    if (url) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => loadImage(url, img.naturalWidth, img.naturalHeight);
      img.src = url;
    }
  }, [loadImage]);

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Monitor size={48} className="text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Desktop Recommended</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          The image editor works best on desktop screens. Please switch to a device with a larger
          display for the full editing experience.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Autosave recovery banner */}
      {recoveryData && (
        <AutosaveRecoveryBanner
          data={recoveryData}
          onRestore={restoreRecovery}
          onDiscard={dismissRecovery}
        />
      )}
      <EditorOptionsBar />
      {/* Horizontal ruler along the top edge */}
      {rulersVisible && <HorizontalRuler />}
      <div className="flex flex-1 overflow-hidden">
        <EditorToolbar />
        {/* Vertical ruler along the left edge */}
        {rulersVisible && <VerticalRuler />}
        <div className="relative flex-1 overflow-hidden bg-muted/30">
          <EditorCanvas
            onCanvasResize={() => setShowCanvasResize(true)}
            onImageResize={() => setShowImageResize(true)}
          />
          {!sourceImageUrl && <WelcomeScreen />}
        </div>
        <EditorRightPanel />
      </div>
      <EditorStatusBar />
      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
      <CanvasResizeDialog open={showCanvasResize} onClose={() => setShowCanvasResize(false)} />
      <ImageResizeDialog open={showImageResize} onClose={() => setShowImageResize(false)} />
      <FillDialog open={fillDialogOpen} onClose={() => setFillDialogOpen(false)} />
    </div>
  );
}
