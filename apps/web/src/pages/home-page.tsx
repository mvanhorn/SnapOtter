import {
  CATEGORIES,
  MODALITIES,
  PYTHON_SIDECAR_TOOLS,
  TOOL_BUNDLE_MAP,
  TOOLS,
} from "@snapotter/shared";
import { Clock, Download, FileArchive, LayoutGrid, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ImageViewer } from "@/components/common/image-viewer";
import { MultiImageViewer } from "@/components/common/multi-image-viewer";
import { AppLayout } from "@/components/layout/app-layout";
import { DocumentView } from "@/components/tools/document-view";
import { MediaPlayerView } from "@/components/tools/media-player-view";
import { useTranslation } from "@/contexts/i18n-context";
import { useMobile } from "@/hooks/use-mobile";
import { ICON_MAP } from "@/lib/icon-map";
import { getCategoryName, getModalityName, getToolName } from "@/lib/tool-i18n";
import { cn } from "@/lib/utils";
import { useFeaturesStore } from "@/stores/features-store";
import { useFileStore } from "@/stores/file-store";
import { useSettingsStore } from "@/stores/settings-store";

// Tools shown prominently as "quick actions" at the top

let hasAppliedDefaultRedirect = false;

export function HomePage() {
  const { t } = useTranslation();
  const {
    setFiles,
    files,
    reset,
    originalBlobUrl,
    selectedFileName,
    selectedFileSize,
    currentEntry,
  } = useFileStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { fetch: fetchSettings, defaultToolView, loaded: settingsLoaded } = useSettingsStore();
  const { fetch: fetchFeatures, bundles, installing, queued } = useFeaturesStore();
  const isMobile = useMobile();

  useEffect(() => {
    if (location.state?.fromLibrary) {
      navigate(".", { replace: true, state: {} });
    } else {
      reset();
    }
  }, [reset, location.state, navigate]);

  useEffect(() => {
    fetchSettings();
    fetchFeatures();
  }, [fetchSettings, fetchFeatures]);

  useEffect(() => {
    if (
      !hasAppliedDefaultRedirect &&
      settingsLoaded &&
      defaultToolView === "fullscreen" &&
      files.length === 0
    ) {
      hasAppliedDefaultRedirect = true;
      navigate("/fullscreen", { replace: true });
    }
  }, [settingsLoaded, defaultToolView, files.length, navigate]);

  const getToolStatus = useMemo(() => {
    return (toolId: string) => {
      const isAi = (PYTHON_SIDECAR_TOOLS as readonly string[]).includes(toolId);
      if (!isAi) return "installed";
      const bundleId = TOOL_BUNDLE_MAP[toolId];
      if (!bundleId) return "installed";
      if (queued.includes(bundleId)) return "queued";
      if (installing[bundleId]) return "installing";
      const bundle = bundles.find((b) => b.id === bundleId);
      return bundle?.status === "installed" ? "installed" : "not_installed";
    };
  }, [bundles, installing, queued]);

  const handleFiles = useCallback(
    (newFiles: File[]) => {
      reset();
      setFiles(newFiles);
    },
    [setFiles, reset],
  );

  const handleUrlImport = useCallback(
    (file: File) => {
      setFiles([file]);
    },
    [setFiles],
  );

  const [modalityFilter, setModalityFilter] = useState<string>("all");
  const TAB_MODALITIES = useMemo(() => MODALITIES.filter((m) => m.id !== "file"), []);

  const hasFile = files.length > 0;

  // If no file uploaded, show default layout (tool panel + dropzone)
  if (!hasFile) {
    return <AppLayout onFiles={handleFiles} onUrlImport={handleUrlImport} />;
  }

  // File uploaded — mobile: stacked layout
  if (isMobile && hasFile) {
    return (
      <AppLayout showToolPanel={false} onFiles={handleFiles}>
        <h1 className="sr-only">{t.nav.tools}</h1>
        <div className="flex flex-col h-full w-full">
          {/* File info bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <ICON_MAP.CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            <span className="truncate text-sm font-medium text-foreground">
              {selectedFileName ?? files[0].name}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {selectedFileSize ? `${(selectedFileSize / 1024).toFixed(1)} KB` : ""}
            </span>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-muted-foreground hover:text-foreground ms-auto shrink-0"
            >
              {t.homePage.changeFile}
            </button>
          </div>

          {/* Full-width file preview */}
          <div className="flex-1 flex items-center justify-center p-4 min-h-0">
            {files.length > 1 ? (
              <MultiImageViewer />
            ) : currentEntry?.previewLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">{t.homePage.generatingPreview}</p>
                <p className="text-xs text-muted-foreground">{selectedFileName}</p>
              </div>
            ) : currentEntry?.previewKind === "video" || currentEntry?.previewKind === "audio" ? (
              <MediaPlayerView />
            ) : currentEntry?.previewKind === "document" ? (
              <DocumentView />
            ) : currentEntry?.previewKind === "none" ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <FileArchive className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  {selectedFileName ?? files[0].name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedFileSize ? `${(selectedFileSize / 1024).toFixed(1)} KB` : ""}
                </p>
              </div>
            ) : originalBlobUrl ? (
              <ImageViewer
                src={originalBlobUrl}
                filename={selectedFileName ?? files[0].name}
                fileSize={selectedFileSize ?? files[0].size}
              />
            ) : (
              <div className="text-center text-muted-foreground">
                <p>{t.homePage.loadingPreview}</p>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  // File uploaded — desktop: tool selector on left, image preview on right
  return (
    <AppLayout showToolPanel={false} onFiles={handleFiles}>
      <h1 className="sr-only">{t.nav.tools}</h1>
      <div className="flex h-full w-full">
        {/* Left panel: Tool selector */}
        <div className="w-64 lg:w-80 border-r border-border overflow-y-auto shrink-0">
          {/* File info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 text-sm">
              <ICON_MAP.CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <span className="truncate font-medium text-foreground">
                {selectedFileName ?? files[0].name}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedFileSize ? `${(selectedFileSize / 1024).toFixed(1)} KB` : ""}
              {files.length > 1 && ` — ${files.length} files`}
            </p>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-muted-foreground hover:text-foreground mt-2"
            >
              {t.homePage.changeFile}
            </button>
          </div>

          {/* Modality filter tabs */}
          <div className="flex flex-wrap gap-1 px-4 pt-3 pb-2 border-b border-border sticky top-0 bg-background z-10">
            <button
              type="button"
              onClick={() => setModalityFilter("all")}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                modalityFilter === "all"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>All</span>
            </button>
            {TAB_MODALITIES.map((m) => {
              const Icon = ICON_MAP[m.icon] as React.ComponentType<{ className?: string }>;
              const isActive = modalityFilter === m.id;
              const label = m.id === "document" ? "Docs" : m.name;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModalityFilter(m.id)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Tools by modality and category */}
          <div className="p-4">
            {MODALITIES.filter((m) => {
              if (m.id === "file") return false;
              if (modalityFilter !== "all") {
                if (modalityFilter === "document") return m.id === "document";
                return m.id === modalityFilter;
              }
              const key = m.id;
              return TOOLS.some(
                (tool) => tool.modality === key || (key === "document" && tool.modality === "file"),
              );
            }).map((modality) => {
              const ModalityIcon = ICON_MAP[modality.icon] as React.ComponentType<{
                className?: string;
              }>;
              const modalityTools = TOOLS.filter(
                (tool) =>
                  tool.modality === modality.id ||
                  (modality.id === "document" && tool.modality === "file"),
              );
              const categoryMap = new Map<string, typeof TOOLS>();
              for (const tool of modalityTools) {
                const list = categoryMap.get(tool.category) ?? [];
                list.push(tool);
                categoryMap.set(tool.category, list);
              }
              return (
                <div key={modality.id} className="mb-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    {ModalityIcon && (
                      <ModalityIcon className="h-4 w-4 text-foreground/70 shrink-0" />
                    )}
                    <p className="text-xs font-bold uppercase text-foreground/70 tracking-wider">
                      {getModalityName(
                        t,
                        modality.id,
                        modality.id === "document" ? "Documents & Files" : modality.name,
                      )}
                    </p>
                  </div>
                  {CATEGORIES.filter((cat) => categoryMap.has(cat.id)).map((category) => (
                    <div key={category.id} className="mb-4">
                      <p
                        className="text-xs font-medium text-muted-foreground mb-1.5"
                        style={{ color: category.color }}
                      >
                        {getCategoryName(t, category.id, category.name)}
                      </p>
                      <div className="space-y-0.5">
                        {categoryMap.get(category.id)?.map((tool) => {
                          const Icon =
                            (ICON_MAP[tool.icon] as React.ComponentType<{
                              className?: string;
                            }>) ?? ICON_MAP.FileImage;
                          const status = getToolStatus(tool.id);
                          return (
                            <button
                              key={tool.id}
                              type="button"
                              onClick={() => navigate(tool.route)}
                              className="flex items-center gap-2.5 w-full py-1.5 px-2 rounded-lg text-start transition-colors hover:bg-muted text-foreground"
                            >
                              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-sm">{getToolName(t, tool.id, tool.name)}</span>
                              {status === "not_installed" && (
                                <>
                                  <Download
                                    className="h-3.5 w-3.5 text-muted-foreground ms-auto"
                                    aria-hidden="true"
                                  />
                                  <span className="sr-only">{t.a11y.notInstalled}</span>
                                </>
                              )}
                              {status === "queued" && (
                                <>
                                  <Clock
                                    className="h-3.5 w-3.5 text-muted-foreground ms-auto"
                                    aria-hidden="true"
                                  />
                                  <span className="sr-only">{t.a11y.queued}</span>
                                </>
                              )}
                              {status === "installing" && (
                                <>
                                  <Loader2
                                    className="h-3.5 w-3.5 text-muted-foreground ms-auto animate-spin"
                                    aria-hidden="true"
                                  />
                                  <span className="sr-only">{t.a11y.installing}</span>
                                </>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel: File preview (modality-aware) */}
        <div className="flex-1 flex items-center justify-center p-6 min-h-0">
          {files.length > 1 ? (
            <MultiImageViewer />
          ) : currentEntry?.previewLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">{t.homePage.generatingPreview}</p>
              <p className="text-xs text-muted-foreground">{selectedFileName}</p>
            </div>
          ) : currentEntry?.previewKind === "video" || currentEntry?.previewKind === "audio" ? (
            <MediaPlayerView />
          ) : currentEntry?.previewKind === "document" ? (
            <DocumentView />
          ) : currentEntry?.previewKind === "none" ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <FileArchive className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {selectedFileName ?? files[0].name}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedFileSize ? `${(selectedFileSize / 1024).toFixed(1)} KB` : ""}
              </p>
            </div>
          ) : originalBlobUrl ? (
            <ImageViewer
              src={originalBlobUrl}
              filename={selectedFileName ?? files[0].name}
              fileSize={selectedFileSize ?? files[0].size}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              <p>{t.homePage.loadingPreview}</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
