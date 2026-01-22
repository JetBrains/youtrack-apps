/*
 Copyright 2017 JetBrains s.r.o.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * Contains TypeScript definitions for the entities in YouTrack that are accessible to workflows.
 * @module @jetbrains/youtrack-scripting-api/entities
 */

/**
 * Re-export Period from date-time module for use in period-type fields.
 * Period represents a time duration (e.g., "3h", "2w4d3h15m").
 */
import { Period } from '@jetbrains/youtrack-scripting-api/date-time';
export { Period };

/**
 * Represents a reference to a field that can be either:
 * - A string field name (e.g., "State", "Priority")
 * - A field object from requirements context (e.g., ctx.State, ctx.Priority)
 *
 * This enables the syntax sugar where requirement fields can be used directly
 * in place of field name strings.
 */
export type FieldReference = string | object;

/**
 * A single element in a set of Requirements.
 */
export interface Requirement {
  /**
   * The optional name of the field or entity. If not provided,
   * the key (alias) for this requirement in the Requirements object is used.
   */
  name?: string;
  /** An optional login, used instead of name for User requirements. */
  login?: string;
  /** An optional issue ID, used instead of name for Issue requirements. */
  id?: string;
  /**
   * An optional flag, false by default. If true, a required field
   * must store multiple values (if applicable).
   */
  multi?: boolean;
  /** The outward name of the issue link type (required for IssueLinkPrototype requirements). */
  outward?: string;
  /** The inward name of the issue link type (equals outward name if not set). */
  inward?: string;
  /**
   * The data type of the entity. Can be one of the custom field types or system-wide entities.
   */
  type?: string | object;
  /**
   * Nested requirements for field values (e.g., enum values, users, etc.).
   * The keys become accessible as properties in the context.
   */
  [valueKey: string]: unknown;
}

/**
 * The Requirements object serves two purposes.
 * First, it functions as a safety net. It specifies the set of entities that must exist for a rule to work as expected.
 * Whenever one or more rule requirements are not met, corresponding errors are shown in the workflow administration UI.
 * The rule is not executed until all of the problems are fixed.
 *
 * Second, it functions as a reference.
 * Each entity in the requirements is plugged into the context object, so you can reference entities from inside your
 * context-dependent functions (like an action function).
 *
 * This is a generic type alias that preserves the exact structure of requirements for full type inference.
 * Use 'as const' when defining requirements for maximum type safety.
 *
 * @example
 * const myRequirements = {
 *   Priority: { type: entities.EnumField.fieldType, 'Show-stopper': {}, Critical: {} }
 * } as const;
 * // TypeScript will infer ctx.Priority['Show-stopper'] and ctx.Priority.Critical
 */
export type Requirements<T extends Record<string, Requirement> = Record<string, Requirement>> = T;

/**
 * Known property names that are part of the Requirement interface definition.
 * These should be excluded when extracting nested value keys.
 */
type RequirementPropertyNames = 'name' | 'login' | 'id' | 'multi' | 'outward' | 'inward' | 'type';

/**
 * Helper type to check if a requirement has multi: true
 */
type IsMultiRequirement<T> = T extends { multi: true } ? true : false;

/**
 * Helper type to check if a requirement has any nested value keys
 */
type HasNestedValues<T> = Exclude<keyof T, RequirementPropertyNames> extends never ? false : true;

/**
 * Helper type to get single-value field type (ignoring multi flag).
 * Used for nested requirement values which are always single values.
 */
type SingleFieldValueType<T> = T extends { type: infer FT }
  ? FT extends string
    ? (FT extends 'instant' | 'dateTime' | 'date' | 'int' | 'float' ? number
       : FT extends 'string' | 'text' ? string
       : FT extends 'period' ? Period
       : FT extends `${string}.fieldType` ? ExtractEntityType<FT>
       : BaseEntity)
    : FT extends typeof UserGroup ? UserGroup
    : FT extends typeof Project ? Project
    : FT extends typeof User ? User
    : FT extends typeof Issue ? Issue
    : FT extends typeof IssueTag ? IssueTag
    : InferEntityFromRequirement<T>
  : BaseEntity;

/**
 * Helper type to extract and structure requirement context from a Requirements object.
 * This creates a properly typed context where both requirement keys and their nested values are accessible.
 * Only the keys that exist in requirements are accessible - accessing non-existent keys will cause a type error.
 * For multi-valued requirements (multi: true), adds a 'values' property with a Set type.
 * For requirements without nested values (like User, SavedQuery):
 * - If multi: true, returns { values: Set<EntityType> }
 * - If multi: false/undefined, returns EntityType directly
 *
 * @example
 * type R = { Priority: { type: any, 'Show-stopper': {}, Critical: {} } }
 * type Ctx = RequirementsContext<R>
 * // Results in: { Priority: { 'Show-stopper': FieldValue, Critical: FieldValue } }
 * // ctx.Priority['Show-stopper'] ✓ OK
 * // ctx.Foo ✗ Type error - 'Foo' doesn't exist in requirements
 */
export type RequirementsContext<R extends Record<string, Requirement>> = {
  [K in keyof R]: R[K] extends Requirement
    ? (IsMultiRequirement<R[K]> extends true
        ? (HasNestedValues<R[K]> extends true
            ? ({ values: Set<SingleFieldValueType<R[K]>> } & { [V in Exclude<keyof R[K], RequirementPropertyNames>]: SingleFieldValueType<R[K]> })
            : { values: Set<SingleFieldValueType<R[K]>> })
        : (HasNestedValues<R[K]> extends true
            ? { [V in Exclude<keyof R[K], RequirementPropertyNames>]: SingleFieldValueType<R[K]> }
            : FieldValueType<R[K]>))
    : never;
};

/**
 * Extract entity type from branded field type string.
 * E.g., 'State.fieldType' → State, 'User.fieldType' → User
 */
type ExtractEntityType<FT> =
  FT extends 'State.fieldType' ? State
  : FT extends 'User.fieldType' ? User
  : FT extends 'Build.fieldType' ? Build
  : FT extends 'ProjectVersion.fieldType' ? ProjectVersion
  : FT extends 'UserGroup.fieldType' ? UserGroup
  : FT extends 'EnumField.fieldType' ? EnumField
  : FT extends 'OwnedField.fieldType' ? OwnedField
  : BaseEntity;

/**
 * Infers entity type from requirement structure for system-wide entities.
 * Checks for indicator properties like 'login' (User), 'id' (Issue), 'outward' (IssueLinkPrototype), etc.
 */
type InferEntityFromRequirement<T> =
  T extends { login: unknown } ? User
  : T extends { outward: unknown } | { inward: unknown } ? IssueLinkPrototype
  : T extends { id: unknown, type: any } ? Issue
  : BaseEntity;

/**
 * Maps field type to its TypeScript value type.
 * - Primitive types (instant, dateTime, int, float) → number
 * - String types (string, text) → string
 * - period → Period entity
 * - Entity field types (State.fieldType, User.fieldType, etc.) → specific entity type
 * - System-wide entity requirements (User, Project, Issue, etc.) → inferred from structure
 * - Multi-value fields (multi: true) → Set<entity type>
 * - All other types → BaseEntity
 */
type FieldValueType<T> = T extends { type: infer FT, multi: true }
  ? FT extends string
    ? (FT extends `${string}.fieldType` ? Set<ExtractEntityType<FT>>
       : Set<BaseEntity>)
    : FT extends typeof UserGroup ? Set<UserGroup>
    : FT extends typeof Project ? Set<Project>
    : FT extends typeof User ? Set<User>
    : FT extends typeof Issue ? Set<Issue>
    : FT extends typeof IssueTag ? Set<IssueTag>
    : Set<InferEntityFromRequirement<T>>
  : T extends { type: infer FT }
    ? FT extends string
      ? (FT extends 'instant' | 'dateTime' | 'date' | 'int' | 'float' ? number
         : FT extends 'string' | 'text' ? string
         : FT extends 'period' ? Period
         : FT extends `${string}.fieldType` ? ExtractEntityType<FT>
         : BaseEntity)
      : FT extends typeof UserGroup ? UserGroup
      : FT extends typeof Project ? Project
      : FT extends typeof User ? User
      : FT extends typeof Issue ? Issue
      : FT extends typeof IssueTag ? IssueTag
      : InferEntityFromRequirement<T>
    : BaseEntity;

/**
 * Base type for entity field values (non-primitive).
 */
export type EntityFieldValue = BaseEntity;

/**
 * Field value entity with common properties.
 * This represents entities that can be field values (State, EnumBundleElement, User, etc.)
 * which all have a .name property.
 */
export interface NamedFieldValue extends BaseEntity {
  /** The name of the field value (e.g., "Open", "Critical", "John Doe") */
  readonly name: string;
}

/**
 * Generic field value type - can be entity or primitive depending on field type.
 * This is used when the field type is not known from requirements.
 * Entity values typically have a .name property.
 *
 * For convenience, this type has an optional .name property to avoid requiring
 * type guards in common patterns like `oldValue('State').name`.
 */
export type FieldValue = (NamedFieldValue | string | number | null) & { name?: string };

/**
 * Maps requirement type to its corresponding Field entity type.
 * This is for accessing the field itself via issue.fields.X (not the value).
 * E.g., { type: 'State.fieldType' } → State (the field entity)
 */
type FieldTypeFromRequirement<T> = T extends { type: infer FT }
  ? FT extends string
    ? ExtractEntityType<FT>
    : BaseEntity
  : BaseEntity;

/**
 * Maps requirements object to field types for Fields interface.
 * Each key in requirements maps to its corresponding field value type.
 *
 * Reading returns the field value (State entity, number, string, etc.)
 * Writing accepts the same field value types
 *
 * Example:
 *   const state: State = issue.fields.State;     // Reading returns State | null
 *   issue.fields.State = stateObj;                // Writing accepts State entity
 *   issue.fields['Due Date'] = Date.now();       // Writing accepts number
 */
type FieldTypesFromRequirements<R extends Record<string, Requirement>> = {
  -readonly [K in keyof R]: FieldValueType<R[K]> | null;
};

/**
 * Base type for custom field or ProjectCustomField
 */
export type FieldReference = string | ProjectCustomField;

/**
 * Base type for rule property values (includes functions)
 */
export type RulePropertyValue = FieldValue | boolean | Function | Requirements | { [key: string]: unknown };

/**
 * State machine transition definition
 */
export interface StateMachineTransition<R extends Record<string, Requirement> = Record<string, Requirement>> {
  /** Target state name */
  targetState: string;
  /** Guard function for this transition */
  guard?: GuardFunction<R>;
  /** Action to perform during transition */
  action?: ActionFunction<R>;
  /** Milliseconds delay after which transition happens automatically */
  after?: number;
  [key: string]: unknown;
}

/**
 * State machine state definition
 */
export interface StateMachineState<R extends Record<string, Requirement> = Record<string, Requirement>> {
  /** Whether this is the initial state */
  initial?: boolean;
  /** Transitions from this state */
  transitions?: {
    [transitionName: string]: StateMachineTransition<R>;
  };
  [key: string]: unknown;
}

/**
 * User input specification
 */
export interface UserInputSpec {
  /**
   * Type of the input field. Can be:
   * - A field type string (e.g., Field.dateTimeType, Field.integerType, Field.stringType)
   * - An entity class (e.g., Project, User, UserGroup, ProjectVersion)
   * - An entity's fieldType property (e.g., entities.ProjectVersion.fieldType)
   */
  type: string | object | (new (...args: any[]) => any);
  /** Description shown to the user */
  description?: string;
  [key: string]: unknown;
}

/**
 * Base execution context for action functions (without requirements).
 */
export interface BaseActionContext {
  /** The current issue (for Issue rules). */
  issue: Issue;
  /** The current article (for Article rules). */
  article: Article;
  /** The project that the workflow rule is attached to. */
  project: Project;
  /** The user who executes the rule. */
  currentUser: User;
  /**
   * When true, the rule is triggered in reaction to a command that is applied without notification.
   * When false, the rule is triggered in reaction to a command that is applied normally.
   */
  isSilentOperation?: boolean;
  /**
   * User input value if userInput was specified in rule properties.
   * The actual runtime type depends on the userInput.type in the rule definition.
   * Common types: string for stringType, number for dateType/integerType, entity for Project/User/etc.
   * TypeScript types this as `any` to allow flexibility - use type guards or assertions as needed.
   */
  userInput?: any;
  /** AI tool arguments if this is an AI tool */
  arguments?: Record<string, unknown>;
  /**
   * App settings as configured in settings.json.
   * Available when the rule is part of an app with settings.
   * Use the app-types-generator to get fully typed settings.
   */
  settings?: Record<string, any>;
}

/**
 * Base execution context for guard functions (without requirements).
 */
export interface BaseGuardContext {
  /** The current issue (for Issue rules). */
  issue: Issue;
  /** The current article (for Article rules). */
  article: Article;
  /** The project that the workflow rule is attached to. */
  project: Project;
  /** The user who executes the rule. */
  currentUser: User;
  /**
   * User input value if userInput was specified in rule properties.
   * The actual runtime type depends on the userInput.type in the rule definition.
   * Common types: string for stringType, number for dateType/integerType, entity for Project/User/etc.
   * TypeScript types this as `any` to allow flexibility - use type guards or assertions as needed.
   */
  userInput?: any;
}

/**
 * Enhanced Issue type with typed fields based on requirements.
 * This is used in contexts where requirements specify field types.
 * The type extends Issue to maintain assignability to Issue parameters.
 */
export type IssueWithRequirements<R extends Record<string, Requirement>> =
  Issue & { fields: FieldsWithAccess<R> } & { -readonly [K in keyof R]: FieldValueType<R[K]> | null };

/**
 * The execution context for action functions.
 * Generic parameter R represents the Requirements object, whose keys and nested values are merged into the context.
 * The issue.fields type is enhanced with field types from requirements while maintaining Issue assignability.
 *
 * @example
 * // With requirements:
 * requirements: {
 *   Priority: { type: entities.EnumField.fieldType, 'Show-stopper': {} }
 * }
 * // Context will have: ctx.Priority['Show-stopper']
 * // And ctx.issue.fields.Priority with proper type
 */
export type ActionContext<R extends Record<string, Requirement> = Record<string, Requirement>> =
  Omit<BaseActionContext, 'issue'> & {
    issue: IssueWithRequirements<R>
  } & RequirementsContext<R>;

/**
 * The execution context for guard functions.
 * Generic parameter R represents the Requirements object, whose keys and nested values are merged into the context.
 * The issue.fields type is enhanced with field types from requirements while maintaining Issue assignability.
 */
export type GuardContext<R extends Record<string, Requirement> = Record<string, Requirement>> =
  Omit<BaseGuardContext, 'issue'> & {
    issue: IssueWithRequirements<R>
  } & RequirementsContext<R>;

/**
 * This function is called by different events depending on the rule type.
 * Generic parameter R represents the Requirements that will be available in the context.
 */
export type ActionFunction<R extends Record<string, Requirement> = Record<string, Requirement>> = (ctx: ActionContext<R>) => void;

/**
 * This function is called to determine whether an action function can be applied to an issue.
 * Generic parameter R represents the Requirements that will be available in the context.
 * The return value is interpreted as a boolean (truthy/falsy).
 */
export type GuardFunction<R extends Record<string, Requirement> = Record<string, Requirement>> = (ctx: GuardContext<R>) => any;

/**
 * Properties that can be passed to rule constructors.
 * Generic parameter R represents the Requirements object type.
 *
 * For maximum type inference, use 'as const' when defining requirements.
 *
 * @example
 * const rule = entities.Issue.action({
 *   requirements: {
 *     Priority: { type: entities.EnumField.fieldType, 'Show-stopper': {} }
 *   } as const,  // Use 'as const' for full inference!
 *   action: (ctx) => {
 *     // ctx.Priority['Show-stopper'] is fully typed!
 *     ctx.issue.fields.State = ctx.Priority['Show-stopper'];
 *   }
 * });
 */
export interface RuleProperties<R extends Record<string, Requirement> = Record<string, Requirement>> {
  /** Title of the rule */
  title?: string;
  /** Command that triggers the rule */
  command?: string;
  /** Guard function with typed requirements context */
  guard?: GuardFunction<R>;
  /** Action function with typed requirements context */
  action?: ActionFunction<R>;
  /** Requirements that get merged into the context */
  requirements?: Requirements<R>;
  /** Run on settings */
  runOn?: {
    change?: boolean;
    removal?: boolean;
  };
  /** Whether to mute update notifications */
  muteUpdateNotifications?: boolean;
  /** When true, updates applied by the workflow rule are reflected in the updated and updatedBy properties */
  modifyUpdatedProperties?: boolean;
  /** Search query for scheduled rules - can be a string query or a function that returns a query */
  search?: string | ((ctx: ActionContext<Record<string, Requirement>>) => string);
  /** Cron expression for scheduled rules */
  cron?: string;
  /** User input specification */
  userInput?: UserInputSpec;
  /** SLA-specific: onEnter function */
  onEnter?: ActionFunction<R>;
  /** SLA-specific: onBreach function */
  onBreach?: (ctx: ActionContext<R> & { breachedField: FieldValue }) => void;
  /** State machine specific: field name */
  fieldName?: string;
  /** State machine specific: states */
  states?: {
    [stateName: string]: StateMachineState<R>;
  };
  [key: string]: RulePropertyValue | undefined;
}

/**
 * An object that enables traversal through the elements in a collection.
 */
export interface Iterator<T> {
  /**
   * Returns an object that contains values for the done and value properties.
   * If there are elements that were not traversed, done is false and value is the next element in the collection.
   * If all of the elements were traversed, done is true and value is null.
   */
  next(): { done: boolean; value: T | null };
}

/**
 * The Set object stores unique values of any type, whether primitive values or
 * object references. The Set is used as storage for all multi-value objects in
 * this API: custom fields that store multiple values, issue links, issues in a project, and so on.
 */
export interface Set<T> {
  /** The number of elements in a Set. */
  readonly size: number;

  /** The elements that are added to a field that stores multiple values in the current transaction. */
  readonly added?: Set<T>;

  /** The elements that are removed from a field that stores multiple values in the current transaction. */
  readonly removed?: Set<T>;

  /**
   * When the Set represents a multi-valued property (field) of a persistent entity
   * and the field is changed in the current transaction, this property is true.
   */
  readonly isChanged?: boolean;

  /** Find an element with a specific index position in a Set. */
  get(index: number): T | null;

  /** Find the first object in a collection based on the order in which the elements were added to the Set. */
  first(): T | null;

  /** Find the last object in a collection based on the order in which the elements were added to the Set. */
  last(): T | null;

  /** Get an iterator for the entries in a Set. The same as values(). */
  entries(): Iterator<T>;

  /** Get an iterator for the entries in a Set. The same as entries(). */
  values(): Iterator<T>;

  /** Apply a visitor function to each member of a collection. */
  forEach(visitor: (element: T) => void): void;

  /** Find the first element in a Set for which a predicate function returns true. */
  find(predicate: (element: T) => boolean): T | undefined;

  /** Checks a Set object to determine whether the specified element is present in the collection or not. */
  has(element: T): boolean;

  /** Checks a Set object to determine whether it is empty. */
  isEmpty(): boolean;

  /** Checks a Set object to determine whether it is not empty. */
  isNotEmpty(): boolean;

  /** Add an element to a Set. If the specified value is already present, a duplicate value is not added. */
  add(element: T): void;

  /** Remove an element from a Set. If the specified element is not present, nothing happens. */
  delete(element: T): void;

  /** Remove all of the values from a Set. */
  clear(): void;
}


/**
 * Represents the custom fields that are used in an issue.
 * The actual set of custom fields that are used for each issue is configured on a per-project basis.
 * The properties shown here correspond with the default custom fields in YouTrack.
 * Additional custom fields that have been attached to a project are also available.
 *
 * Fields can be both read and written. You can assign either string values or entity objects.
 */
/**
 * Generic Fields interface that restricts field access to only those defined in requirements.
 * Without requirements (R = Record<string, Requirement>), all field names are allowed.
 * With specific requirements, only field names from requirements are accessible.
 *
 * @example
 * // With requirements: { Priority: {...}, State: {...} }
 * // Only ctx.issue.fields.Priority and ctx.issue.fields.State are allowed
 * // ctx.issue.fields.NonExistent will cause a type error
 */
export interface Fields<R extends Record<string, Requirement> = Record<string, Requirement>> {
  /**
   * Asserts that a value is set for a custom field.
   * If a value for the required field is not set, the specified message is displayed in the user interface.
   */
  required(fieldName: FieldReference, message: string): void;

  /**
   * Checks whether the value for a custom field is set to an expected value in the current transaction.
   */
  becomes(field: FieldReference, expected: FieldValue): boolean;

  /**
   * Checks whether the custom field is changed in the current transaction.
   */
  isChanged(field: FieldReference): boolean;

  /**
   * Returns the previous value of a single-valued custom field before an update was applied.
   * If the field is not changed in the transaction, returns null.
   */
  oldValue(field: FieldReference): FieldValue;

  /**
   * Checks whether a user has permission to read the custom field.
   */
  canBeReadBy(field: FieldReference, user: User): boolean;

  /**
   * Checks whether a user has permission to update the custom field.
   */
  canBeWrittenBy(field: FieldReference, user: User): boolean;
}

/**
 * Interface for dynamically accessed field values.
 * Since TypeScript uses the index signature for bracket notation access even when
 * a specific property exists (especially with spaces in names), this interface includes
 * optional Set-like methods for multi-value field support.
 *
 * The base entity properties (name, becomesRemoved, isNew) are inherited, and
 * Set-like methods (add, delete, has) are available for multi-value fields.
 */
export interface DynamicFieldValue {
  /** The name of the entity, if it has one */
  readonly name?: string;
  /** For multi-value fields: add an item */
  add?(value: any): void;
  /** For multi-value fields: remove an item */
  delete?(value: any): void;
  /** For multi-value fields: check if contains item */
  has?(value: any): boolean;
  /** For multi-value fields: number of items */
  size?: number;
  /** For multi-value fields: check if changed */
  isChanged?: boolean;
}

/**
 * Default issue fields that are auto-attached to new projects in YouTrack.
 * These fields are defined in the predefined fields configuration:
 * - Priority (ordinal 0): Single enum field, default "Normal"
 * - Type (ordinal 1): Single enum field, default "Bug"
 * - State (ordinal 2): Single state field, default "Submitted"
 * - Assignee (ordinal 3): Single user field
 * - Subsystem (ordinal 4): Single owned field
 * - Fix versions (ordinal 5): Multi version field
 * - Affected versions (ordinal 6): Multi version field
 * - Fixed in build (ordinal 7): Single build field
 * - Due Date (ordinal 8): Date field
 *
 * Note: Assignment accepts both entity objects and strings for convenience.
 * Multi-value fields return Set<T> which has .add(), .delete(), .has() methods.
 *
 * The field types use BaseEntity as a common base to allow assignment from
 * requirement context values (EnumField, OwnedField, State, etc.) without
 * intersection type conflicts.
 */
export interface CommonIssueFields {
  /** Single state field (ordinal 2). Values: Submitted, Open, In Progress, etc. */
  State?: BaseEntity | string | null;
  /** Single enum field (ordinal 0). Values: Show-stopper, Critical, Major, Normal, Minor */
  Priority?: BaseEntity | string | null;
  /** Single enum field (ordinal 1). Values: Bug, Feature, Task, etc. */
  Type?: BaseEntity | string | null;
  /** Single user field (ordinal 3). */
  Assignee?: BaseEntity | string | null;
  /** Single owned field (ordinal 4). */
  Subsystem?: BaseEntity | string | null;
  /** Multi version field (ordinal 5). Use .add() to add versions. */
  'Fix versions'?: Set<ProjectVersion>;
  /** Multi version field (ordinal 6). Use .add() to add versions. */
  'Affected versions'?: Set<ProjectVersion>;
  /** Single build field (ordinal 7). */
  'Fixed in build'?: BaseEntity | string | null;
  /** Date field (ordinal 8). Stores timestamp as number. */
  'Due Date'?: number | null;
  /** Index signature for any other custom fields - includes optional Set methods for multi-value fields */
  [fieldName: string]: DynamicFieldValue | Set<BaseEntity> | string | number | null | undefined;
}

/**
 * Helper type to check if R is the default/generic Record<string, Requirement>.
 * Used to determine whether to use CommonIssueFields or FieldTypesFromRequirements.
 */
type IsDefaultRequirements<R> = string extends keyof R ? true : false;

/**
 * Type that adds field name access to Fields interface.
 * When requirements are specified with specific keys, restricts field access to those keys.
 * When requirements are the default generic type (or empty), provides CommonIssueFields with full access.
 * Uses -readonly to make fields writable even when requirements are defined with 'as const'.
 *
 * IMPORTANT: issue.fields.X returns the Field entity (State, EnumField, etc.)
 *            issue.X returns the field VALUE (State value, EnumField value, etc.)
 *
 * For assignment, fields accept the field entity type or string for convenience.
 */
export type FieldsWithAccess<R extends Record<string, Requirement> = Record<string, Requirement>> =
  Fields<R> & (
    IsDefaultRequirements<R> extends true
      ? CommonIssueFields
      : (keyof R extends never
          ? CommonIssueFields
          : FieldTypesFromRequirements<R>)
  );

/**
 * Represents an Agile board in YouTrack.
 */
export declare class AgileBoard extends BaseEntity {
  /**
   * The name of the agile board.
   */
  readonly name: string;
}

/**
 * Represents a Gantt chart in YouTrack.
 */
export declare class GanttChart extends BaseEntity {
  /**
   * The name of the Gantt chart.
   */
  readonly name: string;

  /**
   * Checks whether a Gantt chart contains a specific issue.
   * @param issue The issue to check.
   * @returns true if the Gantt chart contains the issue, false otherwise.
   */
  contains(issue: Issue | BaseEntity): boolean;

  /**
   * Adds an issue to the Gantt chart.
   * @param issue The issue to add.
   */
  addIssue(issue: Issue | BaseEntity): void;

  /**
   * Removes an issue from the Gantt chart.
   * @param issue The issue to remove.
   */
  removeIssue(issue: Issue | BaseEntity): void;

  /**
   * Returns all issues in the Gantt chart.
   * @returns A set of issues in the Gantt chart.
   */
  issues(): Set<Issue>;
}

/**
 * The common ancestor for all entity types.
 */
export declare class BaseEntity {
  /**
   * The name of the entity. Most entities have a name property.
   */
  readonly name?: string;

  /**
   * When true, the entity is removed in the current transaction. Otherwise, false.
   * This property can become true only in on-change rules when the rule is triggered on the removal of an issue or an article.
   */
  readonly becomesRemoved: boolean;

  /**
   * When true, the entity is created in the current transaction. Otherwise, false.
   */
  readonly isNew: boolean;

  /**
   * The object containing extension properties for this entity and their values.
   * Extension properties are custom properties that might be added to core YouTrack entities by an app.
   */
  extensionProperties?: Record<string, FieldValue>;

  /**
   * Asserts that a value is set for a field.
   * If a value for the required field is not set, the specified message is displayed in the user interface.
   */
  required(fieldName: FieldReference, message: string): void;

  /**
   * Checks whether a field is set to an expected value in the current transaction.
   */
  becomes(fieldName: FieldReference, expected: FieldValue): boolean;

  /**
   * Checks whether a field is equal to an expected value.
   */
  is(fieldName: FieldReference, expected: FieldValue): boolean;

  /**
   * Checks whether a field was equal to an expected value prior to the current transaction.
   */
  was(fieldName: FieldReference, expected: FieldValue): boolean;

  /**
   * Checks whether the value of a field is changed in the current transaction.
   */
  isChanged(fieldName: FieldReference): boolean;

  /**
   * Returns the previous value of a single-value field before an update was applied.
   * If the field is not changed in the transaction, returns null.
   */
  oldValue(fieldName: FieldReference): FieldValue;

  /**
   * Checks whether a user has permission to read the field.
   */
  canBeReadBy(fieldName: FieldReference, user: User): boolean;

  /**
   * Checks whether a user has permission to update the field.
   */
  canBeWrittenBy(fieldName: FieldReference, user: User): boolean;
}


/**
 * Represents VCS-related items such as commits and pull requests.
 */
export declare class AbstractVcsItem extends BaseEntity {
  /**
   * The name of the branch that the VCS change was committed to.
   * @since 2018.1.38923
   */
  readonly branch: string;

  /**
   * The commit message or pull request description that was provided when the change was applied to the VCS.
   * @since 2018.1.38923
   */
  readonly text: string;

  /**
   * The user who authored the VCS change.
   * @since 2018.1.38923
   */
  readonly user: User;

  /**
   * The name of the change author, as returned by the VCS.
   * @since 2018.1.38923
   */
  readonly userName: string;

}

/**
 * Represents an agile board and the set of sprints that belong to the board.
 */
export declare class Agile extends BaseEntity {
  /**
   * The sprint that is considered to be in active development at the current moment.
   * @since 2023.1
   */
  readonly currentSprint: Sprint;

  /**
   * The user who created the board.
   */
  readonly author: User;

  /**
   * The name of the agile board.
   */
  readonly name: string;

  /**
   * The set of sprints that are associated with the board.
   */
  readonly sprints: Set<Sprint>;

  /**
   * Searches for Agile entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of Agile entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<Agile>;

  /**
   * Returns a set of agile boards that have the specified name.
   * @param name The name of an agile board.
   * @returns A set of agile boards that are assigned the specified name.
   */
  static findByName(name: string): Set<Agile>;

  /**
   * Adds the issue to the current sprint of the board.
   * @param issue The issue that is added to the board.
   */
  addIssue(issue: Issue | BaseEntity): void;

  /**
   * Checks whether the issue belongs to the board.
   * @param issue The issue for which the condition is checked.
   * @returns If the issue belongs to the board, returns ``true``.
   */
  containsIssue(issue: Issue | BaseEntity): boolean;

  /**
   * Finds a specific sprint by name.
   * @param name The name of the sprint.
   * @returns If a sprint with the specified name is found, the corresponding Sprint object is returned. Otherwise, the return value is null.
   */
  findSprintByName(name: string): Sprint;

  /**
   * Gets all sprints of this board where the issue is added during the current transaction.
   * @param issue The issue for which added sprints are returned.
   * @returns A set of sprints where the issue is added.
   */
  getAddedSprints(issue: Issue): Set<Sprint>;

  /**
   * Returns the sprints that an issue is assigned to on an agile board.
   * @since 2018.1.39547
   * @param issue The issue for which you want to get the sprints that it is assigned to.
   * @returns The sprints that the issue is assigned to on the agile board.
   */
  getIssueSprints(issue: Issue): Set<Sprint>;

  /**
   * Gets all sprints of this board from which the issue is removed during the current transaction.
   * @param issue The issue for which removed sprints are returned.
   * @returns A set of sprints from which the issue is removed.
   */
  getRemovedSprints(issue: Issue): Set<Sprint>;

  /**
   * Gets all sprints of this board where the issue belongs.
   * @param issue The issue for which sprints are returned.
   * @returns A set of sprints where the issue belongs.
   */
  getSprints(issue: Issue): Set<Sprint>;

  /**
   * Checks whether the issue gets added to the board in the current transaction.
   * @param issue The issue for which the condition is checked.
   * @returns If the issue gets added to the board, returns ``true``.
   */
  isAdded(issue: Issue): boolean;

  /**
   * Checks whether the issue gets removed from the board in the current transaction.
   * @param issue The issue for which the condition is checked.
   * @returns If the issue gets removed from the board, returns ``true``.
   */
  isRemoved(issue: Issue): boolean;

  /**
   * Removes the issue from all sprints of this board where it belongs.
   * @param issue The issue that is removed from the board.
   */
  removeIssue(issue: Issue | BaseEntity): void;

}

/**
 * Entity type for App global extension properties
 * @since 2024.2
 */
export declare class AppGlobalStorage extends BaseEntity {
}

/**
 * Represents an article in YouTrack.
 * @since 2021.4.23500
 */
export declare class Article extends BaseArticle {
  /**
   * The set of comments that are edited in the current transaction.
   * Comments that are added and removed are not considered to be edited.
   * Instead, these are represented by the `article.comments.added` and `article.comments.removed` properties.
   */
  readonly editedComments: Set<ArticleComment>;

  /**
   * The article ID.
   */
  readonly id: string;

  /**
   * The set of comments that are pinned in the article.
   * @since 2024.1
   */
  readonly pinnedComments: Set<ArticleComment>;

  /**
   * The absolute URL that points to the article.
   * @since 2025.1
   */
  readonly url: string;

  /**
   * The set of sub-articles of the current one.
   * @since 2024.4
   */
  childArticles: Set<Article>;

  /**
   * A list of comments for the article.
   */
  readonly comments: Set<ArticleComment>;

  /**
   * The date when the article was created.
   */
  readonly created: number;

  /**
   * The article number in the project.
   */
  readonly numberInProject: number;

  /**
   * The parent article of the current one.
   * @since 2024.4
   */
  parentArticle: Article;

  /**
   * The project to which the article is assigned.
   */
  project: Project;

  /**
   * The date when the article was last updated.
   */
  readonly updated: number;

  /**
   * The user who last updated the article.
   */
  readonly updatedBy: User;

  /**
   * Creates a new article instance.
   * @param author The author of the article.
   * @param project The project where the article is created.
   * @param summary The article title/summary.
   */
  constructor(author: User, project: Project, summary: string);

  /**
   * The article description. May be an alias for content.
   */
  description: string;

  /**
   * Creates a declaration of a rule that a user can apply to an article using a menu option.
   * The object that is returned by this method is normally exported to the `rule` property, otherwise it is not treated as a rule.
   * @example
   * var entities = require('@jetbrains/youtrack-scripting-api/entities');
   * exports.rule = entities.Article.action({
   *   title: 'Log article comments',
   *   command: 'log',
   *   guard: function(ctx) {
   *     return ctx.article.comments.isEmpty();
   *   },
   *   action: function(ctx) {
   *     ctx.article.comments.forEach(function(comment) {
   *       console.log(comment.text);
   *     });
   *   }
   * });
   * @param {Object} ruleProperties A JSON object that defines the properties for the rule.
   * @param {string} ruleProperties.title The human-readable name of the rule. Displayed in the administrative UI in YouTrack.
   * @param {Object} [ruleProperties.userInput] An object that defines the properties for information that will be requested from the user who triggers the action rule.
   * @param {string|Object} [ruleProperties.userInput.type] The data type for the value that is requested from the user. The following types are supported:
   * * entities.Field.dateTimeType
   * * entities.Field.dateType
   * * entities.Field.integerType
   * * entities.Field.floatType
   * * entities.Field.periodType
   * * entities.Field.stringType
   * * entities.Build
   * * entities.EnumField
   * * entities.Issue
   * * entities.IssueTag
   * * entities.OwnedField
   * * entities.Project
   * * entities.ProjectVersion
   * * entities.UserGroup
   * * entities.User
   * @param {string} [ruleProperties.userInput.description] The label for the control that is used to collect additional information from the user.
   * @param {Article~guardFunction} ruleProperties.guard A function that is invoked to determine whether the action is applicable to an article.
   * @param {Article~actionFunction} ruleProperties.action The function that is invoked when a user triggers this action.
   * @param {Requirements} ruleProperties.requirements The set of entities that must be present for the script to work as expected.
   * @param ruleProperties $ignore
   * @returns The object representation of the rule.
   */
  static action<R extends Requirements = Requirements>(ruleProperties?: RuleProperties<R>): RuleProperties<R>;

  /**
   * Creates a new article draft.
   * @param project The project where the new article is created.
   * @param author The author of the article.
   * @returns Newly created article draft.
   */
  static createDraft(project?: Project, author?: User): BaseArticle;

  /**
   * Searches for Article entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of Article entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<Article>;

  /**
   * Finds an article by its visible ID.
   * @param id The article ID.
   * @returns The article that is assigned the specified ID.
   */
  static findById(id: string): Article;

  /**
   * Creates a declaration of a rule that is triggered when a change is applied to an article.
   * The object that is returned by this method is normally exported to the `rule` property, otherwise it is not treated as a rule.
   * @example
   * var entities = require('@jetbrains/youtrack-scripting-api/entities');
   * exports.rule = entities.Article.onChange({
   *   title: 'On article change, log its ID',
   *   action: function(ctx) {
   *     console.log(ctx.article.id);
   *   }
   * });
   * @param {Object} ruleProperties A JSON object that defines the properties for the rule.
   * @param {string} ruleProperties.title The human-readable name of the rule. Displayed in the administrative UI in YouTrack.
   * @param {Article~guardFunction} ruleProperties.guard A function that determines the conditions for executing the rule. If the guard condition is not met, the action specified in the rule is not applied to the article.
   * @param {Article~actionFunction} ruleProperties.action The function that is invoked on an article change.
   * @param {Requirements} ruleProperties.requirements The set of entities that must be present for the script to work as expected.
   * @param {Object} [ruleProperties.runOn] Determines which article events trigger the on-change rule. When not specified, the rule is triggered on an article change.
   * @param {boolean} [ruleProperties.runOn.change] When `true`, the rule is triggered on an article change.
   * @param {boolean} [ruleProperties.runOn.removal] When `true`, the rule is triggered when an article is logically deleted.
   * @param ruleProperties $ignore
   * @returns The object representation of the rule.
   */
  static onChange<R extends Requirements = Requirements>(ruleProperties?: RuleProperties<R>): RuleProperties<R>;

  /**
   * Attaches a file to the article.
   * Makes `article.attachments.isChanged` return `true` for the current transaction.
   * @since 2020.2
   * @param content The content of the file in binary or base64 form.
   * @param name The name of the file.
   * @param charset The charset of the file. Only applicable to text files.
   * @param mimeType The MIME type of the file.
   * @returns The attachment that is added to the article.
   */
  addAttachment(content: ArrayBuffer | Uint8Array, name: string, charset: string, mimeType: string): ArticleAttachment;

  /**
   * Adds a comment to the article.
   * @param text The text to add to the article as a comment.
   * @param author The author of the comment.
   * @returns A newly created comment.
   */
  addComment(text: string, author?: User): ArticleComment;

}

/**
 * Represents a file that is attached to an article.
 */
export declare class ArticleAttachment extends BaseArticleAttachment {
  /**
   * Creates a declaration of a rule that a user can apply to an article attachment using a menu option.
   * The object that is returned by this method is normally exported to the `rule` property, otherwise it is not treated as a rule.
   * @example
   * var entities = require('@jetbrains/youtrack-scripting-api/entities');
   * exports.rule = entities.ArticleAttachment.action({
   *   title: 'Log attachment name',
   *   guard: function(ctx) {
   *     return !ctx.articleAttachment.article.comments.isEmpty();
   *   },
   *   action: function(ctx) {
   *     console.log(ctx.articleAttachment.name);
   *   }
   * });
   * @param {Object} ruleProperties A JSON object that defines the properties for the rule.
   * @param {string} ruleProperties.title The human-readable name of the rule. Displayed in the administrative UI in YouTrack.
   * @param {Object} [ruleProperties.userInput] An object that defines the properties for information that will be requested from the user who triggers the action rule.
   * @param {string|Object} [ruleProperties.userInput.type] The data type for the value that is requested from the user. The following types are supported:
   * * entities.Field.dateTimeType
   * * entities.Field.dateType
   * * entities.Field.integerType
   * * entities.Field.floatType
   * * entities.Field.periodType
   * * entities.Field.stringType
   * * entities.Build
   * * entities.EnumField
   * * entities.Issue
   * * entities.IssueTag
   * * entities.OwnedField
   * * entities.Project
   * * entities.ProjectVersion
   * * entities.UserGroup
   * * entities.User
   * @param {string} [ruleProperties.userInput.description] The label for the control that is used to collect additional information from the user.
   * @param {ArticleAttachment~guardFunction} ruleProperties.guard A function that is invoked to determine whether the action is applicable to an article attachment.
   * @param {ArticleAttachment~actionFunction} ruleProperties.action The function that is invoked when a user triggers this action.
   * @param {Requirements} ruleProperties.requirements The set of entities that must be present for the script to work as expected.
   * @param ruleProperties $ignore
   * @returns The object representation of the rule.
   */
  static action<R extends Requirements = Requirements>(ruleProperties?: RuleProperties<R>): RuleProperties<R>;

  /**
   * Searches for ArticleAttachment entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of ArticleAttachment entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<ArticleAttachment>;

}

/**
 * Represents a comment that is added to an article.
 * @since 2021.4.23500
 */
export declare class ArticleComment extends BaseArticleComment {
  /**
   * The article the comment belongs to.
   */
  readonly article: Article;

  /**
   * The user who created the comment.
   */
  readonly author: User;

  /**
   * Creates a declaration of a rule that a user can apply to an article comment using a menu option.
   * The object that is returned by this method is normally exported to the `rule` property, otherwise it is not treated as a rule.
   * @example
   * var entities = require('@jetbrains/youtrack-scripting-api/entities');
   * exports.rule = entities.ArticleComment.action({
   *   title: 'Log comment text if comment has attachments',
   *   guard: function(ctx) {
   *     return !ctx.articleComment.attachments.isEmpty();
   *   },
   *   action: function(ctx) {
   *     console.log(ctx.articleComment.text);
   *   }
   * });
   * @param {Object} ruleProperties A JSON object that defines the properties for the rule.
   * @param {string} ruleProperties.title The human-readable name of the rule. Displayed in the administrative UI in YouTrack.
   * @param {Object} [ruleProperties.userInput] An object that defines the properties for information that will be requested from the user who triggers the action rule.
   * @param {string|Object} [ruleProperties.userInput.type] The data type for the value that is requested from the user. The following types are supported:
   * * entities.Field.dateTimeType
   * * entities.Field.dateType
   * * entities.Field.integerType
   * * entities.Field.floatType
   * * entities.Field.periodType
   * * entities.Field.stringType
   * * entities.Build
   * * entities.EnumField
   * * entities.Issue
   * * entities.IssueTag
   * * entities.OwnedField
   * * entities.Project
   * * entities.ProjectVersion
   * * entities.UserGroup
   * * entities.User
   * @param {string} [ruleProperties.userInput.description] The label for the control that is used to collect additional information from the user.
   * @param {ArticleComment~guardFunction} ruleProperties.guard A function that is invoked to determine whether the action is applicable to an article comment.
   * @param {ArticleComment~actionFunction} ruleProperties.action The function that is invoked when a user triggers this action.
   * @param {Requirements} ruleProperties.requirements The set of entities that must be present for the script to work as expected.
   * @param ruleProperties $ignore
   * @returns The object representation of the rule.
   */
  static action<R extends Requirements = Requirements>(ruleProperties?: RuleProperties<R>): RuleProperties<R>;

  /**
   * Searches for ArticleComment entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of ArticleComment entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<ArticleComment>;

}

/**
 * The base class for article.
 * @since 2021.4.23500
 */
export declare class BaseArticle extends BaseEntity {
  /**
   * If the current user has added the 'Star' tag to watch the article, this property is `true`.
   * @since 2023.1
   */
  readonly isStarred: boolean;

  /**
   * The set of attachments that are attached to the article.
   */
  readonly attachments: Set<BaseArticleAttachment>;

  /**
   * The user who created the article.
   */
  readonly author: User;

  /**
   * The text that is entered as the article content.
   */
  content: string;

  /**
   * The article title.
   */
  summary: string;

  /**
   * The list of tags that are attached to the article.
   * @since 2023.1
   */
  tags: Set<Tag>;

  /**
   * The article ID.
   */
  readonly id: string;

  /**
   * The absolute URL that points to the article.
   */
  readonly url: string;

  /**
   * The parent article of the current one.
   */
  parentArticle: Article;

  /**
   * Attaches a file to the article. Can accept an object with attachment properties.
   * @param contentOrAttachment The content of the file in binary form, or an object with attachment properties
   * @param name The name of the file (optional if passing object)
   * @param charset The charset of the file (optional)
   * @param mimeType The MIME type of the file (optional)
   * @returns The attachment that is added to the article.
   */
  addAttachment(contentOrAttachment: ArrayBuffer | Uint8Array | {
    content: string,
    name: string,
    charset?: string,
    mimeType?: string
  }, name?: string, charset?: string, mimeType?: string): BaseArticleAttachment;

  /**
   * Adds a tag with the specified name to an article. YouTrack adds the first matching tag that is visible to the current user.
   * If a match is not found, a new private tag is created for the current user.
   * @example
   * article.addTag('review');
   * @since 2023.1
   * @param name The name of the tag to add to the article.
   * @returns The tag that has been added to the article.
   */
  addTag(name: string): Tag;

  /**
   * Checks whether the specified tag is attached to the article.
   * @since 2023.1
   * @param tagName The name of the tag to check for the article.
   * @returns If the specified tag is attached to the article, returns `true`.
   */
  hasTag(tagName: string): boolean;

  /**
   * Removes a tag with the specified name from an article. If the specified tag is not attached to the article, nothing happens.
   * This method first searches through tags owned by the current user, then through all other visible tags.
   * @example
   * article.removeTag('waiting for review');
   * @since 2023.1
   * @param name The name of the tag to remove from the article.
   * @returns The tag that has been removed from the article.
   */
  removeTag(name: string): Tag;

}

/**
 * The base class for article comment.
 */
export declare class BaseArticleAttachment extends PersistentFile {
}

/**
 * The base class for article comment.
 * @since 2021.4.23500
 */
export declare class BaseArticleComment extends BaseEntity {
  /**
   * The set of attachments that are attached to the comment.
   */
  readonly attachments: Set<BaseArticleAttachment>;

  /**
   * Time the comment was created.
   */
  readonly created: number;

  /**
   * When `true`, the comment is pinned in the article. Otherwise, `false`.
   * @since 2024.1
   */
  isPinned: boolean;

  /**
   * The text of the comment.
   */
  text: string;

  /**
   * Time the comment was last updated.
   */
  readonly updated: number;

}

/**
 * The base class for issue comment.
 */
export declare class BaseComment extends BaseEntity {
  /**
   * The set of attachments that are attached to the comment.
   * @since 2018.1.40030
   */
  readonly attachments: Set<IssueAttachment>;

  /**
   * Time the comment was created.
   */
  readonly created: number;

  /**
   * When `true`, the comment is pinned in the issue. Otherwise, `false`.
   * @since 2024.1
   */
  isPinned: boolean;

  /**
   * The text of the comment.
   */
  text: string;

  /**
   * Time the comment was last updated.
   */
  readonly updated: number;


  /**
   * When `true`, the comment text is parsed as Markdown. When `false`, the comment text is parsed as YouTrack Wiki.
   * Changing this value does not transform the markup from one syntax to another.
   * @since 2017.4.38870
   */
  isUsingMarkdown: boolean;

}

/**
 * The base class for issue work items.
 */
export declare class BaseWorkItem extends BaseEntity {
  /**
   * The user to whom the work is attributed in the work item.
   */
  readonly author: User;

  /**
   * The date when the work item was created.
   */
  readonly created: number;

  /**
   * The user who added the work item to the issue.
   */
  readonly creator: User;

  /**
   * The work item description.
   */
  description: string;

  /**
   * The work item type.
   *  Writable since 2020.2
   */
  type: WorkItemType;

  /**
   * The date when the work item was last updated.
   */
  readonly updated: number;

}

/**
 * Represents a value that is stored in a custom field that stores a build type.
 */
export declare class Build extends Field {
  /**
   * The date and time when the build was assembled.
   */
  readonly assembleDate: number;

  /**
   * Field type. Used when defining rule requirements.
   */
  static readonly fieldType: 'Build.fieldType';

  /**
   * Searches for Build entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of Build entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<Build>;

}

/**
 * Represents a value-based condition for a custom field in a specific project.
 * @since 2025.3
 */
export declare class BundleElementCondition extends BaseEntity {
  /**
   * The value of the field that is used to determine the set of `possibleValues` in the conditional field.
   */
  readonly bundleElement: Field;

  /**
   * The set of possible values for the conditional field.
   */
  readonly possibleValues: Set<Field>;

}

/**
 * Represents a custom field in a project that stores a predefined set of values.
 */
export declare class BundleProjectCustomField extends ProjectCustomField {
  /**
   * The list of available values for the custom field.
   */
  readonly values: Set<Field>;

  /**
   * The values that are used as the default for this field.
   * @since 2020.5
   */
  readonly defaultValues: Set<Field>;

  /**
   * The condition that determines which values are possible for this field based on the condition field value. If not setthere are no value-based conditions for this field, all values are possible.
   * @since 2025.3
   */
  readonly valuesCondition: FieldBasedBundleValuesCondition;

  /**
   * Searches for BundleProjectCustomField entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of BundleProjectCustomField entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<BundleProjectCustomField>;

  /**
   * Adds a value to the set of values for the custom field. If a value with the specified name already exists in the set, an exception is thrown.
   * @since 2018.2.45017
   * @param name The name of the value that you want to add to the set.
   * @returns The value that was added to the set.
   */
  createValue(name: string): Field;

  /**
   * Returns a value with the specified name in the set of values for a custom field.
   * @param name The name of the field value to search for.
   * @returns The value with the specified name in the set of values for the custom field.
   */
  findValueByName(name: string): Field;

  /**
   * Returns a value that is assigned a specified position in the set of values for a custom field.
   * @param ordinal The position of the field value to search by.
   * @returns The value that is assigned the specified position in the set of values for the custom field.
   */
  findValueByOrdinal(ordinal: number): Field;

  /**
   * The list of possible values for a custom field based on the value-based conditions in the project settings and the current value stored in the issue. If there are no value-based conditions in the project settings, returns the complete list of values for the custom field.
   * @since 2025.3
   * @param issue The issue for which the value is checked.
   * @returns The set of possible values for the custom field.
   */
  getPossibleValuesForIssue(issue: Issue): Set<Field>;

  /**
   * Checks if a specified value is allowed in the issue.
   * @since 2025.2
   * @param issue The issue for which the value is checked.
   * @param value The value to check.
   * @returns If the conditions for using the specified value in the issue have been met, returns `true`.
   */
  isValuePermittedInIssue(issue: Issue, value: Field): boolean;

}

/**
 * Represents a group of business hours settings in a helpdesk project. In the Workflow API, such a group is called a Calendar.
 */
export declare class Calendar extends BaseEntity {
}

/**
 * Represents a group of 24x7 business hours settings in a helpdesk project. In the Workflow API, such a group is called a Calendar24x7.
 */
export declare class Calendar24x7 extends Calendar {
  /**
   * Searches for Calendar24x7 entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of Calendar24x7 entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<Calendar24x7>;

  /**
   * Returns an instance of a Calendar24x7 entity.
   * @returns Returns an instance of a Calendar24x7 entity.
   */
  static instance(): Calendar24x7;

}

/**
 * An entity that retrieves VCS changes and creates their representation in YouTrack.
 * @since 2018.1.38923
 */
export declare class ChangesProcessor extends BaseEntity {
  /**
   * The list of pull requests that are associated with the changes processor.
   * @since 2020.3
   */
  readonly pullRequests: Set<PullRequest>;

  /**
   * The URL of the change processor. Integrations with TeamCity, Jenkins, GitLab CI/CD, and Upsource return the web address of the build configuration or project page.
   * @since 2021.2
   */
  readonly url: string;

  /**
   * The list of commits that are associated with the changes processor.
   * @since 2020.3
   */
  readonly vcsChanges: Set<VcsChange>;

  /**
   * The VCS server that the processor connects to.
   * @since 2018.1.38923
   */
  readonly server: VcsServer;

}

/**
 * Represents a channel used by customers to reach out to the helpdesk for support.
 */
export declare class Channel extends BaseEntity {
  /**
   * The name assigned to a channel in a helpdesk project
   */
  readonly name: string;

}

/**
 * Represents a value in a custom field that stores a predefined set of values.
 */
export declare class EnumField extends Field {
  /**
   * Field type. Used when defining rule requirements.
   */
  static readonly fieldType: 'EnumField.fieldType';

  /**
   * Searches for EnumField entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of EnumField entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<EnumField>;

}

/**
 * Represents an online form used in a helpdesk project. Online forms provide customers with a web-based interface that they can use to submit inquiries, requests, or complaints.
 */
export declare class FeedbackForm extends Channel {
  /**
   * Searches for FeedbackForm entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of FeedbackForm entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<FeedbackForm>;

}

/**
 * Represents a value that is stored in a custom field.
 * The custom fields themselves are represented by the Fields class.
 */
export declare class Field extends BaseEntity {
  /**
   * The background color of the value in the custom field as it is displayed in YouTrack.
   */
  readonly backgroundColor: string;

  /**
   * The foreground color of the value in the custom field as it is displayed in YouTrack.
   */
  readonly foregroundColor: string;

  /**
   * String representation of the value.
   */
  readonly presentation: string;

  /**
   * If the value is archived, this property is `true`.
   */
  readonly isArchived: boolean;

  /**
   * The index value of the color that is assigned to the value in the custom field.
   */
  readonly colorIndex: number;

  /**
   * The description of the value as visible in the administrative UI for custom fields.
   */
  readonly description: string;

  /**
   * The name of the value, which is also stored as the value in the custom field.
   */
  readonly name: string;

  /**
   * The position of the value in the set of values for the custom field.
   */
  readonly ordinal: number;

  /**
   * Date and time field type. Used when defining rule requirements.
   */
  static readonly dateTimeType: 'dateTime';

  /**
   * Date field type. Used when defining rule requirements.
   */
  static readonly dateType: 'date';

  /**
   * Float field type. Used when defining rule requirements.
   */
  static readonly floatType: 'float';

  /**
   * Integer field type. Used when defining rule requirements.
   */
  static readonly integerType: 'int';

  /**
   * Period field type. Used when defining rule requirements.
   */
  static readonly periodType: 'period';

  /**
   * String field type. Used when defining rule requirements.
   */
  static readonly stringType: 'string';

  /**
   * Text field type. Used when defining rule requirements.
   */
  static readonly textType: 'text';

}

/**
 * Represents a value-based condition for a custom field in a specific project.
 * @since 2025.3
 */
export declare class FieldBasedBundleValuesCondition extends FieldBasedValuesCondition {
  /**
   * The set of value-based conditions for the custom field. Each condition is represented by the value from the field that defines the condition (the `bundleElement`) and a set of possible values for the conditional field (the `possibleValues`).
   * @since 2025.3
   */
  readonly conditions: Set<BundleElementCondition>;

}

/**
 * Represents a value-based condition for a custom field that stores references to users.
 * @since 2025.3
 */
export declare class FieldBasedUserValuesCondition extends FieldBasedValuesCondition {
  /**
   * The set of value-based conditions for the custom field. Each condition is represented by the value from the field that defines the condition (the `bundleElement`) and a set of possible values for the conditional field (the `possibleValues`).
   * @since 2025.3
   */
  readonly conditions: Set<UserCondition>;

}

/**
 * Represents the base entity for a value-based condition for a custom field in a project.
 * @since 2025.3
 */
export declare class FieldBasedValuesCondition extends BaseEntity {
  /**
   * The custom field that this condition is based on.
   * @since 2025.3
   */
  readonly field: BundleProjectCustomField;

}

/**
 * Represents a Gantt chart.
 * @since 2022.1
 */
export declare class Gantt extends BaseEntity {
  /**
   * The start date for the issues on the Gantt chart.
   */
  readonly startTimestamp: number;

  /**
   * The set of issues that have been added to the Gantt chart.
   */
  readonly issues: Set<Issue>;

  /**
   * The name of the Gantt chart.
   */
  readonly name: string;

  /**
   * The user who created the Gantt chart.
   */
  readonly owner: User;

  /**
   * The projects that this Gantt chart works with.
   */
  readonly projects: Set<Project>;

  /**
   * Searches for Gantt entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of Gantt entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<Gantt>;

  /**
   * Finds the most relevant chart with the specified name that is visible to the current user.
   * @param name The name of the chart to search for.
   * @returns The most relevant chart found by name.
   */
  static findChartByName(name: string): Gantt;

  /**
   * Adds the specified issue to the Gantt chart.
   * @param issue The issue to add to the Gantt chart.
   */
  addIssue(issue: Issue | BaseEntity): void;

  /**
   * Checks whether the issue belongs to the Gantt chart.
   * @param issue The issue for which the condition is checked.
   * @returns If the issue belongs to the Gantt chart, returns `true`.
   */
  containsIssue(issue: Issue | BaseEntity): boolean;

  /**
   * Removes the specified issue from the Gantt chart. If the issue was not present on the chart, nothing happens.
   * @param issue The issue to remove from the Gantt chart.
   */
  removeIssue(issue: Issue | BaseEntity): void;

}

/**
 * Represents a custom field in a project that stores a UserGroup type.
 */
export declare class GroupProjectCustomField extends ProjectCustomField {
  /**
   * The list of available values for the custom field.
   */
  readonly values: Set<UserGroup>;

  /**
   * Searches for GroupProjectCustomField entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of GroupProjectCustomField entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<GroupProjectCustomField>;

  /**
   * Returns the value that matches the specified name in a custom field that stores values as a user group.
   * @param name The name of the group to search for in the set of values for the custom field.
   * @returns The group with the specified name. This group can be set as the value for a field that stores a user group.
   */
  findValueByName(name: string): UserGroup;

}

/**
 * Represents an issue in YouTrack.
 */
export declare class Issue extends BaseEntity {
  /**
   * If the issue becomes reported in the current transaction, this property is `true`.
   * @example
   * if (issue.fields.Subsystem !== null && issue.fields.Assignee === null &&
   *     (((issue.isChanged('Subsystem') || issue.isChanged('project') && issue.isReported) ||
   *         issue.becomesReported) {
   *     issue.fields.Assignee = issue.fields.Subsystem.owner
   * }
   */
  readonly becomesReported: boolean;

  /**
   * If the issue was previously unresolved and is assigned a state that is considered resolved in the current transaction, this property is `true`.
   */
  readonly becomesResolved: boolean;

  /**
   * If the issue was previously resolved and is assigned a state that is considered unresolved in the current transaction, this property is `true`.
   */
  readonly becomesUnresolved: boolean;

  /**
   * Draft issue ID. Returns `null` if the issue is not a draft.
   * @since 2025.3
   */
  readonly draftId: string;

  /**
   * The root issue in a tree of duplicates that are linked to the issue.
   * For example, if `issueA` duplicates `issueB` and `issueB` duplicates
   * `issueC`, then the value for the `issueA.duplicateRoot()` property is `issueC`.
   */
  readonly duplicateRoot: Issue;

  /**
   * The set of comments that are edited in the current transaction.
   * Comments that are added and removed are not considered to be edited.
   * Instead, these are represented by the `issue.comments.added` and `issue.comments.removed` properties.
   */
  readonly editedComments: Set<IssueComment>;

  /**
   * The set of work items that are edited in the current transaction.
   * Work items that are added and removed are not considered to be edited.
   * Instead, these are represented by the `issue.workItems.added` and
   * `issue.workItems.removed` properties.
   * @since 2017.4.37824
   */
  readonly editedWorkItems: Set<IssueWorkItem>;

  /**
   * The issue ID.
   * @example
   * user.notify('Issue is overdue', 'Please, look at the issue: ' + issue.id);
   */
  readonly id: string;

  /**
   * The set of comments that are pinned in the issue.
   * @since 2024.1
   */
  readonly pinnedComments: Set<IssueComment>;

  /**
   * The list of pull requests that are associated with the issue.
   * @since 2020.3
   */
  readonly pullRequests: Set<PullRequest>;

  /**
   * The absolute URL that points to the issue.
   * @example
   * user.notify('Issue is overdue', 'Please, look at the issue: ' + issue.url);
   */
  readonly url: string;

  /**
   * The list of commits that are associated with the issue.
   * @since 2018.1.38923
   */
  readonly vcsChanges: Set<VcsChange>;

  /**
   * Returns the watchers of the issue.
   * @since 2025.3
   */
  readonly watchers: Set<User>;

  /**
   * The set of work items that have been added to the issue.
   */
  readonly workItems: Set<IssueWorkItem>;

  /**
   * If the issue is already reported or becomes reported in the current transaction, this property is `true`. To apply changes to an issue draft, use `!issue.isReported`.
   * @example
   * issue.links['depends on'].forEach(function(dep) {
   *   if (dep.isReported) {
   *     assert(dep.State.resolved, 'The issue has unresolved dependencies and thus cannot be set Fixed!');
   *   }
   * });
   */
  readonly isReported: boolean;

  /**
   * If the issue is currently assigned a state that is considered resolved, this property is `true`.
   */
  readonly isResolved: boolean;

  /**
   * If the current user has added the 'Star' tag to watch the issue, this property is `true`.
   */
  readonly isStarred: boolean;

  /**
   * The set of attachments that are attached to the issue.
   */
  readonly attachments: Set<IssueAttachment>;

  /**
   * The channel used by the reporter to create the ticket. Possible values are 'FeedbackForm' for online forms or 'MailboxChannel' for email.
   */
  readonly channel: Channel;

  /**
   * A list of comments for the issue.
   */
  readonly comments: Set<IssueComment>;

  /**
   * The date when the issue was created.
   */
  readonly created: number;

  /**
   * The text that is entered as the issue description.
   */
  description: string;

  /**
   * The collection of Gantt charts that this issue has been added to.
   */
  readonly ganttCharts: Set<Gantt>;

  /**
   * The set of issue comments where this issue is mentioned.
   */
  readonly mentionedInIssueComments: Set<IssueComment>;

  /**
   * The set of issues where this issue is mentioned.
   */
  readonly mentionedInIssues: Set<Issue>;

  /**
   * The issue number in the project.
   */
  readonly numberInProject: number;

  /**
   * The user group for which the issue is visible. If the property contains a null value, the issue is visible to the All Users group.
   */
  permittedGroup: UserGroup;

  /**
   * The groups for which the issue is visible when the visibility is restricted to multiple groups.
   */
  permittedGroups: Set<UserGroup>;

  /**
   * The list of users for whom the issue is visible.
   */
  permittedUsers: Set<User>;

  /**
   * The project to which the issue is assigned.
   */
  project: Project;

  /**
   * The user who reported (created) the issue.
   * @example
   * issue.fields.Assignee = issue.reporter;
   */
  reporter: User;

  /**
   * The date and time when the issue was assigned a state that is considered to be resolved.
   */
  readonly resolved: number;

  /**
   * The text that is entered as the issue summary.
   */
  summary: string;

  /**
   * The list of tags that are attached to an issue.
   */
  tags: Set<Tag>;

  /**
   * When true, the ticket was created by a reporter who was not logged in to YouTrack when they submitted the support request.
   */
  readonly unauthenticatedReporter: boolean;

  /**
   * The date when the issue was last updated.
   */
  readonly updated: number;

  /**
   * The user who last updated the issue.
   */
  readonly updatedBy: User;

  /**
   * Users who voted for the issue.
   * @since 2020.5
   */
  readonly voters: Set<User>;

  /**
   * The number of votes for an issue. For vote-related methods, see User.canVoteIssue, User.voteIssue, User.canUnvoteIssue, and User.unvoteIssue.
   */
  readonly votes: number;


  /**
   * Agile boards that this issue belongs to.
   */
  readonly boards: Set<AgileBoard>;

  /**
   * Plugged attributes for the issue. Used to store custom data from external integrations.
   */
  pluggedAttributes: { [key: string]: any };

  /**
   * Gantt charts that this issue belongs to.
   */
  readonly ganttCharts: {
    added?: Set<GanttChart>;
    removed?: Set<GanttChart>;
  };

  /**
   * Common field: State. Available as a direct property for convenience.
   * Can also be accessed via issue.fields.State
   * Accepts State object, EnumField value from requirements, or string name for assignment.
   */
  State?: BaseEntity | string | null;

  /**
   * Common field: Priority. Available as a direct property for convenience.
   * Can also be accessed via issue.fields.Priority
   * Accepts OwnedField, EnumField value from requirements, or string name for assignment.
   */
  Priority?: BaseEntity | string | null;

  /**
   * Common field: Type. Available as a direct property for convenience.
   * Can also be accessed via issue.fields.Type
   * Accepts EnumField value from requirements or string name for assignment.
   */
  Type?: BaseEntity | string | null;

  /**
   * Common field: Assignee. Available as a direct property for convenience.
   * Can also be accessed via issue.fields.Assignee
   * Accepts User object or string login for assignment.
   */
  Assignee?: BaseEntity | string | null;

  /**
   * Common field: Estimation. Available as a direct property for convenience.
   * Can also be accessed via issue.fields.Estimation
   * Accepts Period object for time estimation.
   */
  Estimation?: Period | null;

  /**
   * The custom fields that are used in an issue. This is the collection of issue attributes like
   * Assignee, State, and Priority that are defined in the Custom Fields section of the administrative interface and
   * can be attached to each project independently.
   *
   * Issue attributes like reporter, numberInProject, and project are accessed directly.
   * Both issue.State and issue.fields.State can be used to access/assign field values.
   */
  fields: FieldsWithAccess<any>;

  /**
   * Issue links (e.g. 'relates to', 'parent for', etc.). Each link is a Set of Issue objects.
   */
  links: {
    'relates to': Set<Issue>;
    'depends on': Set<Issue>;
    'is required for': Set<Issue>;
    'duplicates': Set<Issue>;
    'is duplicated by': Set<Issue>;
    'subtask of': Set<Issue>;
    'parent for': Set<Issue>;
    [key: string]: Set<Issue>;
  };

  /**
   * When `true`, the issue description is parsed as Markdown. When `false`, the issue description is parsed as YouTrack Wiki.
   * Changing this value does not transform the markup from one syntax to another.
   * @since 2017.4.38870
   */
  isUsingMarkdown: boolean;

  /**
   * Creates a new issue instance.
   * @param authorOrOptions Either the author/reporter of the issue, or an options object with reporter, project, and summary.
   * @param project The project where the issue is created (if first parameter is User).
   * @param summary The issue summary/title (if first parameter is User).
   */
  constructor(authorOrOptions: User | {
    reporter: User,
    project: Project,
    summary: string
  }, project?: Project, summary?: string);

  /**
   * Creates a copy of the issue.
   * @param project Optional. Project to create new issue in. If not provided, copies to the same project.
   * @returns The copy of the original issue.
   */
  copy(project?: Project): Issue;

  /**
   * Attaches a file to the issue. Can accept an object with attachment properties.
   * @param contentOrAttachment Either the content in binary form, or an object with attachment properties.
   * @param name The name of the file (if first parameter is binary).
   * @param charset The charset of the file (if first parameter is binary).
   * @param mimeType The MIME type of the file (if first parameter is binary).
   * @returns The attachment that is added to the issue.
   */
  addAttachment(contentOrAttachment: ArrayBuffer | Uint8Array | {
    content: ArrayBuffer | Uint8Array | string,
    name: string,
    charset?: string,
    mimeType?: string
  }, name?: string, charset?: string, mimeType?: string): IssueAttachment;

  /**
   * Adds a comment to the issue.
   * @param textOrOptions Either the text string or an options object with text and author.
   * @param author The author of the comment (if first parameter is string).
   * @returns A newly created comment.
   */
  addComment(textOrOptions: string | { text: string, author?: User }, author?: User): IssueComment;

  /**
   * Adds a work item to the issue.
   * @param descriptionOrOptions Either the description string or an options object with work item properties.
   * @param date The date that is assigned to the work item (if first parameter is string).
   * @param author The user who performed the work (if first parameter is string).
   * @param duration The work duration in minutes (if first parameter is string).
   * @param type The work item type (if first parameter is string).
   * @returns A newly created work item.
   */
  addWorkItem(descriptionOrOptions: string | {
    description: string,
    date: number,
    author: User,
    duration: number,
    type?: WorkItemType
  }, date?: number, author?: User, duration?: number, type?: WorkItemType): IssueWorkItem;

  /**
   * Creates a declaration of a rule that a user can apply to one or more issues with a command or menu option.
   * The object that is returned by this method is normally exported to the `rule` property, otherwise it is not treated as a rule.
   * @example
   * var entities = require('@jetbrains/youtrack-scripting-api/entities');
   * exports.rule = entities.Issue.action({
   *   title: 'Log comments',
   *   command: 'log',
   *   guard: function(ctx) {
   *     return ctx.issue.isReported;
   *   },
   *   action: function(ctx) {
   *     ctx.issue.comments.forEach(function(comment) {
   *       console.log(comment.text);
   *     });
   *   }
   * });
   * @param {Object} ruleProperties A JSON object that defines the properties for the rule.
   * @param {string} ruleProperties.title The human-readable name of the rule. Displayed in the administrative UI in YouTrack.
   * @param {string} ruleProperties.command The custom command that triggers the action.
   * @param {Object} [ruleProperties.userInput] An object that defines the properties for information that will be requested from the user who triggers the action rule.
   * @param {string|Object} [ruleProperties.userInput.type] The data type for the value that is requested from the user. The following types are supported:
   * * entities.Field.dateTimeType
   * * entities.Field.dateType
   * * entities.Field.integerType
   * * entities.Field.floatType
   * * entities.Field.periodType
   * * entities.Field.stringType
   * * entities.Build
   * * entities.EnumField
   * * entities.Issue
   * * entities.IssueTag
   * * entities.OwnedField
   * * entities.Project
   * * entities.ProjectVersion
   * * entities.UserGroup
   * * entities.User
   * @param {string} [ruleProperties.userInput.description] The label for the control that is used to collect additional information from the user.
   * @param {Issue~guardFunction} ruleProperties.guard A function that is invoked to determine whether the action is applicable to an issue.
   * @param {Issue~actionFunction} ruleProperties.action The function that is invoked when a user triggers this action.
   * @param {Requirements} ruleProperties.requirements The set of entities that must be present for the script to work as expected.
   * @param ruleProperties $ignore
   * @returns The object representation of the rule.
   */
  static action<R extends Requirements = Requirements>(ruleProperties?: RuleProperties<R>): RuleProperties<R>;

  /**
   * Creates a new issue draft.
   * @since 2025.1
   * @param project Project that the new issue draft is to belong to.
   * @param reporter Issue draft reporter.
   * @returns Newly created issue draft.
   */
  static createDraft(project: Project, reporter: User): Issue;

  /**
   * Creates a new shared issue draft.
   * @since 2025.1
   * @param project Project that the new issue draft is to belong to.
   * @returns Newly created issue draft.
   */
  static createSharedDraft(project: Project): Issue;

  /**
   * Searches for Issue entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of Issue entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<Issue>;

  /**
   * Finds an issue by its visible ID.
   * @example
   * var myIssue = entities.Issue.findById("NP-15971");
   * @param id The issue ID.
   * @returns The issue that is assigned the specified ID.
   */
  static findById(id: string): Issue;

  /**
   * Creates a declaration of a rule that is triggered when a change is applied to an issue.
   * The object that is returned by this method is normally exported to the `rule` property, otherwise it is not treated as a rule.
   * @example
   * var entities = require('@jetbrains/youtrack-scripting-api/entities');
   * exports.rule = entities.Issue.onChange({
   *   title: 'On issue change, log its ID',
   *   action: function(ctx) {
   *     console.log(ctx.issue.id);
   *   }
   * });
   * @param {Object} ruleProperties A JSON object that defines the properties for the rule.
   * @param {string} ruleProperties.title The human-readable name of the rule. Displayed in the administrative UI in YouTrack.
   * @param {Issue~guardFunction} ruleProperties.guard A function that determines the conditions for executing the rule. If the guard condition is not met, the action specified in the rule is not applied to the issue.
   * @param {Issue~actionFunction} ruleProperties.action The function that is invoked on an issue change.
   * @param {Requirements} ruleProperties.requirements The set of entities that must be present for the script to work as expected.
   * @param {Object} [ruleProperties.runOn] Determines which issue events trigger the on-change rule. When not specified, the rule is triggered on an issue change.
   * @param {boolean} [ruleProperties.runOn.change] When `true`, the rule is triggered on an issue change.
   * @param {boolean} [ruleProperties.runOn.removal] When `true`, the rule is triggered when an issue is logically deleted.
   * @param ruleProperties $ignore
   * @returns The object representation of the rule.
   */
  static onChange<R extends Requirements = Requirements>(ruleProperties?: RuleProperties<R>): RuleProperties<R>;

  /**
   * Creates a declaration of a rule that is triggered on a set schedule.
   * The object that is returned by this method is normally exported to the `rule` property, otherwise it is not treated as a rule.
   * @example
   * var entities = require('@jetbrains/youtrack-scripting-api/entities');
   * exports.rule = entities.Issue.onSchedule({
   *   title: 'Log IDs of major issues every 5 seconds',
   *   search: '#Major',
   *   cron: '0/5 * * * * ?',
   *   action: function(ctx) {
   *     console.log(ctx.issue.id);
   *   }
   * });
   * @param {Object} ruleProperties A JSON object that defines the properties for the rule.
   * @param {string} [ruleProperties.title] The human-readable name of the rule. Displayed in the administrative UI in YouTrack.
   * @param {string|function} ruleProperties.search A YouTrack search string or a function with no parameters that returns such a string.
   * The specified action is applied to all issues that match the search and belong to the project that this rule is attached to.
   * @param {string} ruleProperties.cron A cron expression that specifies the interval for applying the rule.
   * @param {boolean} [ruleProperties.muteUpdateNotifications] `true` if no notifications should be sent on changes made by this rule or any rule that reacted on a change made by this rule.
   * @param {boolean} [ruleProperties.modifyUpdatedProperties] When `true`, updates applied by the workflow rule are reflected in the `updated` and `updatedBy` properties of the target entity. Otherwise, the values for these properties remain unchanged.
   * @param {Issue~actionFunction} ruleProperties.action The function that is invoked on schedule for each issue that matches the search.
   * @param {Requirements} ruleProperties.requirements The set of entities that must be present for the script to work as expected.
   * @param ruleProperties $ignore
   * @returns The object representation of the rule.
   */
  static onSchedule<R extends Requirements = Requirements>(ruleProperties?: RuleProperties<R>): RuleProperties<R>;

  /**
   * Creates a declaration of a custom SLA policy. An SLA policy defines the time goals for the replies from staff and request resolution.
   * @example
   * const entities = require('@jetbrains/youtrack-scripting-api/entities');
   * exports.rule = entities.Issue.sla({
   *   title: "Support",
   *   guard: (ctx) => {
   *     return false;
   *   },
   *   onEnter: (ctx) => {
   *     console.log('onEnter', ctx.issue.id);
   *   },
   *   action: (ctx) => {
   *     console.log('action', ctx.issue.id);
   *   },
   *   onBreach: (ctx) => {
   *     console.log('onBreach', ctx.issue.id, ctx.breachedField);
   *   },
   *
   *   requirements: {
   *     firstReplyField: {
   *       type: entities.Field.dateTimeType,
   *       name: 'First Reply'
   *     },
   *     state: {
   *       type: entities.State.fieldType,
   *       name: 'State'
   *     }
   *   }
   * });
   * @param {Object} ruleProperties A JSON object that defines the properties for the SLA policy.
   * @param {string} ruleProperties.title The human-readable name of the SLA policy. Displayed in the administrative UI in YouTrack.
   * @param {Issue~slaGuardFunction} ruleProperties.guard A function that is invoked to determine whether the policy is applicable to the ticket.
   * @param {Issue~slaEnterFunction} ruleProperties.onEnter A function that is invoked when the SLA policy starts applying to the ticket.
   * @param {Issue~slaActionFunction} ruleProperties.action The function that is invoked when the policy needs to update the ticket. For example, it might pause the timers according to the SLA settings.
   * @param {Issue~slaBreachFunction} ruleProperties.onBreach A function that is invoked when one of the SLA goals is breached. The name of the field that caused the breach is stored in the ctx.breachedField parameter.
   * @param {Requirements} ruleProperties.requirements The set of entities that must be present for the script to work as expected.
   * When you define a custom field of date and time type in the requirements, YouTrack handles this field as an SLA timer.
   * @param ruleProperties $ignore
   * @returns The object representation of the SLA policy.
   */
  static sla<R extends Requirements = Requirements>(ruleProperties?: RuleProperties<R>): RuleProperties<R>;

  /**
   * Creates a declaration of a state-machine rule. The state-machine imposes restrictions for the transitions between values in a custom field.
   * You can execute actions when the custom field is set to a value, changes from a value, or transitions from two specific values.
   * The object that is returned by this method is normally exported to the `rule` property, otherwise it is not treated as a rule.
   * @example
   * var entities = require('@jetbrains/youtrack-scripting-api/entities');
   * exports.rule = entities.Issue.stateMachine({
   *   title: 'Status state machine',
   *   fieldName: 'Status',
   *   states: {
   *     Open: {
   *       initial: true,
   *       transitions: {
   *         start: {
   *           targetState: 'In progress'
   *         }
   *       }
   *     },
   *     'In progress': {
   *       onEnter: function(ctx) {
   *         ctx.issue.fields.Assignee = ctx.currentUser;
   *       },
   *       transitions: {
   *         fix: {
   *           targetState: 'Fixed'
   *         },
   *         reopen: {
   *           targetState: 'Open'
   *         }
   *       }
   *     },
   *     Fixed: {
   *       transitions: {
   *       }
   *     }
   *   },
   *   requirements: {
   *     Assignee: {
   *       type: entities.User.fieldType
   *     }
   *   }
   * });
   * @param {Object} ruleProperties A JSON object that defines the properties for the rule.
   * @param {string} ruleProperties.title The human-readable name of the rule. Displayed in the administrative UI in YouTrack.
   * @param {string} [ruleProperties.fieldName] The name of a field that is managed by the state-machine rule. Declare either fieldName or stateFieldName, not both.
   * @param {string} [ruleProperties.stateFieldName] An alias for ruleProperties.fieldName for building state-machines per issue type. When both stateFieldName and fieldName are declared, an exception is thrown.
   * @param {Object} [ruleProperties.states] A list of values for a custom field and the possible transitions between them. Declare either states or defaultStateMachine, not both.
   * @param {Object} [ruleProperties.defaultMachine] An alias for ruleProperties.states for building state-machines per issue type. When both defaultMachine and states are declared, an exception is thrown.
   * @param {string} [ruleProperties.typeFieldName] The name of a field that defines which state-machine applies to the managed field.
   * @param {Object} [ruleProperties.alternativeMachines] An object that contains the definitions for one or more state-machines that apply to different types of issues. Object keys are the possible values of the field that is defined by the ruleProperties.typeFieldName. Object values have the same structure that is shown for 'states' in the example.
   * This parameter is mandatory when the ruleProperties.typeFieldName parameter is specified.
   * @param {Requirements} ruleProperties.requirements The set of entities that must be present for the script to work as expected.
   * @param ruleProperties $ignore
   * @returns The object representation of the rule.
   */
  static stateMachine<R extends Requirements = Requirements>(ruleProperties?: RuleProperties<R>): RuleProperties<R>;

  /**
   * Attaches a file to the issue.
   * Makes `issue.attachments.isChanged` return `true` for the current transaction.
   * @since 2019.2.53994
   * @param content The content of the file in binary or base64 form.
   * @param name The name of the file.
   * @param charset The charset of the file. Only applicable to text files.
   * @param mimeType The MIME type of the file.
   * @returns The attachment that is added to the issue.
   */
  addAttachment(content: ArrayBuffer | Uint8Array, name: string, charset: string, mimeType: string): IssueAttachment;

  /**
   * Adds a comment to the issue.
   * Makes `issue.comments.isChanged` return `true` for the current transaction.
   * @param text The text to add to the issue as a comment.
   * @param author The author of the comment.
   * @returns A newly created comment.
   */
  addComment(text: string, author?: User): IssueComment;

  /**
   * Adds a tag with the specified name to an issue. YouTrack adds the first matching tag that is visible to the current user.
   * If a match is not found, a new private tag is created for the current user.
   * @param name The name of the tag to add to the issue.
   * @returns The tag that has been added to the issue.
   */
  addTag(name: string): Tag;

  /**
   * Adds a work item to the issue.
   * @param description The description of the work item.
   * @param date The date that is assigned to the work item.
   * @param author The user who performed the work.
   * @param duration The work duration in minutes.
   * @param type The work item type.
   * @returns The new work item.
   */
  addWorkItem(description: string, date: number, author: User, duration: number, type: WorkItemType): IssueWorkItem;

  /**
   * Adds the specified number of minutes to a specified starting point in time.
   * @since 2023.1
   * @param initialTime A timestamp for the starting point in time. YouTrack adds the specified number of minutes to this point.
   * @param minutes The number of minutes to add to the starting point.
   * @param calendar The SLA settings for the business hours that should be considered when adding minutes to the starting point. If the result falls outside the business hours after adding specified minutes, the extra minutes get automatically transferred to the next business day.
   * @param considerPauses A switcher that determines whether to consider the effects of the 'pauseSLA' and 'resumeSLA' methods when adding specified minutes to the starting point.
   * @returns A timestamp after adding the specified number of minutes.
   */
  afterMinutes(initialTime: number, minutes: number, calendar: Calendar, considerPauses: boolean): number;

  /**
   * Applies a command to the issue.
   * @param command The command that is applied to the issue.
   * @param runAs Specifies the user by which the command is applied. If this parameter is not set, the command is applied on behalf of the current user.
   */
  applyCommand(command: string, runAs: User): void;

  /**
   * Removes all of the attachments from the issue.
   */
  clearAttachments(): void;

  /**
   * Creates a copy of the issue.
   * @param project Project to create new issue in. Available since 2018.1.40575.
   * @returns The copy of the original issue.
   */
  copy(project: Project): Issue;

  /**
   * Checks whether the specified tag is attached to an issue.
   * @param tagName The name of the tag to check for the issue.
   * @param ignoreVisibilitySettings When `true`, checks all matching tags without regard to their visibility settings. When `false` (default), checks only matching tags that are visible to the current user.
   * @returns If the specified tag is attached to the issue, returns `true`.
   */
  hasTag(tagName: string, ignoreVisibilitySettings: boolean): boolean;

  /**
   * Checks whether the issue is accessible by specified user.
   * @param user The user to check.
   * @returns If the issue is accessible for the user, returns 'true'.
   */
  isVisibleTo(user: User): boolean;

  /**
   * Pauses the timers for the current SLA applied to the issue.
   * @since 2023.1
   */
  pauseSLA(): void;

  /**
   * Removes a tag with the specified name from an issue. If the specified tag is not attached to the issue, nothing happens.
   * This method first searches through tags owned by the current user, then through all other visible tags.
   * @param name The name of the tag to remove from the issue.
   * @returns The tag that has been removed from the issue.
   */
  removeTag(name: string): Tag;

  /**
   * Converts text in markdown to HTML. Use this method to send "pretty" notifications.
   * @example
   * issue.Assignee.notify('Comment added:', issue.renderMarkup(comment.text));
   * @param text The string of text to convert to HTML.
   * @returns Rendered markdown
   */
  renderMarkup(text: string): string;

  /**
   * Resumes the timers for the current SLA applied to the issue.
   * @since 2023.1
   */
  resumeSLA(): void;

  /**
   * Sets the default custom field values for the issue. Applies only for empty fields.
   * @since 2025.3
   */
  setDefaultFieldValues(): void;

  /**
   * Applies the tag to the issue.
   * @since 2025.3
   * @param tag The tag object.
   */
  tag(tag: Tag): void;

  /**
   * Removes the tag from the issue.
   * @since 2025.3
   * @param tag The tag object.
   */
  untag(tag: Tag): void;

}

/**
 * Represents a file that is attached to an issue.
 */
export declare class IssueAttachment extends PersistentFile {
  /**
   * The Base64 representation of the attachment.
   * @since 2021.2
   */
  readonly base64Content: string;

  /**
   * The content of the file in binary form.
   * @since 2019.2.53994
   */
  readonly content: ArrayBuffer | Uint8Array;

  /**
   * The user who attached the file to the issue.
   */
  readonly author: User;

  /**
   * The date and time when the attachment was created as a timestamp.
   */
  readonly created: number;

  /**
   * The URL of the issue attachment.
   * @since 2019.2.56440
   */
  readonly fileUrl: string;

  /**
   * If the attachment is removed, this property is `true`.
   */
  readonly isRemoved: boolean;

  /**
   * The issue that the file is attached to.
   */
  readonly issue: Issue;

  /**
   * The image dimensions. For image files, the value is rw=_width_&rh=_height_. For non-image files, the value is `empty`.
   */
  readonly metaData: string;

  /**
   * The group for which the attachment is visible when the visibility is restricted to a single group.
   */
  permittedGroup: UserGroup;

  /**
   * The groups for which the issue is visible when the visibility is restricted to multiple groups.
   */
  permittedGroups: Set<UserGroup>;

  /**
   * The list of users for whom the attachment is visible.
   */
  permittedUsers: Set<User>;

  /**
   * The date and time the attachment was last updated as a timestamp.
   */
  readonly updated: number;

  /**
   * Creates a declaration of a rule that a user can apply to an issue attachment using a menu option.
   * The object that is returned by this method is normally exported to the `rule` property, otherwise it is not treated as a rule.
   * @example
   * var entities = require('@jetbrains/youtrack-scripting-api/entities');
   * exports.rule = entities.IssueAttachment.action({
   *   title: 'Log attachment name',
   *   guard: function(ctx) {
   *     return ctx.issueAttachment.issue.isReported;
   *   },
   *   action: function(ctx) {
   *     console.log(ctx.issueAttachment.name);
   *   }
   * });
   * @param {Object} ruleProperties A JSON object that defines the properties for the rule.
   * @param {string} ruleProperties.title The human-readable name of the rule. Displayed in the administrative UI in YouTrack.
   * @param {Object} [ruleProperties.userInput] An object that defines the properties for information that will be requested from the user who triggers the action rule.
   * @param {string|Object} [ruleProperties.userInput.type] The data type for the value that is requested from the user. The following types are supported:
   * * entities.Field.dateTimeType
   * * entities.Field.dateType
   * * entities.Field.integerType
   * * entities.Field.floatType
   * * entities.Field.periodType
   * * entities.Field.stringType
   * * entities.Build
   * * entities.EnumField
   * * entities.Issue
   * * entities.IssueTag
   * * entities.OwnedField
   * * entities.Project
   * * entities.ProjectVersion
   * * entities.UserGroup
   * * entities.User
   * @param {string} [ruleProperties.userInput.description] The label for the control that is used to collect additional information from the user.
   * @param {IssueAttachment~guardFunction} ruleProperties.guard A function that is invoked to determine whether the action is applicable to an issue attachment.
   * @param {IssueAttachment~actionFunction} ruleProperties.action The function that is invoked when a user triggers this action.
   * @param {Requirements} ruleProperties.requirements The set of entities that must be present for the script to work as expected.
   * @param ruleProperties $ignore
   * @returns The object representation of the rule.
   */
  static action<R extends Requirements = Requirements>(ruleProperties?: RuleProperties<R>): RuleProperties<R>;

  /**
   * Searches for IssueAttachment entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of IssueAttachment entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<IssueAttachment>;

  /**
   * Permanently deletes the attachment.
   * @since 2018.1.40030
   */
  delete(): void;

}

/**
 * Represents a comment that is added to an issue.
 */
export declare class IssueComment extends BaseComment {
  /**
   * The absolute URL (permalink) that points to the comment.
   * @example
   * user.notify('Somebody has written something', 'Have a look: ' + comment.url);
   */
  readonly url: string;

  /**
   * The user who created the comment.
   */
  readonly author: User;

  /**
   * `true` in case the comment is displayed as removed.
   * @since 2020.6.4500
   */
  readonly deleted: boolean;

  /**
   * The issue the comment belongs to.
   */
  readonly issue: Issue;

  /**
   * A group who's members are allowed to access the comment.
   */
  permittedGroup: UserGroup;

  /**
   * Groups whose members are allowed to access the comment.
   */
  permittedGroups: Set<UserGroup>;

  /**
   * Users who are allowed to access the comment.
   */
  permittedUsers: Set<User>;

  /**
   * The user who last updated the comment.
   */
  readonly updatedBy: User;

  /**
   * Attaches a file to the comment.
   * @param content The content of the file in binary or base64 string form.
   * @param name The name of the file.
   * @param charset The charset of the file (optional).
   * @param mimeType The MIME type of the file (optional).
   * @returns The attachment that is added to the comment.
   */
  addAttachment(content: ArrayBuffer | Uint8Array | string, name: string, charset?: string, mimeType?: string): IssueAttachment;

  /**
   * Creates a declaration of a rule that a user can apply to an issue comment using a menu option.
   * The object that is returned by this method is normally exported to the `rule` property, otherwise it is not treated as a rule.
   * @example
   * var entities = require('@jetbrains/youtrack-scripting-api/entities');
   * exports.rule = entities.IssueComment.action({
   *   title: 'Log comment text if comment has attachments',
   *   guard: function(ctx) {
   *     return !ctx.issueComment.attachments.isEmpty();
   *   },
   *   action: function(ctx) {
   *     console.log(ctx.issueComment.text);
   *   }
   * });
   * @param {Object} ruleProperties A JSON object that defines the properties for the rule.
   * @param {string} ruleProperties.title The human-readable name of the rule. Displayed in the administrative UI in YouTrack.
   * @param {Object} [ruleProperties.userInput] An object that defines the properties for information that will be requested from the user who triggers the action rule.
   * @param {string|Object} [ruleProperties.userInput.type] The data type for the value that is requested from the user. The following types are supported:
   * * entities.Field.dateTimeType
   * * entities.Field.dateType
   * * entities.Field.integerType
   * * entities.Field.floatType
   * * entities.Field.periodType
   * * entities.Field.stringType
   * * entities.Build
   * * entities.EnumField
   * * entities.Issue
   * * entities.IssueTag
   * * entities.OwnedField
   * * entities.Project
   * * entities.ProjectVersion
   * * entities.UserGroup
   * * entities.User
   * @param {string} [ruleProperties.userInput.description] The label for the control that is used to collect additional information from the user.
   * @param {IssueComment~guardFunction} ruleProperties.guard A function that is invoked to determine whether the action is applicable to an issue comment.
   * @param {IssueComment~actionFunction} ruleProperties.action The function that is invoked when a user triggers this action.
   * @param {Requirements} ruleProperties.requirements The set of entities that must be present for the script to work as expected.
   * @param ruleProperties $ignore
   * @returns The object representation of the rule.
   */
  static action<R extends Requirements = Requirements>(ruleProperties?: RuleProperties<R>): RuleProperties<R>;

  /**
   * Searches for IssueComment entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of IssueComment entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<IssueComment>;

  /**
   * Attaches a file to the issue comment.
   * Makes `issue.attachments.isChanged` return `true` for the current transaction.
   * @since 2020.6.3400
   * @param content The content of the file in binary or base64 form.
   * @param name The name of the file.
   * @param charset The charset of the file. Only applicable to text files.
   * @param mimeType The MIME type of the file.
   * @returns The attachment that is added to the issue comment.
   */
  addAttachment(content: ArrayBuffer | Uint8Array, name: string, charset: string, mimeType: string): IssueAttachment;

  /**
   * Logically deletes the comment. This means that the comment is marked as deleted, but remains in the database.
   * Users with sufficient permissions can restore the comment or delete the comment permanently from the user interface.
   * The option to delete comments permanently has not been implemented in this API.
   * @since 2018.1.38923
   */
  delete(): void;

  /**
   * Checks whether the specified user has access to view the comment.
   * @since 2021.1.2300
   * @param user The user to check.
   * @returns When 'true', the specified user has access to view the comment. Otherwise, 'false'.
   */
  isVisibleTo(user: User): boolean;

}

/**
 * Represents an issue link type.
 */
export declare class IssueLinkPrototype extends BaseEntity {
  /**
   * The inward name of the issue link type.
   */
  readonly inward: string;

  /**
   * The outward name of the issue link type.
   */
  readonly outward: string;

  /**
   * Searches for IssueLinkPrototype entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of IssueLinkPrototype entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<IssueLinkPrototype>;

  /**
   * Finds an issue link type by its name.
   * @param name Name or localized name of an issue link type
   * @returns The issue link type.
   */
  static findByName(name: string): IssueLinkPrototype;

}

/**
 * Represents a work item that has been added to an issue.
 */
export declare class IssueWorkItem extends BaseWorkItem {
  /**
   * The date and time that is assigned to the work item. Stored as a Unix timestamp in UTC. The time part is set to midnight for the current date.
   */
  readonly date: number;

  /**
   * The duration of the work item in minutes.
   * Writable since 2018.1.40800
   */
  duration: number;


  /**
   * Custom work item attributes.
   * Represents the collection of custom attributes that have been declared for work items on a project level.
   * @since 2024.2
   */
  readonly attributes: Record<string, WorkItemAttributeValue>;

  /**
   * When true, the work item description uses Markdown syntax. Otherwise, it uses YouTrack Wiki syntax.
   */
  isUsingMarkdown: boolean;
  /**
   * Searches for IssueWorkItem entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of IssueWorkItem entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<IssueWorkItem>;

  /**
   * Permanently deletes the work item.
   * @since 2018.2.42312
   */
  delete(): void;

}

/**
 * Represents an email channel used in a helpdesk project. Email channels pull messages from an external mail service and process them according to the channel settings.
 */
export declare class MailboxChannel extends Channel {
  /**
   * Searches for MailboxChannel entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of MailboxChannel entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<MailboxChannel>;

}

/**
 * Represents a value in a custom field that has a user associated with it, a so-called owner.
 */
export declare class OwnedField extends Field {
  /**
   * The user who is associated with the value.
   */
  readonly owner: User;

  /**
   * Field type. Used when defining rule requirements.
   */
  static readonly fieldType: 'OwnedField.fieldType';

  /**
   * Searches for OwnedField entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of OwnedField entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<OwnedField>;

}

/**
 * Represents a custom field in a project that stores a value as a period type.
 * We use org.joda.time.Period as a base class for period values.
 * While you can read the class documentation at
 * http://joda-time.sourceforge.net/apidocs/org/joda/time/Period.html,
 * please note that we support only class members which use the Period class and
 * primitive types like String and int.
 * @example
 * // to convert period to minutes (or other units) use get* methods:
 * var period = issue.fields.Estimation;
 * var minutes = !period ? 0 : (period.getMinutes() +
 *                              60 * (period.getHours() +
 *                                    8 * period.getDays()));
 * // to create Period instance, use toPeriod function from date-time module:
 * issue.fields.Estimation = dateTime.toPeriod(3 * 3600 * 1000); // 3h in ms
 * issue.fields.Estimation = dateTime.toPeriod('3h'); // short form
 * issue.fields.Estimation = dateTime.toPeriod('2w4d3h15m'); // full form
 */
export declare class PeriodProjectCustomField extends SimpleProjectCustomField {
  /**
   * Searches for PeriodProjectCustomField entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of PeriodProjectCustomField entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<PeriodProjectCustomField>;

}

/**
 * Represents the common ancestor for all persistent files that are available in YouTrack.
 */
export declare class PersistentFile extends BaseEntity {
  /**
   * The charset type of the file. Only applicable to text files.
   * @since 2019.2.53994
   */
  readonly charset: string;

  /**
   * The extension that defines the file type.
   */
  readonly extension: string;

  /**
   * The MIME type of the file.
   * @since 2019.2.53994
   */
  readonly mimeType: string;

  /**
   * The name of the file.
   */
  readonly name: string;

  /**
   * The size of the attached file in bytes.
   */
  readonly size: number;

  /**
   * Searches for PersistentFile entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of PersistentFile entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<PersistentFile>;

}

/**
 * Represents a YouTrack project.
 */
export declare class Project extends BaseEntity {
  /**
   * The list of VCS change processors that are integrated with the project.
   * @since 2020.3
   */
  readonly changesProcessors: Set<ChangesProcessor>;

  /**
   * The set of custom fields that are available in the project.
   */
  readonly fields: Set<ProjectCustomField>;

  /**
   * The ID of the project. Use instead of project.shortName, which is deprecated.
   */
  readonly key: string;

  /**
   * The name of the project.
   */
  readonly name: string;

  /**
   * The email address that is used to send notifications for the project.
   * If a 'From' address is not set for the project, the default 'From' address for the YouTrack server is returned.
   * @example
   * if (issue.becomesReported) {
   *   const lastRelatedEmails = issue.fields['Last message related emails'];
   *   lastRelatedEmails?.split(' ')?.forEach(function (email) {
   *     if (email?.equalsIgnoreCase(issue.project.notificationEmail)) {
   *       const allRelatedEmails = issue.fields['All related emails'];
   *       if (!allRelatedEmails) {
   *         issue.fields['All related emails'] = email;
   *       } else if (!(allRelatedEmails.split(' ').has(email))) {
   *         issue.fields['All related emails'] = allRelatedEmails + ' ' + email;
   *       }
   *     }
   *   });
   *   issue.fields['Last message related emails'] = null;
   * }
   */
  readonly notificationEmail: string;

  /**
   * The list of VCS change processors that are shared with the project.
   * @since 2025.3
   */
  readonly sharedChangesProcessors: Set<ChangesProcessor>;

  /**
   * A UserGroup object that contains the users and members of groups who are assigned to the project team.
   * @since 2017.4.38235
   */
  readonly team: UserGroup;

  /**
   * Work item attributes configured for the project.
   * @since 2024.2
   */
  readonly workItemAttributes: Set<WorkItemProjectAttribute>;

  /**
   * If the project is currently archived, this property is `true`.
   */
  readonly isArchived: boolean;

  /**
   * A list of all articles that belong to the project.
   * @since 2021.4.23500
   */
  readonly articles: Set<Article>;

  /**
   * The description of the project as shown on the project profile page.
   */
  readonly description: string;

  /**
   * A list of all issues that belong to the project.
   */
  readonly issues: Set<Issue>;

  /**
   * The user who is set as the project owner.
   */
  readonly leader: User;

  /**
   * Determines which basic features are available for use in a project. Possible values are 'standard' or 'helpdesk'.
   */
  readonly projectType: ProjectType;

  /**
   * @deprecated, use project.key instead
   */
  readonly shortName: string;

  /**
   * Searches for Project entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of Project entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<Project>;

  /**
   * Finds a project by ID.
   * @param key The ID of the project to search for.
   * @returns The project, or null when there are no projects with the specified ID.
   */
  static findByKey(key: string): Project;

  /**
   * Finds a project by name.
   * @param name The name of the project to search for.
   * @returns The project, or null when there are no projects with the specified name.
   */
  static findByName(name: string): Project;

  /**
   * Returns the custom field in the project with the specified name.
   * @param name The name of the custom field.
   * @returns The custom field with the specified name.
   */
  findFieldByName(name: string): ProjectCustomField;

  /**
   * Returns work item attribute with the given name or null if it does not exist.
   * @since 2024.2
   * @param name Name of the attribute to find by
   * @returns Work item attribute with the given name or null if it does not exist.
   */
  findWorkItemAttributeByName(name: string): WorkItemProjectAttribute;

  /**
   * Gets the number of minutes that occurred during working hours in a specified interval.
   * For example, if the interval is two days and the number of working hours in a day is set to 8, the result is 2 * 8 * 60 = 960
   * @param start Start of the interval.
   * @param end End of the interval.
   * @returns The number of minutes that occurred during working hours in the specified interval.
   */
  intervalToWorkingMinutes(start: number, end: number): number;

  /**
   * Checks if the specified user is an agent in the project.
   * @since 2023.1
   * @param user The user to check.
   * @returns If the specified user is added to agents in the project, returns 'true'.
   */
  isAgent(user: User): boolean;

  /**
   * Creates a new issue draft.
   * @since 2021.4
   * @param reporter Issue draft reporter.
   * @returns Newly created issue draft.
   */
  newDraft(reporter: User): Issue;

}

/**
 * Represents a custom field that is available in a project.
 */
export declare class ProjectCustomField extends BaseEntity {
  /**
   * The localized name of the field.
   */
  readonly localizedName: string;

  /**
   * The name of the field.
   */
  readonly name: string;

  /**
   * The data type assigned to values stored in the custom field.
   */
  readonly typeName: string;

  /**
   * The text that is displayed for this field when it is empty.
   */
  readonly nullValueText: string;

  /**
   * Checks if the changes that are applied in the current transaction remove the condition to show the custom field.
   * @since 2018.2.42312
   * @param issue The issue for which the condition for showing the field is checked.
   * @returns When `true`, the condition for showing the field is removed in the current transaction.
   */
  becomesInvisibleInIssue(issue: Issue): boolean;

  /**
   * Checks if the changes that are applied in the current transaction satisfy the condition to show the custom field.
   * @since 2018.2.42312
   * @param issue The issue for which the condition for showing the field is checked.
   * @returns When `true`, the condition for showing the field is met in the current transaction.
   */
  becomesVisibleInIssue(issue: Issue): boolean;

  /**
   * Returns the background color that is used for this field value in the specified issue.
   * Can return `null`, `"white"`, or a hex color presentation.
   * @param issue The issue for which the background color is returned.
   * @returns The background color that is used for this field value in the specified issue.
   */
  getBackgroundColor(issue: Issue): string;

  /**
   * Returns the foreground color that is used for this field value in the specified issue.
   * Can return `null`, `"white"`, or a hex color presentation.
   * @param issue The issue for which the foreground color is returned.
   * @returns The foreground color that is used for this field value in the specified issue.
   */
  getForegroundColor(issue: Issue): string;

  /**
   * Returns the string presentation of the value that is stored in this field in the specified issue.
   * @param issue The issue for which the value presentation is returned.
   * @returns The string presentation of the value.
   */
  getValuePresentation(issue: Issue): string;

  /**
   * Checks if a field is visible in the issue.
   *
   * @example
   * // The following example checks the issue to see whether a conditional field with the name "Related Activity"
   * // is currently visible, meaning that the conditions for showing the field have been met.
   * // If so, the value for the field is set to "Attendance"
   *
   * action: function (ctx) {
   *   if (ctx.RelatedActivity.isVisibleInIssue(ctx.issue)) {
   *     ctx.issue.fields.RelatedActivity.add(ctx.RelatedActivity.Attendance);
   *   }
   * },
   * requirements: {
   *   RelatedActivity: {
   *     name: 'Related Activity',
   *     type: entities.EnumField.fieldType,
   *     multi: true,
   *     Attendance: {}
   *   }
   * }
   * @since 2018.2.42312
   * @param issue The issue for which the condition for showing the field is checked.
   * @returns When `true`, the condition for showing the custom field in the issue has been met. It can also mean that the field is not shown on a conditional basis and is always visible.
   */
  isVisibleInIssue(issue: Issue): boolean;

}

/**
 * Represents a project team.
 */
export declare class ProjectTeam extends UserGroup {
  /**
   * The project that the team belongs to.
   * @since 2025.3
   */
  readonly project: Project;

  /**
   * Searches for ProjectTeam entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of ProjectTeam entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<ProjectTeam>;

}

/**
 * Represents a classification that determines which basic features are available for use in a project.
 */
export declare class ProjectType extends BaseEntity {
  /**
   * Identifies a standard project for issue tracking.
   */
  readonly DEFAULT: ProjectType;

  /**
   * Identifies a helpdesk project for managing tickets.
   */
  readonly HELPDESK: ProjectType;

  /**
   * Name of the project type.
   */
  readonly typeName: string;

  /**
   * Searches for ProjectType entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of ProjectType entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<ProjectType>;

}

/**
 * Represents a value in a custom field that stores a version type.
 */
export declare class ProjectVersion extends Field {
  /**
   * If the version is released, this property is `true`.
   */
  readonly isReleased: boolean;

  /**
   * The release date that is associated with the version.
   */
  readonly releaseDate: number;

  /**
   * The start date that is associated with the version.
   */
  readonly startDate: number;

  /**
   * Field type. Used when defining rule requirements.
   */
  static readonly fieldType: 'ProjectVersion.fieldType';

  /**
   * Searches for ProjectVersion entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of ProjectVersion entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<ProjectVersion>;

}

/**
 * Represents a pull or merge request that is attached to an issue.
 * @since 2020.3
 */
export declare class PullRequest extends AbstractVcsItem {
  /**
   * Human readable id of pull-request
   * @since 2025.2
   */
  readonly idReadable: string;

  /**
   * The previous state of the pull request.
   * @since 2020.3
   */
  readonly previousState: PullRequestState;

  /**
   * The URL of the pull request.
   * @since 2021.1
   */
  readonly url: string;

  /**
   * The date when the pull request was retrieved from the VCS change processor.
   */
  readonly fetched: number;

  /**
   * A unique identifier.
   */
  readonly id: string;

  /**
   * The processor for VCS changes that transmitted information about the pull request.
   */
  readonly processor: ChangesProcessor;

  /**
   * The state of the pull request.
   */
  readonly state: PullRequestState;

  /**
   * The title of the pull request.
   */
  readonly title: string;

  /**
   * Searches for PullRequest entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of PullRequest entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<PullRequest>;

}

/**
 * Represents a pull request state.
 * @since 2020.3
 */
export declare class PullRequestState extends BaseEntity {
  /**
   * The pull request was declined.
   */
  readonly DECLINED: PullRequestState;

  /**
   * The pull request was merged.
   */
  readonly MERGED: PullRequestState;

  /**
   * The pull request is open.
   */
  readonly OPEN: PullRequestState;

  /**
   * Name of the pull request state.
   */
  readonly name: string;

  /**
   * Searches for PullRequestState entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of PullRequestState entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<PullRequestState>;

}

/**
 * Represents a saved search.
 */
export declare class SavedQuery extends WatchFolder {
  /**
   * The name of the saved search.
   */
  readonly name: string;

  /**
   * The user who created the saved search.
   */
  readonly owner: User;

  /**
   * The search query.
   */
  readonly query: string;

  /**
   * Searches for SavedQuery entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of SavedQuery entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<SavedQuery>;

  /**
   * Finds a list of saved searches with the specified name. The list only includes saved searches that are visible to the current user.
   * The saved searches that were created by the current user are returned at the top of the list.
   * @param name The name of the saved search to search for.
   * @returns A list of saved searches that match the specified name.
   */
  static findByName(name: string): Set<SavedQuery>;

  /**
   * Finds the most relevant saved search with the specified name that is visible to the current user.
   * @param name The name of the saved search to search for.
   * @returns The most relevant saved search.
   */
  static findQueryByName(name: string): SavedQuery;

}

/**
 * Represents a work days calendar in YouTrack.
 */
export declare class SimpleCalendar extends Calendar {
  /**
   * Searches for SimpleCalendar entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of SimpleCalendar entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<SimpleCalendar>;

}

/**
 * Base class for custom fields that store simple values like strings and numbers.
 */
export declare class SimpleProjectCustomField extends ProjectCustomField {
  /**
   * Searches for SimpleProjectCustomField entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of SimpleProjectCustomField entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<SimpleProjectCustomField>;

}

/**
 * Represents a sprint that is associated with an agile board. Each sprint can include issues from one or more projects.
 */
export declare class Sprint extends BaseEntity {
  /**
   * The agile board that the sprint belongs to.
   */
  readonly agile: Agile;

  /**
   * The end date of the sprint.
   */
  readonly finish: number;

  /**
   * If the sprint is currently archived, this property is `true`.
   */
  readonly isArchived: boolean;

  /**
   * The name of the sprint.
   */
  readonly name: string;

  /**
   * The start date of the sprint.
   */
  readonly start: number;

  /**
   * Searches for Sprint entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of Sprint entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<Sprint>;

  /**
   * Adds the issue to the sprint.
   * @param issue The issue that is added to the sprint.
   */
  addIssue(issue: Issue | BaseEntity): void;

  /**
   * Checks whether the issue belongs to the sprint.
   * @param issue The issue for which the condition is checked.
   * @returns If the issue belongs to the sprint, returns ``true``.
   */
  containsIssue(issue: Issue | BaseEntity): boolean;

  /**
   * Checks whether the specified issue is represented as a swimlane on the agile board that the sprint belongs to.
   * @param issue The issue to check.
   * @returns If the specified issue is represented as a swimlane in the sprint, returns `true`.
   */
  isSwimlane(issue: Issue | BaseEntity): boolean;

  /**
   * Removes the issue from the sprint.
   * @param issue The issue that is removed from the sprint.
   */
  removeIssue(issue: Issue | BaseEntity): void;

}

/**
 * Represents a value in a custom field that stores a state type.
 */
export declare class State extends Field {
  /**
   * If issues in this state are considered to be resolved, ths property is `true`.
   */
  readonly isResolved: boolean;

  /**
   * Field type. Used when defining rule requirements.
   */
  static readonly fieldType: 'State.fieldType';

  /**
   * Searches for State entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of State entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<State>;

}

/**
 * Represents a tag.
 */
export declare class Tag extends WatchFolder {
  /**
   * The name of the tag.
   */
  readonly name: string;

  /**
   * The user who created the tag.
   */
  readonly owner: User;

  /**
   * The groups of users who can apply the tag.
   * @since 2022.1
   */
  readonly permittedTagUserGroups: Set<UserGroup>;

  /**
   * The users who can apply the tag.
   * @since 2022.1
   */
  readonly permittedTagUsers: Set<User>;

  /**
   * Searches for Tag entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of Tag entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<Tag>;

  /**
   * Finds a set of tags with the specified name. The tags that were created by the current user are returned at the top of the list.
   * @param name The name of the tag to search for.
   * @param ignoreVisibilitySettings When `true`, returns all matching tags without regard to their visibility settings. When `false` (default), returns only matching tags that are visible to the current user.
   * @returns The set of tags that match the specified name.
   */
  static findByName(name: string, ignoreVisibilitySettings: boolean): Set<Tag>;

  /**
   * Finds tags owned by a specified user without considering the visibility settings for the tags.
   * @since 2025.3
   * @param owner The owner of the tags to find.
   * @returns The set of tags with the specified owner.
   */
  static findByOwner(owner: User): Set<Tag>;

  /**
   * Finds the most relevant tag with the specified name that is visible to the current user.
   * "Star" tag is excluded from the results.
   * @param name The name of the tag to search for.
   * @returns The most relevant tag.
   */
  static findTagByName(name: string): Tag;

  /**
   * Checks whether a user has permission to use the tag in the specified article.
   * @since 2025.3
   * @param article The article to tag.
   * @param user The user to check. Defaults to the current user.
   * @returns If the user can tag the article, returns `true`.
   */
  canBeUsedForArticle(article: BaseArticle, user: User): boolean;

  /**
   * Checks whether a user has permission to use the tag in the specified issue.
   * @since 2025.3
   * @param issue The issue to tag.
   * @param user The user to check. Defaults to the current user.
   * @returns If the user can tag the issue, returns `true`.
   */
  canBeUsedForIssue(issue: Issue, user: User): boolean;

}

/**
 * Represents a custom field that stores a string of characters as text. When displayed in an issue, the text is shown as formatted in Markdown.
 */
export declare class TextProjectCustomField extends SimpleProjectCustomField {
  /**
   * Searches for TextProjectCustomField entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of TextProjectCustomField entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<TextProjectCustomField>;

}

/**
 * Represents a user account in YouTrack.
 */
export declare class User extends BaseEntity {
  /**
   * The absolute URL of the image that is used as the avatar for a user account. May point to an external service, like Gravatar.
   * @since 2019.3
   */
  readonly avatarUrl: string;

  /**
   * First day of week as set in the user's profile settings. 0 is for Sunday, 1 is for Monday, etc.
   * @since 2019.1.50122
   */
  readonly firstDayOfWeeks: number;

  /**
   * The display language selected in the general settings of the user profile.
   * @since 2022.1
   */
  readonly language: string;

  /**
   * Returns pinned by the user saved queries.
   * @since 2025.3
   */
  readonly pinnedSavedQueries: Set<SavedQuery>;

  /**
   * ID of the user in Hub. You can use this ID for operations in Hub, and for matching users between YouTrack and Hub.
   * @since 2020.6.3000
   */
  readonly ringId: string;

  /**
   * The ID of the local time zone selected in the general settings of the user profile.
   */
  readonly timeZoneId: string;

  /**
   * The full name of the user or the login if the full name is not set.
   */
  readonly visibleName: string;

  /**
   * If the user is currently banned, this property is `true`.
   */
  readonly isBanned: boolean;

  /**
   * If the user has interacted with YouTrack in any way within the last five minutes.
   * @since 2022.1
   */
  readonly isOnline: boolean;

  /**
   * When `true`, the user functions as a system user. System users are user accounts utilized for running imports, integrations, and other automations.
   * @since 2022.2
   */
  readonly isSystem: boolean;

  /**
   * The email address of the user.
   */
  email: string;

  /**
   * The full name of the user as seen in their profile.
   */
  readonly fullName: string;

  /**
   * The list of user's groups.
   * @since 2025.3
   */
  readonly groups: Set<UserGroup>;

  /**
   * Indicates whether the user has a verified email address in their profile.
   * @since 2023.1
   */
  readonly isEmailVerified: boolean;

  /**
   * The login of the user.
   */
  readonly login: string;

  /**
   * The date when the user was registered.
   * @since 2024.3
   */
  readonly registered: number;

  /**
   * The list of user's project teams.
   * @since 2025.3
   */
  readonly teams: Set<ProjectTeam>;


  /**
   * Custom user attributes.
   * Represents the collection of custom attributes that have been added to user profiles.
   * @since 2021.1.7000
   */
  readonly attributes: Record<string, FieldValue>;
  /**
   * The current (logged in) user.
   */
  static readonly current: User;

  /**
   * Field type. Used when defining rule requirements.
   */
  static readonly fieldType: 'User.fieldType';

  /**
   * Finds users by email.
   * @since 2018.2.41100
   * @param email The email to search for.
   * @returns Users with the specified email.
   */
  static findByEmail(email: string): Set<User>;

  /**
   * Searches for User entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of User entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<User>;

  /**
   * Finds a user by login.
   * @param login The login of the user account to search for.
   * @returns The specified user, or null when a user with the specified login is not found.
   */
  static findByLogin(login: string): User;

  /**
   * Finds a user by email.
   * @since 2018.2.41100
   * @param email The email of the user account to search for.
   * @returns The specified user, or null when a user with the specified email is not found or there are multiple users with the specified email.
   */
  static findUniqueByEmail(email: string): User;

  /**
   * Checks whether the user is permitted to link the specified issue to any other issue.
   * @param issue The issue to link.
   * @returns If the user can link the issue, returns `true`.
   */
  canLinkIssue(issue: Issue): boolean;

  /**
   * Checks whether the user is able to remove their vote from the specified issue.
   * @param issue The issue to check.
   * @returns If the user can vote for the issue, returns `true`.
   */
  canUnvoteIssue(issue: Issue): boolean;

  /**
   * Checks whether the user is able to vote for the specified issue.
   * @param issue The issue to check.
   * @returns If the user can vote for the issue, returns `true`.
   */
  canVoteIssue(issue: Issue): boolean;

  /**
   * Returns a tag with the specified name that is shared with but not owned by the user. If such a tag does not exist, a null value is returned.
   * @param name The name of the tag.
   * @returns The tag.
   */
  getSharedTag(name: string): Tag;

  /**
   * Returns a tag that is visible to the user.
   * @param name The name of the tag.
   * @param createIfNotExists If `true` and the specified tag does not exist or is not visible to the user and the user has permission to create tags, a new tag with the specified name is created.
   * @returns The tag.
   */
  getTag(name: string, createIfNotExists: boolean): Tag;

  /**
   * Checks whether the user is granted the specified role in the specified project. When the project parameter is not specified, checks whether the user has the specified role in any project.
   * @param roleName The name of the role to check for.
   * @param project The project to check for the specified role assignment. If omitted, checks if the user has the global role.
   * @returns If the user is granted the specified role, returns `true`.
   */
  hasRole(roleName: string, project: Project): boolean;

  /**
   * Checks whether the user is a member of the specified group.
   * @param groupName The name of the group to check for.
   * @returns If the user is a member of the specified group, returns `true`.
   */
  isInGroup(groupName: string): boolean;

  /**
   * Check whether the user has voted for the specified issue.
   * @since 2025.3
   * @param issue The issue to check the vote is added.
   * @returns If the user has voted for the issue, returns `true`.
   */
  isVotedForIssue(issue: Issue): boolean;

  /**
   * Checks whether the current user is added as a watcher for the specified issue.
   * @since 2025.3
   * @param issue The issue to check for the watcher assignment.
   * @returns If the user is added as a watcher for the issue, returns `true`.
   */
  isWatchingIssue(issue: Issue): boolean;

  /**
   * Sends an email notification to the email address that is set in the user profile.
   * @param subject The subject line of the email notification.
   * @param body The message text of the email notification.
   * @param ignoreNotifyOnOwnChangesSetting If `false`, the message is not sent when changes are performed on behalf of the current user. Otherwise, the message is sent anyway.
   * @param project When set, the email address that is used as the 'From' address for the specified project is used to send the message.
   */
  notify(subject: string, body: string, ignoreNotifyOnOwnChangesSetting?: boolean, project?: Project): void;

  /**
   * Sends a notification to all notification channels configured for the user.
   * @param {string} caseName The name of the notification case as seen on the notification templates configuration page.
   * @param {Object} [parameters] A JSON object that provides required parameters for the notification to render. Particular parameters depend on the notification case.
   * @param {Issue|Article} [projectDocument] An issue or an article that this notification is about. The difference between providing it as a separately vs. passing it among other parameters is that in the former case the notification will be merged with other notifications on that issue/article.
   * @since 2023.1
   * @param caseName $ignore
   * @param parameters $ignore
   * @param projectDocument $ignore
   */
  notifyOnCase(caseName: string, parameters: Record<string, any>, projectDocument: Issue): void;

  /**
   * Sends an email notification to the email address that is set in the user profile. An alias for notify(subject, body, true).
   * @param subject The subject line of the email notification.
   * @param body The message text of the email notification.
   */
  sendMail(subject: string, body: string): void;

  /**
   * Removes a vote on behalf of the user from the issue, if allowed.
   * @param issue The issue from which the vote is removed.
   */
  unvoteIssue(issue: Issue): void;

  /**
   * Removes the current user from the list of watchers for the article
   * (removes the `Star` tag).
   * @since 2023.1
   * @param article The article from which the user is removed as a watcher.
   */
  unwatchArticle(article: BaseArticle): void;

  /**
   * Removes the current user from the list of watchers for the issue
   * (removes the `Star` tag).
   * @param issue The issue from which the user is removed as a watcher.
   */
  unwatchIssue(issue: Issue): void;

  /**
   * Adds a vote on behalf of the user to the issue, if allowed.
   * @param issue The issue to which the vote is added.
   */
  voteIssue(issue: Issue): void;

  /**
   * Adds the current user to the article as a watcher (adds the `Star` tag).
   * @since 2023.1
   * @param article The article to which the user is added as a watcher.
   */
  watchArticle(article: BaseArticle): void;

  /**
   * Adds the current user to the issue as a watcher (adds the `Star` tag).
   * @param issue The issue to which the user is added as a watcher.
   */
  watchIssue(issue: Issue): void;

}

/**
 * Represents a value-based condition for a custom field in a specific project, where the field stores references to a user.
 * @since 2025.3
 */
export declare class UserCondition extends BaseEntity {
  /**
   * The value of the field that is used to determine the set of `possibleValues` in the conditional field.
   * @since 2025.3
   */
  readonly bundleElement: Field;

  /**
   * The set of possible user values for the conditional field.
   * @since 2025.3
   */
  readonly possibleValues: Set<User>;

}

/**
 * Represents a group of users.
 */
export declare class UserGroup extends BaseEntity {
  /**
   * If the auto-join option is enabled for the group, this property is `true`.
   */
  readonly isAutoJoin: boolean;

  /**
   * A list of users who are members of the group.
   */
  readonly users: Set<User>;

  /**
   * The description of the group.
   */
  readonly description: string;

  /**
   * If the group is the All Users group, this property is `true`.
   */
  readonly isAllUsersGroup: boolean;

  /**
   * The name of the group.
   */
  readonly name: string;

  /**
   * The All Users group.
   */
  static readonly allUsersGroup: UserGroup;

  /**
   * Field type. Used when defining rule requirements.
   */
  static readonly fieldType: 'UserGroup.fieldType';

  /**
   * Searches for UserGroup entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of UserGroup entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<UserGroup>;

  /**
   * Finds a group by name.
   * @param name The name of the group to search for.
   * @returns The specified user group, or null when a group with the specified name is not found.
   */
  static findByName(name: string): UserGroup;

  /**
   * Sends an email notification to all of the users who are members of the group.
   * @example
   * issue.oldValue('permittedGroup').notifyAllUsers('Visibility has been changed',
   *   'The visibility group for the issue ' + issue.getId() +
   *   ' has been changed to ' + permittedGroup.name);
   * @param subject The subject line of the email notification.
   * @param body The message text of the email notification.
   */
  notifyAllUsers(subject: string, body: string): void;

}

/**
 * Represents a custom field in a project that stores values as a user type.
 */
export declare class UserProjectCustomField extends ProjectCustomField {
  /**
   * The list of available values for the custom field.
   */
  readonly values: Set<User>;

  /**
   * The default value for the custom field.
   */
  readonly defaultUsers: Set<User>;

  /**
   * The condition that determines which values are possible for this field based on the condition field value. If not set, all values are possible.
   * @since 2025.3
   */
  readonly valuesCondition: FieldBasedUserValuesCondition;

  /**
   * Searches for UserProjectCustomField entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of UserProjectCustomField entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<UserProjectCustomField>;

  /**
   * Returns the value that matches the specified login in a custom field that stores values as a user type.
   * @param login The user login to search for in the set of values for the custom field.
   * @returns The user with the specified login. This user can be set as the value for a field that stores a user type.
   */
  findValueByLogin(login: string): User;

  /**
   * The list of possible custom field values based on the value-based conditions in the project settings and the current value stored in the issue. If there are no value-based conditions in the project settings, returns the complete list of values for the custom field.
   * @since 2025.3
   * @param issue The issue for which the value is checked.
   * @returns The set of possible users.
   */
  getPossibleValuesForIssue(issue: Issue): Set<User>;

  /**
   * Checks if value is permitted in the issue.
   * @since 2025.2
   * @param issue The issue for which the value is checked.
   * @param value The value to check.
   * @returns If the value can be used for the issue, returns `true`.
   */
  isValuePermittedInIssue(issue: Issue, value: User): boolean;

}

/**
 * Represents a commit that is attached to an issue.
 * @since 2018.1.38923
 */
export declare class VcsChange extends AbstractVcsItem {
  /**
   * The list of change processors that the VCS change can be retrieved from.
   * @since 2018.1.38923
   */
  readonly changesProcessors: Set<ChangesProcessor>;

  /**
   * The date when the change was applied, as returned by the VCS.
   * @since 2018.1.39547
   */
  readonly created: number;

  /**
   * The date when the change was applied, as returned by the VCS.
   * Use `VcsChange.created` instead.
   * @deprecated 2018.1.39547
   * @since 2018.1.38923
   */
  readonly date: number;

  /**
   * The date when the VCS change was retrieved from the change processor.
   * @since 2018.1.39547
   */
  readonly fetched: number;

  /**
   * A unique identifier. Used by some CI servers in addition to version.
   * @since 2018.1.38923
   */
  readonly id: number;

  /**
   * The version number of the change. For a Git-based VCS, the revision hash.
   * @since 2018.1.38923
   */
  readonly version: string;

  /**
   * Searches for VcsChange entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of VcsChange entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<VcsChange>;

  /**
   * Extracts commands from vcs change on behalf of provided user
   * @since 2024.4.52947
   * @param user The user to act as.
   * @returns List of commands that can be extracted from vcs change by provided user
   */
  extractCommands(user: User): FieldValue[];

  /**
   * Returns the URL for a specific VCS change.
   * @since 2021.2
   * @param processor The entity that retrieved the VCS change and created its representation in YouTrack.
   * @returns The URL of the VCS change.
   */
  getUrl(processor: ChangesProcessor): string;

  /**
   * Checks whether the specified user has access to view the VCS change.
   * @since 2020.1.1331
   * @param user The user to check.
   * @returns When 'true', the specified user has access to view the VCS change. Otherwise, 'false'.
   */
  isVisibleTo(user: User): boolean;

}

/**
 * Represents a VCS server.
 * @since 2018.1.38923
 */
export declare class VcsServer extends BaseEntity {
  /**
   * The URL of the VCS server.
   * @since 2018.1.38923
   */
  readonly url: string;

}

/**
 * Represents a common ancestor of classes that represent tags and saved searches.
 */
export declare class WatchFolder extends BaseEntity {
  /**
   * The group of users for whom the tag or saved search is visible.
   * If the tag or the saved search is only visible to its owner, the value for this property is `null`.
   * Use `folder.permittedReadUserGroups` and `folder.permittedReadUsers` instead.
   */
  readonly shareGroup: UserGroup;

  /**
   * The group of users who are allowed to update the settings for the tag or saved search.
   * If the tag or the saved search can only be updated by its owner, the value for this property is `null`.
   * Use `folder.permittedUpdateUserGroups` and `folder.permittedUpdateUsers` instead.
   */
  readonly updateShareGroup: UserGroup;

  /**
   * The groups of users for whom the tag or saved search is visible.
   */
  readonly permittedReadUserGroups: Set<UserGroup>;

  /**
   * The users for whom the tag or saved search is visible.
   */
  readonly permittedReadUsers: Set<User>;

  /**
   * The groups of users who are allowed to update the settings for the tag or saved search.
   */
  readonly permittedUpdateUserGroups: Set<UserGroup>;

  /**
   * The users who are allowed to update the settings for the tag or saved search.
   */
  readonly permittedUpdateUsers: Set<User>;

}

/**
 * Value of a work item attribute.
 * @since 2022.2
 */
export declare class WorkItemAttributeValue extends BaseEntity {
  /**
   * Name of the attribute value
   */
  readonly name: string;

  /**
   * Searches for WorkItemAttributeValue entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of WorkItemAttributeValue entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<WorkItemAttributeValue>;

}

/**
 * Work item attribute configured for the project.
 * @since 2024.2
 */
export declare class WorkItemProjectAttribute extends BaseEntity {
  /**
   * Name of the attribute.
   */
  readonly name: string;

  /**
   * Possible values of the attribute in the project.
   * @since 2024.2
   */
  readonly values: Set<WorkItemAttributeValue>;

  /**
   * Searches for WorkItemProjectAttribute entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of WorkItemProjectAttribute entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<WorkItemProjectAttribute>;

  /**
   * Returns the attribute value with the given name or null if such value does not exist.
   * @since 2024.2
   * @param name Name of a work item value.
   * @returns The attribute value with the given name or null if such value does not exist.
   */
  findValueByName(name: string): WorkItemAttributeValue;

}

/**
 * Represents a work type that can be assigned to a work item.
 */
export declare class WorkItemType extends BaseEntity {
  /**
   * The name of the work item type.
   */
  readonly name: string;

  /**
   * Searches for WorkItemType entities with extension properties that match the specified query.
   * @since 2024.3.43260
   * @param extensionPropertiesQuery The extension properties query, defined as a set of key-value pairs representing properties and their corresponding values.
 * @example
 * {
 *    property1: "value1",
 *    property2: "value2"
 * }
   * @returns The set of WorkItemType entities that contain the specified extension properties.
   */
  static findByExtensionProperties(extensionPropertiesQuery: JSON): Set<WorkItemType>;

  /**
   * Returns the set of work item types that are available in a project.
   * @param project The project for which work item types are returned.
   * @returns The set of available work item types for the specified project.
   */
  static findByProject(project: Project): Set<WorkItemType>;

}

/**
 * @deprecated Use Tag instead.
 */
export declare class IssueTag extends WatchFolder {
  /**
   * @deprecated Use Tag.findByName instead.
   */
  static findByName(name: string): Set<Tag>;

  /**
   * @deprecated Use Tag.findTagByName instead.
   */
  static findTagByName(name: string): Tag;
}

/**
 * Global workflow utilities available in workflow scripts.
 */
declare global {
  /**
   * Global workflow object with utility functions.
   */
  const workflow: {
    /**
     * Get internationalized string by key.
     */
    i18n(key: string): string;

    /**
     * Log a message in workflow execution.
     */
    message(msg: string): void;

    /**
     * Assert a condition, throw error if false.
     */
    check(condition: any, message: string): void;
  };
}
