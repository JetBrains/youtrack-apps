import type { ApiObjectKind } from "../types.ts";

// Public config syntax for workflow-api-markdown/config.ts. Keep these types
// small and literal so the config reads as "match object, then do action".

export type ModuleTypeMode = "auto" | "merge" | "split";

export interface ObjectSelector {
  kind: ApiObjectKind | ApiObjectKind[];
  module?: string | string[];
  owner?: string | string[];
  name?: string | string[];
  nameStartsWith?: string;
  nameSuffix?: string;
  ancestorStartsWith?: string;
}

export interface MethodSplitRule {
  title: string;
  nameSuffix?: string;
  excludeNameSuffix?: string[];
}

export interface ObjectRule {
  object: ObjectSelector;
  position?: {
    types?: ModuleTypeMode;
    file?: string;
    folder?: string;
    section?: string;
    linkFromModule?: boolean;
  };
  merge?: {
    title: string;
    sections?: string[];
  };
  split?: {
    methods?: MethodSplitRule[];
  };
  members?: {
    includeInherited?: boolean;
  };
  referencedOn?: {
    text: string;
    file?: string;
  };
}

export interface MergedTypeRule {
  filename: string;
  names: string[];
  title: string;
  primaryName?: string;
  sectionNames?: string[];
}

export interface EngineConfig {
  docs: {
    relevantKinds: string[];
    excludeNames: string[];
  };
  defaults: {
    types: ModuleTypeMode;
    splitTypesAfter: number;
  };
  objects: ObjectRule[];
  cleanup: {
    folders: string[];
    staleRootFiles: string[];
  };
}
