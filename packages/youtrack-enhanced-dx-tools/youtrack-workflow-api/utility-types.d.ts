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
 * Shared utility types for YouTrack scripting API.
 * @module @jetbrains/youtrack-scripting-api/utility-types
 */

/**
 * Makes all properties of T deeply readonly.
 */
export type DeepReadonly<T> = T extends (infer U)[]
  ? DeepReadonlyArray<U>
  : T extends object
    ? DeepReadonlyObject<T>
    : T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

type DeepReadonlyObject<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>;
};

/**
 * Utility type for better IntelliSense display.
 * Flattens intersection types into a single object type.
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Extract keys that are required in type T.
 */
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * Extract keys that are optional in type T.
 */
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

/**
 * Make specified keys K required in type T.
 */
export type RequireKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Make specified keys K optional in type T.
 */
export type OptionalizeKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * JSON Schema type definition (simplified).
 * Used for AI tool input/output schemas and settings validation.
 */
export interface JSONSchema {
  $schema?: string;
  $ref?: string;
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';
  title?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  const?: unknown;

  // String validation
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;

  // Number validation
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;

  // Object validation
  properties?: Record<string, JSONSchema>;
  required?: string[];
  additionalProperties?: boolean | JSONSchema;
  patternProperties?: Record<string, JSONSchema>;
  minProperties?: number;
  maxProperties?: number;

  // Array validation
  items?: JSONSchema | JSONSchema[];
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  contains?: JSONSchema;

  // Combining schemas
  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  not?: JSONSchema;
  if?: JSONSchema;
  then?: JSONSchema;
  else?: JSONSchema;

  // YouTrack-specific extensions
  'x-scope'?: 'global' | 'project';
  'x-entity'?: string;
}

/**
 * Extract TypeScript type from JSON Schema type string.
 */
export type JSONSchemaTypeMap = {
  string: string;
  number: number;
  integer: number;
  boolean: boolean;
  object: Record<string, unknown>;
  array: unknown[];
  null: null;
};

/**
 * Nullable type wrapper.
 */
export type Nullable<T> = T | null;

/**
 * Make all properties of T nullable.
 */
export type NullableProps<T> = {
  [K in keyof T]: T[K] | null;
};

/**
 * Record type with string keys and value type V.
 */
export type StringRecord<V> = Record<string, V>;

/**
 * Union type of all values in an object type T.
 */
export type ValueOf<T> = T[keyof T];

/**
 * Extract the element type from an array or Set type.
 */
export type ElementType<T> = T extends (infer E)[]
  ? E
  : T extends Set<infer E>
    ? E
    : never;
