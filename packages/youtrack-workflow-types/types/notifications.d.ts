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
 * Functions for sending email messages from workflows.
 * @module @jetbrains/youtrack-scripting-api/notifications
 */

import type { Issue } from './workflowTypeScriptStubs.js';

export interface EmailMessage {
  /**
   * The visible name of the sender.
   */
  fromName?: string;

  /**
   * Recipient email addresses.
   */
  to?: string | string[];

  /**
   * Email copy recipient addresses.
   */
  cc?: string | string[];

  /**
   * Blind carbon copy recipient addresses.
   */
  bcc?: string | string[];

  /**
   * Backward-compatible recipient email addresses.
   */
  toEmails?: string | string[];

  /**
   * The email message subject.
   */
  subject?: string;

  /**
   * The email message body.
   */
  body?: string;

  /**
   * Custom email headers.
   */
  headers?: Record<string, string | number | boolean>;
}

/**
 * Sends an email message to one or more email addresses.
 */
export function sendEmail(message: EmailMessage, issue?: Issue): void;
