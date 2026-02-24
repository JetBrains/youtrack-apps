import { useCallback, useMemo, useState } from "react";

import {
  DEFAULT_SORT_STATE,
  GroupKey,
  SortKey,
  SortOrder,
  SortState,
  TableRowData,
  evaluateFilterQuery,
  tokenizeFilterQuery,
} from "../model/tableModel";
import { PresetFilter, signatureFromTokens } from "../model/presets";

interface UseFilterStateProps {
  presets: PresetFilter[];
}

interface UseFilterStateResult {
  filterQuery: string;
  sortState: SortState;
  activePresetId: string | null;
  filteredRows: (rows: Record<GroupKey, TableRowData[]>, group: GroupKey) => TableRowData[];
  handleFilterChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handlePresetToggle: (preset: PresetFilter) => void;
  handleSort: (group: GroupKey, key: SortKey) => void;
  reset: () => void;
}

const cloneSortState = (state: SortState): SortState => ({
  "on-change": { ...state["on-change"] },
  action: { ...state.action },
  "on-schedule": { ...state["on-schedule"] },
  statemachine: { ...state.statemachine },
});

export const useFilterState = ({ presets }: UseFilterStateProps): UseFilterStateResult => {
  const [filterQuery, setFilterQuery] = useState("");
  const [sortState, setSortState] = useState<SortState>(() => cloneSortState(DEFAULT_SORT_STATE));

  const tokens = useMemo(() => tokenizeFilterQuery(filterQuery), [filterQuery]);
  const currentSignature = useMemo(() => signatureFromTokens(tokens), [tokens]);

  const activePresetId = useMemo(() => {
    const active = presets.find((preset) => signatureFromTokens(preset.tokens) === currentSignature);
    return active?.id ?? null;
  }, [presets, currentSignature]);

  const filteredRows = useCallback(
    (rows: Record<GroupKey, TableRowData[]>, group: GroupKey) => evaluateFilterQuery(rows[group], group, filterQuery),
    [filterQuery],
  );

  const handleFilterChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterQuery(event.target.value);
  }, []);

  const handlePresetToggle = useCallback(
    (preset: PresetFilter) => {
      const presetSignature = signatureFromTokens(preset.tokens);
      setFilterQuery(presetSignature === currentSignature ? "" : presetSignature);
    },
    [currentSignature],
  );

  const handleSort = useCallback((group: GroupKey, key: SortKey) => {
    setSortState((prev) => {
      const current = prev[group];
      const order: SortOrder = current.key === key && current.order === "asc" ? "desc" : "asc";
      return {
        ...prev,
        [group]: { key, order },
      };
    });
  }, []);

  const reset = useCallback(() => {
    setFilterQuery("");
    setSortState(cloneSortState(DEFAULT_SORT_STATE));
  }, []);

  return {
    filterQuery,
    sortState,
    activePresetId,
    filteredRows,
    handleFilterChange,
    handlePresetToggle,
    handleSort,
    reset,
  };
};

export type UseFilterStateReturn = ReturnType<typeof useFilterState>;

