import { useCallback, useEffect, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";

import { API } from "../../api";
import { PluggableObjectUsage } from "../../types";
import { buildPriorityPayload, extractPriorityRules, withPriorityApplied } from "../model/priority";

type PriorityQueueResult = {
  prioritized: PluggableObjectUsage[];
  moveToTop: (ruleId: string) => Promise<void>;
  moveToBottom: (ruleId: string) => Promise<void>;
  moveByDrag: (activeId: string, overId: string | null) => Promise<void>;
  isUpdating: boolean;
  error: string | null;
};

const deriveErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");

const findRule = (rules: PluggableObjectUsage[], ruleId: string) => rules.find((rule) => rule.id === ruleId);

export const usePriorityQueue = (
  baseRules: PluggableObjectUsage[],
  api: API,
  refresh: () => Promise<void>,
): PriorityQueueResult => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prioritized, setPrioritized] = useState(() => extractPriorityRules(baseRules));

  useEffect(() => {
    setPrioritized(extractPriorityRules(baseRules));
  }, [baseRules]);

  const apply = useCallback(
    async (next: PluggableObjectUsage[]) => {
      setIsUpdating(true);
      const normalized = withPriorityApplied(next);
      setPrioritized(normalized);
      try {
        const payload = buildPriorityPayload(normalized);
        await api.updateWorkflowRulePriorityBulk(payload);
        await refresh();
        setError(null);
      } catch (err) {
        setError(deriveErrorMessage(err));
        await refresh();
      } finally {
        setIsUpdating(false);
      }
    },
    [api, refresh],
  );

  const moveToTop = useCallback(
    async (ruleId: string) => {
      const target = findRule(prioritized, ruleId);
      if (!target) {
        return;
      }
      const next = [target, ...prioritized.filter((rule) => rule.id !== ruleId)];
      await apply(next);
    },
    [apply, prioritized],
  );

  const moveToBottom = useCallback(
    async (ruleId: string) => {
      const target = findRule(prioritized, ruleId);
      if (!target) {
        return;
      }
      const next = [...prioritized.filter((rule) => rule.id !== ruleId), target];
      await apply(next);
    },
    [apply, prioritized],
  );

  const moveByDrag = useCallback(
    async (activeId: string, overId: string | null) => {
      if (!overId || activeId === overId) {
        return;
      }
      const oldIndex = prioritized.findIndex((rule) => rule.id === activeId);
      const newIndex = prioritized.findIndex((rule) => rule.id === overId);
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }
      const reordered = arrayMove([...prioritized], oldIndex, newIndex);
      await apply(reordered);
    },
    [apply, prioritized],
  );

  return {
    prioritized,
    moveToTop,
    moveToBottom,
    moveByDrag,
    isUpdating,
    error,
  };
};
