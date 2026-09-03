import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { EngineConfig } from "./engine/config-types.ts";

// Central behavior config. Rules are declarative: match a generated API object,
// then decide where it is rendered or how it is adjusted.

const PACKAGE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const ENTITIES_MODULE = "entities";

export const DEFAULT_MODULE_LONGNAME = "module:@jetbrains/youtrack-scripting-api/entities";
export const MODULE_PREFIX = "module:@jetbrains/youtrack-scripting-api/";
export const DEFAULT_OUTPUT_DIR = path.resolve(PACKAGE_DIR, "../youtrack-apps-skill/references/api");
export const DEFAULT_SKILL_PATH = path.resolve(PACKAGE_DIR, "../youtrack-apps-skill/SKILL.md");

export const ENGINE_CONFIG: EngineConfig = {
  docs: {
    relevantKinds: ["module", "class", "function", "member", "typedef"],
    excludeNames: [
      "action",
      "sla",
      "onSchedule",
      "onChange",
      "stateMachine",
      "slaActionFunction",
      "actionFunction",
      "guardFunction",
      "slaBreachFunction",
      "slaEnterFunction",
      "slaGuardFunction",
      "asyncFunctions",
    ],
  },

  defaults: {
    types: "auto",
    splitTypesAfter: 100000,
  },

  /*
   * Object rules are checked from top to bottom. The first matching rule wins.
   *
   * object:   which generated object this rule applies to.
   *           Use kind/module/owner/name:
   *           - kind: module, function, type, constructor, method, property.
   *           - module: top-level API module, such as entities or http.
   *           - owner: parent type for methods/properties, such as Connection.
   *           - name: object name, such as Set or postAsync.
   * position: where the object is written and whether the module links to it.
   * merge:    write several objects into one file.
   * split:    split one type page section into groups by a simple method rule.
   * members:  member rendering behavior, currently inherited members.
   * referencedOn: rewrite type mentions to point at a generated reference file.
   */
  objects: [
    // {
    //   object: { kind: "type", module: ENTITIES_MODULE, name: "Set" },
    //   position: { file: "set.md", linkFromModule: false },
    //   members: { includeInherited: false },
    //   referencedOn: { text: "Set", file: "set.md" },
    // },
    {
      object: { kind: "type", module: ENTITIES_MODULE, name: ["Requirement", "Requirements"] },
      position: { file: "requirements.md", linkFromModule: false },
      merge: {
        title: "Requirements",
        sections: ["Requirement"],
      },
      members: { includeInherited: false },
    },
    {
      object: { kind: "type", module: ENTITIES_MODULE, nameStartsWith: "Base" },
      position: { folder: "abstract-entities", linkFromModule: false },
      members: { includeInherited: true },
    },
    {
      object: { kind: "type", module: ENTITIES_MODULE, ancestorStartsWith: "Base" },
      position: { folder: ENTITIES_MODULE, linkFromModule: true },
      members: { includeInherited: true },
    },
    {
      object: { kind: "type", module: ENTITIES_MODULE },
      position: { folder: "additional-entities", linkFromModule: false },
      members: { includeInherited: true },
    },
    {
      object: { kind: "method", module: "http", owner: "Connection" },
      split: {
        methods: [
          { title: "Methods", excludeNameSuffix: ["Async", "Sync"] },
          { title: "Async Methods", nameSuffix: "Async" },
          { title: "Sync Methods", nameSuffix: "Sync" },
        ],
      },
    },
  ],

  cleanup: {
    folders: [ENTITIES_MODULE, "abstract-entities", "additional-entities"],
    staleRootFiles: [
      "requirements.md",
      "set.md",
      "license.md",
      "http.md",
      "workflow.md",
      "date-time.md",
      "entities.md",
      "notifications.md",
      "strings.md",
      "search.md",
    ],
  },
};
