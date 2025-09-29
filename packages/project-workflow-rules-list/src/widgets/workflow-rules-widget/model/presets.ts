import { FilterToken, stringifyTokens } from "./tableModel";

export interface PresetFilter {
  id: string;
  label: string;
  tokens: FilterToken[];
}

export const PRESET_FILTERS: PresetFilter[] = [
  {
    id: "active",
    label: "Active rules",
    tokens: [
      { field: "active", value: true, operator: "and", negated: false },
    ],
  },
  {
    id: "manual-active",
    label: "Active manual rules",
    tokens: [
      { field: "autoAttach", value: false, operator: "and", negated: false },
      { field: "active", value: true, operator: "and", negated: false },
    ],
  },
  {
    id: "inactive",
    label: "Inactive rules",
    tokens: [
      { field: "active", value: false, operator: "and", negated: false },
    ],
  },
  {
    id: "errors",
    label: "Rules with errors",
    tokens: [
      { field: "active", value: false, operator: "and", negated: false },
      { field: "enabled", value: true, operator: "and", negated: false },
    ],
  },
];

export const signatureFromTokens = (tokens: FilterToken[]) =>
  stringifyTokens(tokens.map((token, index) => (index === 0 ? { ...token, operator: "and" } : token)));


