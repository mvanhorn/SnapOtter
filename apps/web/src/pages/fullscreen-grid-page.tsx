import type { CategoryInfo, Modality, Tool } from "@snapotter/shared";
import { ANALYTICS_EVENTS, CATEGORIES, MODALITIES, TOOLS } from "@snapotter/shared";
import {
  AudioLines,
  Eye,
  EyeOff,
  FileImage,
  FileText,
  Image,
  LayoutGrid,
  List,
  Search,
  Table,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { OtterLogo } from "@/components/common/otter-logo";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { useTranslation } from "@/contexts/i18n-context";
import { useFuseSearch } from "@/hooks/use-fuse-search";
import { useMobile } from "@/hooks/use-mobile";
import { track } from "@/lib/analytics";
import { apiGet } from "@/lib/api";
import { ICON_MAP } from "@/lib/icon-map";
import { getCategoryName, getModalityName, getToolDescription, getToolName } from "@/lib/tool-i18n";
import { cn } from "@/lib/utils";
import { useFeaturesStore } from "@/stores/features-store";

const MODALITY_TABS = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "image", label: "Image", icon: Image },
  { id: "video", label: "Video", icon: Video },
  { id: "audio", label: "Audio", icon: AudioLines },
  { id: "document", label: "Docs", icon: FileText },
] as const;

export function FullscreenGridPage() {
  const { t } = useTranslation();
  const isMobile = useMobile();
  const [search, setSearch] = useState("");
  const [showDetails, setShowDetails] = useState(true);
  const navigate = useNavigate();
  const [disabledTools, setDisabledTools] = useState<string[]>([]);
  const [experimentalEnabled, setExperimentalEnabled] = useState(false);
  const [modalityTab, setModalityTab] = useState<string>("all");
  const fetchFeatures = useFeaturesStore((s) => s.fetch);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  useEffect(() => {
    apiGet<{ settings: Record<string, string> }>("/v1/settings")
      .then((data) => {
        setDisabledTools(
          data.settings.disabledTools ? JSON.parse(data.settings.disabledTools) : [],
        );
        setExperimentalEnabled(data.settings.enableExperimentalTools === "true");
      })
      .catch(() => {});
  }, []);

  const visibleTools = useMemo(() => {
    return TOOLS.filter((t) => {
      if (disabledTools.includes(t.id)) return false;
      if (t.experimental && !experimentalEnabled) return false;
      return true;
    });
  }, [disabledTools, experimentalEnabled]);

  const modalityFiltered = useMemo(() => {
    if (modalityTab === "all") return visibleTools;
    if (modalityTab === "document")
      return visibleTools.filter((t) => t.modality === "document" || t.modality === "file");
    return visibleTools.filter((t) => t.modality === modalityTab);
  }, [visibleTools, modalityTab]);

  const filteredTools = useFuseSearch(modalityFiltered, search);

  useEffect(() => {
    if (!search) return;
    const timer = setTimeout(() => {
      track(ANALYTICS_EVENTS.SEARCH, {
        query: search,
        results_count: filteredTools.length,
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [search, filteredTools.length]);

  const groupedTools = useMemo(() => {
    const groups = new Map<string, Tool[]>();
    for (const tool of filteredTools) {
      const list = groups.get(tool.category) || [];
      list.push(tool);
      groups.set(tool.category, list);
    }
    return groups;
  }, [filteredTools]);

  const activeCategories = CATEGORIES.filter((cat) => groupedTools.has(cat.id));

  /** Map each modality to its list of active categories (for "All" tab grouping). */
  const modalitySections = useMemo(() => {
    if (modalityTab !== "all") return null;
    const catToModality = new Map<string, Modality>();
    for (const tool of filteredTools) {
      const key = tool.modality === "file" ? ("document" as Modality) : tool.modality;
      if (!catToModality.has(tool.category)) {
        catToModality.set(tool.category, key);
      }
    }
    const sections: { modality: (typeof MODALITIES)[number]; categories: CategoryInfo[] }[] = [];
    for (const mod of MODALITIES) {
      if (mod.id === "file") continue;
      const cats = activeCategories.filter((c) => catToModality.get(c.id) === mod.id);
      if (cats.length > 0) sections.push({ modality: mod, categories: cats });
    }
    return sections;
  }, [modalityTab, filteredTools, activeCategories]);

  return (
    <div className={cn("min-h-screen bg-background text-foreground", isMobile && "pb-20")}>
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-bold text-foreground shrink-0"
          >
            <OtterLogo className="h-6 w-6 text-primary" />
            <span className="text-primary">SnapOtter</span>
          </Link>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.common.search}
              className="w-full ps-10 pe-4 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Toggle details */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm transition-colors",
              showDetails
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {showDetails ? t.fullscreenGrid.hideDetails : t.fullscreenGrid.showDetails}
            </span>
          </button>

          {/* Switch to sidebar view */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
            title="Switch to sidebar view"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">{t.fullscreenGrid.sidebarButton}</span>
          </button>
        </div>
      </header>

      {/* Modality tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="flex flex-wrap gap-2">
          {MODALITY_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = modalityTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setModalityTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                <TabIcon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="sr-only">{t.nav.tools}</h1>
        {activeCategories.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">{t.fullscreenGrid.noToolsFound}</p>
            <p className="text-sm mt-1">{t.fullscreenGrid.tryDifferent}</p>
          </div>
        ) : modalitySections ? (
          /* "All" tab: render with modality section headers */
          <div className="space-y-10">
            {modalitySections.map((section) => {
              const SectionIcon = ICON_MAP[section.modality.icon] as React.ComponentType<{
                className?: string;
              }>;
              return (
                <section key={section.modality.id}>
                  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border">
                    {SectionIcon && (
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: `${section.modality.color}15`,
                          color: section.modality.color,
                        }}
                      >
                        <SectionIcon className="h-5 w-5" />
                      </div>
                    )}
                    <h2 className="text-lg font-semibold text-foreground">
                      {getModalityName(
                        t,
                        section.modality.id,
                        section.modality.id === "document"
                          ? "Documents & Files"
                          : section.modality.name,
                      )}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {section.categories.map((category) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        tools={groupedTools.get(category.id) || []}
                        showDetails={showDetails}
                        accentColor={section.modality.color}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          /* Specific modality tab selected */
          <div>
            {(() => {
              const activeMod = MODALITIES.find((m) => m.id === modalityTab);
              const ModIcon = activeMod
                ? (ICON_MAP[activeMod.icon] as React.ComponentType<{ className?: string }>)
                : null;
              return activeMod ? (
                <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border">
                  {ModIcon && (
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: `${activeMod.color}15`,
                        color: activeMod.color,
                      }}
                    >
                      <ModIcon className="h-5 w-5" />
                    </div>
                  )}
                  <h2 className="text-lg font-semibold text-foreground">
                    {getModalityName(
                      t,
                      activeMod.id,
                      activeMod.id === "document" ? "Documents & Files" : activeMod.name,
                    )}
                  </h2>
                </div>
              ) : null;
            })()}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeCategories.map((category) => {
                const activeMod = MODALITIES.find((m) => m.id === modalityTab);
                return (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    tools={groupedTools.get(category.id) || []}
                    showDetails={showDetails}
                    accentColor={activeMod?.color}
                  />
                );
              })}
            </div>
          </div>
        )}
      </main>
      {isMobile && <MobileBottomNav />}
    </div>
  );
}

function CategoryCard({
  category,
  tools,
  showDetails,
  accentColor,
}: {
  category: CategoryInfo;
  tools: Tool[];
  showDetails: boolean;
  accentColor?: string;
}) {
  const { t } = useTranslation();
  const CategoryIcon =
    (ICON_MAP[category.icon] as React.ComponentType<{ className?: string }>) ?? LayoutGrid;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden" style={undefined}>
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: `${category.color}15` }}
      >
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${category.color}25`, color: category.color }}
        >
          <CategoryIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-sm">
            {getCategoryName(t, category.id, category.name)}
          </h3>
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${category.color}20`,
            color: category.color,
          }}
        >
          {tools.length}
        </span>
      </div>

      {/* Tool list */}
      <div className="p-2">
        {tools.map((tool) => {
          const ToolIcon =
            (ICON_MAP[tool.icon] as React.ComponentType<{ className?: string }>) ?? FileImage;
          return (
            <Link
              key={tool.id}
              to={tool.route}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <ToolIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {getToolName(t, tool.id, tool.name)}
                </p>
                {showDetails && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {getToolDescription(t, tool.id, tool.description)}
                  </p>
                )}
              </div>
              {tool.experimental && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-medium shrink-0">
                  {t.common.experimental}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
