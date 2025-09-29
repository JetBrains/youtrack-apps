import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { DragEndEvent, DragStartEvent, UniqueIdentifier } from "@dnd-kit/core";

import { API } from "../api";
import { GROUP_ORDER, GroupKey, getGroupTitle } from "./model/tableModel";
import { PRIORITY_GROUP } from "./model/priority";
import { PRESET_FILTERS } from "./model/presets";
import { FilterBar, RulesTable, ToastProvider } from "./components";
import LoaderInline from "@jetbrains/ring-ui-built/components/loader-inline/loader-inline";
import { useWorkflowRules, useFilterState } from "./hooks";

const host = await YTApp.register();
const api = new API(host);


const AppComponent: React.FunctionComponent = () => {
  const [activeDragId, setActiveDragId] = useState<UniqueIdentifier | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<GroupKey | null>(null);
  const hasUserSelectedGroup = useRef(false);

  const {
    status,
    isUpdating,
    error,
    groupedRules,
    tableRows,
    handleDragEnd: handleDragEndInternal,
    moveRuleToTop,
    moveRuleToBottom,
    toggleRuleEnabled,
  } = useWorkflowRules(api);

  const {
    filterQuery,
    sortState,
    activePresetId,
    filteredRows,
    handleFilterChange,
    handlePresetToggle,
    handleSort,
  } = useFilterState({ presets: PRESET_FILTERS });

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (isUpdating) {
      return;
    }
    setActiveDragId(event.active.id);
  }, [isUpdating]);

  const handleDragEnd = useCallback(
    (group: GroupKey, event: DragEndEvent) => {
      setActiveDragId(null);
      if (isUpdating) {
        return;
      }
      handleDragEndInternal(group, String(event.active.id), event.over ? String(event.over.id) : null);
    },
    [handleDragEndInternal, isUpdating],
  );

  const handleMoveToTop = useCallback(
    (group: GroupKey, ruleId: string) => {
      if (isUpdating) {
        return Promise.resolve();
      }
      return moveRuleToTop(group, ruleId);
    },
    [isUpdating, moveRuleToTop],
  );
  const handleMoveToBottom = useCallback(
    (group: GroupKey, ruleId: string) => {
      if (isUpdating) {
        return Promise.resolve();
      }
      return moveRuleToBottom(group, ruleId);
    },
    [isUpdating, moveRuleToBottom],
  );

  useEffect(() => {
    if (hasUserSelectedGroup.current) {
      return;
    }

    if (groupedRules[PRIORITY_GROUP].length > 0) {
      if (expandedGroup !== PRIORITY_GROUP) {
        setExpandedGroup(PRIORITY_GROUP);
      }
      return;
    }

    const fallbackGroup = GROUP_ORDER.find((key) => groupedRules[key].length > 0) ?? null;
    if (expandedGroup !== fallbackGroup) {
      setExpandedGroup(fallbackGroup ?? null);
    }
  }, [expandedGroup, groupedRules]);

  const handleGroupToggle = useCallback((group: GroupKey) => {
    hasUserSelectedGroup.current = true;
    setExpandedGroup((prev) => (prev === group ? null : group));
  }, []);

  if (status === "loading" || status === "idle") {
    return <div>Loading...</div>;
  }

  if (status === "error") {
    return <div>{error ?? "Failed to load workflow rules"}</div>;
  }

  const filterHelpContent = (
    <div className="filter-help">
      <div>Use queries like:</div>
      <ul>
        <li><code>group: action and active: true</code></li>
        <li><code>autoAttach: false or enabled: true</code></li>
        <li><code>-appname: scheduler</code></li>
      </ul>
      <div>Supported keywords: group, rule, app, appid, id, priority, enabled, autoAttach, active.</div>
    </div>
  );

  const widgetClassName = classNames("widget", { "widget--blocked": isUpdating });

  return (
    <ToastProvider>
      <div className={widgetClassName} aria-busy={isUpdating}>
        {isUpdating ? <div className="widget__overlay" aria-hidden="true" /> : null}
        <div className="widget__body">
          <FilterBar
            filterQuery={filterQuery}
            onFilterChange={handleFilterChange}
            helpContent={filterHelpContent}
            presets={PRESET_FILTERS}
            activePresetId={activePresetId}
            onPresetToggle={handlePresetToggle}
          />
          {GROUP_ORDER.map((groupName) => {
            const rowData = filteredRows(tableRows, groupName);
            if (rowData.length === 0) {
              return null;
            }
            const isExpanded = expandedGroup === groupName;
            const showLoader = isUpdating && groupName === PRIORITY_GROUP;
            return (
              <div key={groupName} className="rules-group">
                <button
                  type="button"
                  className="rules-group__toggle"
                  onClick={() => handleGroupToggle(groupName)}
                  aria-expanded={isExpanded}
                >
                  <span className="rules-group__left">
                    <span className="rules-group__loader" aria-hidden={!showLoader}>
                      {showLoader ? <LoaderInline /> : null}
                    </span>
                    <span className="rules-group__title">{getGroupTitle(groupName)}</span>
                  </span>
                  <span className="rules-group__meta">
                    <span className="rules-group__count">{rowData.length}</span>
                  </span>
                </button>
                {isExpanded && (
                  <RulesTable
                    rules={groupedRules[groupName]}
                    rows={rowData}
                    groupName={groupName}
                    sortState={sortState}
                    activeDragId={activeDragId}
                    disabled={isUpdating}
                    onSort={handleSort}
                    onToggleEnabled={(id, enabled) => toggleRuleEnabled(id, enabled)}
                    onDragStart={handleDragStart}
                    onDragEnd={(event) => handleDragEnd(groupName, event)}
                    onMoveToTop={(id) => handleMoveToTop(groupName, id)}
                    onMoveToBottom={(id) => handleMoveToBottom(groupName, id)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ToastProvider>
  );
};

export const App = memo(AppComponent);
