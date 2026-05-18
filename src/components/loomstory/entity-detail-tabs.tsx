"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/loomstory/loading-screen";
import { RelationsPanel } from "@/components/loomstory/relations-panel";
import { EntityHistory } from "@/components/loomstory/entity-history";
import { EntityVersions } from "@/components/loomstory/entity-versions";
import { BookOpen, Link2, Clock, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface EntityDetailTabsProps {
  campaignId: string;
  entityType: "npc" | "location" | "faction" | "item";
  entityId: string;
  entityName: string;
  role: string;
  userId: string;
  overviewContent: React.ReactNode;
}

type TabKey = "overview" | "relationships" | "history" | "versions";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "overview", label: "Overview", icon: BookOpen },
  { key: "relationships", label: "Relationships", icon: Link2 },
  { key: "history", label: "History", icon: Clock },
  { key: "versions", label: "Versions", icon: History },
];

export function EntityDetailTabs({
  campaignId,
  entityType,
  entityId,
  entityName,
  role,
  userId,
  overviewContent,
}: EntityDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [relationsData, setRelationsData] = useState<{
    relations: unknown[];
    relationTypes: unknown[];
    knownEntities: unknown[];
  } | null>(null);
  const [historyData, setHistoryData] = useState<{
    events: unknown[];
    conversations: unknown[];
    session_mentions: unknown[];
  } | null>(null);
  const [loadingTab, setLoadingTab] = useState(false);

  const fetchRelations = useCallback(async () => {
    setLoadingTab(true);
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/entities/${entityType}/${entityId}/relations`
      );
      if (res.ok) {
        const data = await res.json();
        setRelationsData(data);
      }
    } catch {
      // Fail silently
    }
    setLoadingTab(false);
  }, [campaignId, entityType, entityId]);

  const fetchHistory = useCallback(async () => {
    setLoadingTab(true);
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/entities/${entityType}/${entityId}/history`
      );
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data);
      }
    } catch {
      // Fail silently
    }
    setLoadingTab(false);
  }, [campaignId, entityType, entityId]);

  const [versionsData, setVersionsData] = useState<unknown[] | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoadingTab(true);
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/entities/${entityType}/${entityId}/versions`
      );
      if (res.ok) {
        const data = await res.json();
        setVersionsData(data);
      }
    } catch {
      // Fail silently
    }
    setLoadingTab(false);
  }, [campaignId, entityType, entityId]);

  useEffect(() => {
    if (activeTab === "relationships" && !relationsData) {
      fetchRelations();
    }
    if (activeTab === "history" && !historyData) {
      fetchHistory();
    }
    if (activeTab === "versions" && !versionsData) {
      fetchVersions();
    }
  }, [activeTab, relationsData, historyData, versionsData, fetchRelations, fetchHistory, fetchVersions]);

  return (
    <div className="space-y-4 text-leather">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-leather/30 pb-1">
        {TABS.map((tab) => (
          <Button
            key={tab.key}
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "font-heading text-leather hover:bg-leather/10 hover:text-leather",
              activeTab === tab.key &&
                "bg-leather/15 text-leather hover:bg-leather/15"
            )}
          >
            <tab.icon className="size-4 mr-1.5" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && overviewContent}

      {activeTab === "relationships" && (
        loadingTab ? (
          <LoadingScreen />
        ) : relationsData ? (
          <RelationsPanel
            campaignId={campaignId}
            entityType={entityType}
            entityId={entityId}
            entityName={entityName}
            relations={relationsData.relations as never[]}
            relationTypes={relationsData.relationTypes as never[]}
            knownEntities={relationsData.knownEntities as never[]}
            role={role}
            userId={userId}
            tone="leather"
          />
        ) : null
      )}

      {activeTab === "history" && (
        loadingTab ? (
          <LoadingScreen />
        ) : historyData ? (
          <EntityHistory
            campaignId={campaignId}
            history={historyData as never}
            tone="leather"
          />
        ) : null
      )}

      {activeTab === "versions" && (
        loadingTab ? (
          <LoadingScreen />
        ) : versionsData ? (
          <EntityVersions versions={versionsData as never[]} tone="leather" />
        ) : null
      )}
    </div>
  );
}
