import type { ApiObject, ApiObjectKind } from "../types.ts";

// Normalized objects used by rule matching. Renderers build these objects, then
// rules decide positioning, merging, splitting, inheritance, and references.

export type RuleApiObject = ApiObject & { ancestors?: string[] };

export function apiObject(
  kind: ApiObjectKind,
  module: string,
  fields: Omit<Partial<RuleApiObject>, "kind" | "module"> = {},
): RuleApiObject {
  return { kind, module, ...fields };
}

export function moduleObject(module: string): RuleApiObject {
  return apiObject("module", module, { name: module });
}

export function typeObject(module: string, name: string, ancestors: string[] = []): RuleApiObject {
  return apiObject("type", module, { name, ancestors });
}

export function methodObject(module: string, owner: string): RuleApiObject {
  return apiObject("method", module, { owner });
}
