import type { Tool } from "@snapotter/shared";
import { CATEGORIES, TOOLS } from "@snapotter/shared";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ToolCard } from "@/components/common/tool-card.js";
import { AppLayout } from "@/components/layout/app-layout.js";
import { Footer } from "@/components/layout/footer.js";
import { useTranslation } from "@/contexts/i18n-context";
import { useFuseSearch } from "@/hooks/use-fuse-search.js";
import { usePageTitle } from "@/hooks/use-page-title.js";
import { useRecentTools } from "@/hooks/use-recent-tools.js";
import { format } from "@/lib/format.js";
import { getCategoryName, getToolName } from "@/lib/tool-i18n.js";
import { cn } from "@/lib/utils.js";
import { useSettingsStore } from "@/stores/settings-store";

// ── Constants ────────────────────────────────────────────────────

interface TabDef {
  key: string;
  label: string;
  modalityKey?: string; // maps to Tool.modality; undefined = "all"
}

// ── Home Page ────────────────────────────────────────────────────

export function HomePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { fetch: fetchSettings, disabledTools, experimentalEnabled, loaded } =
    useSettingsStore();
  const recentToolIds = useRecentTools();

  usePageTitle();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ── Tab definitions ──────────────────────────────────────────

  const tabs: TabDef[] = useMemo(
    () => [
      { key: "all", label: t.homePage.all },
      { key: "image", label: "Image" },
      { key: "video", label: "Video" },
      { key: "audio", label: "Audio" },
      { key: "document", label: t.homePage.documents },
      { key: "data", label: t.homePage.data },
    ],
    [t],
  );

  // ── Visible tools (exclude disabled + experimental unless enabled) ──

  const visibleTools = useMemo(() => {
    if (!loaded) return [];
    return TOOLS.filter((tool) => {
      if (tool.disabled) return false;
      if (disabledTools.includes(tool.id)) return false;
      if (tool.experimental && !experimentalEnabled) return false;
      return true;
    });
  }, [disabledTools, experimentalEnabled, loaded]);

  // ── Search (global, searches all tools regardless of active tab) ──

  const searchResults = useFuseSearch(visibleTools, search);

  // ── Tab-filtered tools ──────────────────────────────────────

  const tabTools = useMemo(() => {
    if (activeTab === "all") return visibleTools;
    const modalityKey = activeTab === "data" ? "file" : activeTab;
    return visibleTools.filter((tool) => tool.modality === modalityKey);
  }, [visibleTools, activeTab]);

  // ── Group by category for modality tabs ─────────────────────

  const groupedTools = useMemo(() => {
    const map = new Map<string, Tool[]>();
    for (const tool of tabTools) {
      const existing = map.get(tool.category);
      if (existing) {
        existing.push(tool);
      } else {
        map.set(tool.category, [tool]);
      }
    }
    return map;
  }, [tabTools]);

  // ── Tab counts ──────────────────────────────────────────────

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: visibleTools.length };
    for (const tool of visibleTools) {
      const tabKey = tool.modality === "file" ? "data" : tool.modality;
      counts[tabKey] = (counts[tabKey] ?? 0) + 1;
    }
    return counts;
  }, [visibleTools]);

  // ── Recent tools (resolve IDs to Tool objects) ──────────────

  const recentTools = useMemo(
    () =>
      recentToolIds
        .map((id) => visibleTools.find((tool) => tool.id === id))
        .filter((tool): tool is Tool => tool != null),
    [recentToolIds, visibleTools],
  );

  // ── Render ──────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          {/* Search bar */}
          <HomeSearchBar
            value={search}
            onChange={setSearch}
            placeholder={format(t.homePage.searchPlaceholder, {
              count: visibleTools.length,
            })}
          />

          {/* Modality tabs */}
          <ModalityTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={tabCounts}
          />

          {/* Content */}
          {search ? (
            <SearchResults results={searchResults} query={search} onClear={() => setSearch("")} />
          ) : activeTab === "all" ? (
            <AllTabContent
              recentTools={recentTools}
              groupedTools={groupedTools}
            />
          ) : (
            <ModalityTabContent groupedTools={groupedTools} />
          )}
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </AppLayout>
  );
}

// ── Search Bar ───────────────────────────────────────────────────

function HomeSearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-focus when navigated here with ?focus=search (e.g. from Cmd+K on a tool page)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("focus") === "search") {
      inputRef.current?.focus();
      navigate("/", { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <div className="relative max-w-xl mx-auto mb-6">
      <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        data-search-input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full ps-12 pe-10 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute end-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

// ── Modality Tabs ────────────────────────────────────────────────

function ModalityTabs({
  tabs,
  activeTab,
  onTabChange,
  counts,
}: {
  tabs: TabDef[];
  activeTab: string;
  onTabChange: (key: string) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="mb-6 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-2 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted",
            )}
          >
            {tab.label} ({counts[tab.key] ?? 0})
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Search Results ───────────────────────────────────────────────

function SearchResults({
  results,
  query,
  onClear,
}: {
  results: Tool[];
  query: string;
  onClear: () => void;
}) {
  const { t } = useTranslation();

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{format(t.homePage.noToolsMatch, { query })}</p>
        <button
          type="button"
          onClick={onClear}
          className="mt-3 text-sm text-primary hover:underline"
        >
          {t.homePage.clearSearch}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
      {results.map((tool) => (
        <ToolCard key={tool.id} tool={tool} showModalityBadge />
      ))}
    </div>
  );
}

// ── All Tab Content ──────────────────────────────────────────────

function AllTabContent({
  recentTools,
  groupedTools,
}: {
  recentTools: Tool[];
  groupedTools: Map<string, Tool[]>;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      {/* Recent tools (only shown if user has history) */}
      {recentTools.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
            {t.homePage.recent}
          </h2>
          <div className="flex flex-wrap gap-2">
            {recentTools.map((tool) => (
              <Link
                key={tool.id}
                to={tool.route}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {getToolName(t, tool.id, tool.name)}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All tools grouped by category */}
      {CATEGORIES.filter((cat) => groupedTools.has(cat.id)).map((category) => {
        const tools = groupedTools.get(category.id) ?? [];
        return (
          <section key={category.id}>
            <h2 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
              {getCategoryName(t, category.id, category.name)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} variant="descriptive" />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ── Modality Tab Content (grouped by category) ───────────────────

function ModalityTabContent({ groupedTools }: { groupedTools: Map<string, Tool[]> }) {
  const { t } = useTranslation();

  if (groupedTools.size === 0) {
    return (
      <p className="text-center text-muted-foreground py-16">{t.fullscreenGrid.noToolsFound}</p>
    );
  }

  return (
    <div className="space-y-8">
      {CATEGORIES.filter((cat) => groupedTools.has(cat.id)).map((category) => {
        const tools = groupedTools.get(category.id) ?? [];
        return (
          <section key={category.id}>
            <h2 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
              {getCategoryName(t, category.id, category.name)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} variant="descriptive" />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
