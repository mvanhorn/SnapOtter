import { CATEGORIES, MODALITIES, type Modality, TOOLS } from "@snapotter/shared";
import { LayoutGrid } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/contexts/i18n-context";
import { useFuseSearch } from "@/hooks/use-fuse-search";
import { ICON_MAP } from "@/lib/icon-map";
import { getCategoryName, getModalityName } from "@/lib/tool-i18n";
import { cn } from "@/lib/utils";
import { useFeaturesStore } from "@/stores/features-store";
import { useSettingsStore } from "@/stores/settings-store";
import { SearchBar } from "../common/search-bar";
import { ToolCard } from "../common/tool-card";

type ModalityFilter = "all" | "document" | Exclude<Modality, "file">;

const TAB_MODALITIES = MODALITIES.filter((m) => m.id !== "file");

export function ToolPanel() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedModality, setSelectedModality] = useState<ModalityFilter>("all");
  const { disabledTools, experimentalEnabled, loaded, fetch } = useSettingsStore();
  const fetchFeatures = useFeaturesStore((s) => s.fetch);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const visibleTools = useMemo(() => {
    if (!loaded) return [];
    return TOOLS.filter((t) => {
      if (disabledTools.includes(t.id)) return false;
      if (t.experimental && !experimentalEnabled) return false;
      return true;
    });
  }, [disabledTools, experimentalEnabled, loaded]);

  const modalityFilteredTools = useMemo(() => {
    if (selectedModality === "all") return visibleTools;
    if (selectedModality === "document")
      return visibleTools.filter(
        (tool) => tool.modality === "document" || tool.modality === "file",
      );
    return visibleTools.filter((tool) => tool.modality === selectedModality);
  }, [visibleTools, selectedModality]);

  const filteredTools = useFuseSearch(modalityFilteredTools, search);

  const groupedByModality = useMemo(() => {
    const byModality = new Map<string, Map<string, typeof TOOLS>>();
    for (const tool of filteredTools) {
      const key = tool.modality === "file" ? "document" : tool.modality;
      const cats = byModality.get(key) ?? new Map<string, typeof TOOLS>();
      const list = cats.get(tool.category) ?? [];
      list.push(tool);
      cats.set(tool.category, list);
      byModality.set(key, cats);
    }
    return byModality;
  }, [filteredTools, selectedModality]);

  return (
    <div className="w-72 border-r border-border bg-background overflow-y-auto flex flex-col shrink-0">
      <div className="p-3 sticky top-0 bg-background z-10">
        {/* Modality filter tabs -- icons + text, docs+files merged */}
        <div className="flex flex-wrap gap-1 mb-2">
          <button
            type="button"
            onClick={() => setSelectedModality("all")}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
              selectedModality === "all"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>All</span>
          </button>
          {TAB_MODALITIES.map((m) => {
            const Icon = ICON_MAP[m.icon] as React.ComponentType<{ className?: string }>;
            const isActive = selectedModality === m.id;
            const label = m.id === "document" ? "Docs" : m.name;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedModality(m.id as ModalityFilter)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                  !isActive && "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
                style={isActive ? { backgroundColor: `${m.color}20`, color: m.color } : undefined}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        <SearchBar value={search} onChange={setSearch} />
      </div>
      <div className="px-3 pb-4 flex-1">
        {MODALITIES.filter((m) => {
          // File-modality tools always merge into the document section
          if (m.id === "file") return false;
          return groupedByModality.has(m.id);
        }).map((modality, idx, arr) => {
          const ModalityIcon = ICON_MAP[modality.icon] as React.ComponentType<{
            className?: string;
          }>;
          const categoryMap = groupedByModality.get(modality.id);
          if (!categoryMap) return null;
          const isLast = idx === arr.length - 1;
          return (
            <div key={modality.id} className={isLast ? "" : "mb-2"}>
              {idx > 0 && <hr className="border-border mb-4" />}
              <div className="flex items-center gap-2 mt-4 mb-3 pl-1">
                {ModalityIcon && (
                  <span className="shrink-0" style={{ color: modality.color }}>
                    <ModalityIcon className="h-4.5 w-4.5" />
                  </span>
                )}
                <h2 className="text-sm font-semibold text-foreground tracking-wide">
                  {getModalityName(
                    t,
                    modality.id,
                    modality.id === "document" ? "Documents & Files" : modality.name,
                  )}
                </h2>
              </div>
              {CATEGORIES.filter((cat) => categoryMap.has(cat.id)).map((category) => (
                <div key={category.id} className="mb-3">
                  <h3 className="text-xs font-medium text-muted-foreground tracking-wider mb-1.5 pl-1">
                    {getCategoryName(t, category.id, category.name)}
                  </h3>
                  <div className="space-y-0.5">
                    {categoryMap.get(category.id)?.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        {filteredTools.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No tools found</p>
        )}
      </div>
    </div>
  );
}
