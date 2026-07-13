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
 * String utility functions for workflows.
 * @module @jetbrains/youtrack-scripting-api/strings
 */

/**
 * Returns the Levenshtein distance between two strings.
 */
export function getLevenshteinDistance(str1: string, str2: string): number;

/**
 * Calculates the MD5 digest of a string and returns it as a 32-character hex string.
 *
 * @since 2022.1
 */
export function md5(str: string): string;
