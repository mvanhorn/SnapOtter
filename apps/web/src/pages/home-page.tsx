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

interface TabDef {
  key: string;
  label: string;
}

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

  const visibleTools = useMemo(() => {
    if (!loaded) return [];
    return TOOLS.filter((tool) => {
      if (tool.disabled) return false;
      if (disabledTools.includes(tool.id)) return false;
      if (tool.experimental && !experimentalEnabled) return false;
      return true;
    });
  }, [disabledTools, experimentalEnabled, loaded]);

  const searchResults = useFuseSearch(visibleTools, search);

  const tabTools = useMemo(() => {
    if (activeTab === "all") return visibleTools;
    const modalityKey = activeTab === "data" ? "file" : activeTab;
    return visibleTools.filter((tool) => tool.modality === modalityKey);
  }, [visibleTools, activeTab]);

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

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: visibleTools.length };
    for (const tool of visibleTools) {
      const tabKey = tool.modality === "file" ? "data" : tool.modality;
      counts[tabKey] = (counts[tabKey] ?? 0) + 1;
    }
    return counts;
  }, [visibleTools]);

  const recentTools = useMemo(
    () =>
      recentToolIds
        .map((id) => visibleTools.find((tool) => tool.id === id))
        .filter((tool): tool is Tool => tool != null),
    [recentToolIds, visibleTools],
  );

  return (
    <AppLayout>
      <div>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <HomeSearchBar
            value={search}
            onChange={setSearch}
            placeholder={format(t.homePage.searchPlaceholder, {
              count: visibleTools.length,
            })}
          />

          <ModalityTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={tabCounts}
          />

          {search ? (
            <SearchResults results={searchResults} query={search} onClear={() => setSearch("")} />
          ) : (
            <ToolGrid recentTools={recentTools} groupedTools={groupedTools} />
          )}
        </div>

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("focus") === "search") {
      inputRef.current?.focus();
      navigate("/", { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <div className="relative mb-8">
      <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        data-search-input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full ps-11 pe-20 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-shadow"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute end-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      ) : (
        <kbd className="absolute end-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded border border-border bg-muted/50 text-[11px] text-muted-foreground font-mono">
          <span className="text-xs">&#8984;</span>K
        </kbd>
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
    <div className="mb-8 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-1.5 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
            <span className={cn("ms-1", activeTab === tab.key ? "opacity-80" : "opacity-50")}>
              {counts[tab.key] ?? 0}
            </span>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {results.map((tool) => (
        <ToolCard key={tool.id} tool={tool} variant="descriptive" showModalityBadge />
      ))}
    </div>
  );
}

// ── Tool Grid (used by both All tab and modality tabs) ───────────

function ToolGrid({
  recentTools,
  groupedTools,
}: {
  recentTools: Tool[];
  groupedTools: Map<string, Tool[]>;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {recentTools.length > 0 && (
        <section>
          <h2 className="text-[11px] font-semibold uppercase text-muted-foreground/70 tracking-widest mb-2">
            {t.homePage.recent}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {recentTools.map((tool) => (
              <Link
                key={tool.id}
                to={tool.route}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm text-muted-foreground border border-border/60 hover:border-border hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {getToolName(t, tool.id, tool.name)}
              </Link>
            ))}
          </div>
        </section>
      )}

      {CATEGORIES.filter((cat) => groupedTools.has(cat.id)).map((category) => {
        const tools = groupedTools.get(category.id) ?? [];
        return (
          <section key={category.id}>
            <h2 className="text-[11px] font-semibold uppercase text-muted-foreground/70 tracking-widest mb-2 pb-1.5 border-b border-border/40">
              {getCategoryName(t, category.id, category.name)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
