import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { API } from "../../api";
import { PluggableObjectUsage } from "../../types";
import { GROUP_ORDER, GroupKey, TableRowData, groupRulesByType, makeRowData } from "../model/tableModel";
import { usePriorityQueue } from "./usePriorityQueue";
import { PRIORITY_GROUP } from "../model/priority";

type Status = "idle" | "loading" | "ready" | "error";

type UseWorkflowRulesResult = {
  status: Status;
  isUpdating: boolean;
  error: string | null;
  groupedRules: Record<GroupKey, PluggableObjectUsage[]>;
  tableRows: Record<GroupKey, TableRowData[]>;
  handleDragEnd: (group: GroupKey, activeId: string, overId: string | null) => void;
  moveRuleToTop: (group: GroupKey, ruleId: string) => Promise<void>;
  moveRuleToBottom: (group: GroupKey, ruleId: string) => Promise<void>;
  toggleRuleEnabled: (ruleId: string, enabled: boolean) => Promise<void>;
  refresh: () => Promise<void>;
};

type PendingToggle = { id: string; value: boolean } | null;

const deriveErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : "Something went wrong");

export const useWorkflowRules = (api: API): UseWorkflowRulesResult => {
  const [rules, setRules] = useState<PluggableObjectUsage[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<PendingToggle>(null);
  const isMountedRef = useRef(true);

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const refresh = useCallback(
    async (options?: { keepReady?: boolean }) => {
      setStatus((current) => (options?.keepReady && current === "ready" ? current : "loading"));
      try {
        const data = await api.getWorkflowRules();
        if (!isMountedRef.current) {
          return;
        }
        setRules(data);
        setStatus("ready");
        setError(null);
      } catch (err) {
        if (!isMountedRef.current) {
          return;
        }
        setStatus("error");
        setError(deriveErrorMessage(err));
      } finally {
        if (options?.keepReady) {
          setPendingToggle(null);
        }
      }
    },
    [api],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const baseGrouped = useMemo(() => groupRulesByType(rules), [rules]);

  const priority = usePriorityQueue(baseGrouped[PRIORITY_GROUP], api, () => refresh({ keepReady: true }));

  const grouped = useMemo(() => ({
    ...baseGrouped,
    [PRIORITY_GROUP]: priority.prioritized,
  }), [baseGrouped, priority.prioritized]);

  const tableRows = useMemo(() => {
    return GROUP_ORDER.reduce((accumulator, key) => {
      accumulator[key] = makeRowData(grouped[key]);
      return accumulator;
    }, {} as Record<GroupKey, TableRowData[]>);
  }, [grouped]);

  const isUpdating = priority.isUpdating || Boolean(pendingToggle);

  const handleDragEnd = useCallback(
    (group: GroupKey, activeId: string, overId: string | null) => {
      if (group !== PRIORITY_GROUP) {
        return;
      }
      priority.moveByDrag(activeId, overId);
    },
    [priority],
  );

  const moveRuleToTop = useCallback(
    async (group: GroupKey, ruleId: string) => {
      if (group !== PRIORITY_GROUP) {
        return;
      }
      await priority.moveToTop(ruleId);
    },
    [priority],
  );

  const moveRuleToBottom = useCallback(
    async (group: GroupKey, ruleId: string) => {
      if (group !== PRIORITY_GROUP) {
        return;
      }
      await priority.moveToBottom(ruleId);
    },
    [priority],
  );

  const toggleRuleEnabled = useCallback(
    async (ruleId: string, enabled: boolean) => {
      setPendingToggle({ id: ruleId, value: enabled });
      try {
        const response = await api.updateWorkflowRuleEnabled(ruleId, enabled);
        if (response?.errors?.length) {
          setRules((prev) =>
            prev.map((rule) =>
              rule.id === ruleId
                ? {
                    ...rule,
                    errors: response.errors,
                  }
                : rule,
            ),
          );
          setPendingToggle(null);
          return;
        }
        await refresh({ keepReady: true });
      } catch (err) {
        const message = deriveErrorMessage(err);
        setRules((prev) =>
          prev.map((rule) =>
            rule.id === ruleId
              ? {
                  ...rule,
                  errors: [message],
                }
              : rule,
          ),
        );
        setPendingToggle(null);
      }
    },
    [api, refresh],
  );

  return {
    status,
    isUpdating,
    error: error ?? priority.error,
    groupedRules: grouped,
    tableRows,
    handleDragEnd,
    moveRuleToTop,
    moveRuleToBottom,
    toggleRuleEnabled,
    refresh: () => refresh({ keepReady: false }),
  };
};

export type UseWorkflowRulesReturn = ReturnType<typeof useWorkflowRules>;

