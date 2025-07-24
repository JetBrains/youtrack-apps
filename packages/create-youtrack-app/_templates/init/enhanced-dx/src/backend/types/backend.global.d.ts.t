---
to: "src/backend/types/backend.global.d.ts"
---
import {Project, Issue, User} from "@/api/youtrack-types";

declare global {
  type AppSettings = Record<string, unknown> & {
    // Add your app-specific settings here
    // Example:
    // someProject?: string | unknown;
    // someFieldName?: string;
    // customLinkType?: string;
  };

  type CtxPost<T = Record<string, unknown>, R = Record<string, unknown>> = {
    issue: Issue;
    request: {
      json: () => T;
    };
    response: {
      status?: number;
      json: (data: R) => void;
    };
    currentUser: User;
    project: Project;
    settings: AppSettings;
  };

  type CtxPut<T = Record<string, unknown>, R = Record<string, unknown>> = {
    issue: Issue;
    request: {
      json: () => T; // body payload
    };
    response: {
      status?: number;
      json: (data: R) => void;
    };
    currentUser: User;
    project: Project;
    settings: AppSettings;
  };

  type CtxGet<Q = Record<string, unknown>, R = Record<string, unknown>> = {
    issue: Issue;
    request: {
      query: Q;
      getParameter: (name: string) => string | undefined;
    };
    response: {
      status?: number;
      json: (data: R) => void;
    };
    currentUser: User;
    project: Project;
    settings: AppSettings;
  };

  type CtxDelete<Q = Record<string, unknown>, R = Record<string, unknown>> = {
    issue: Issue;
    request: {
      query: Q;
      getParameter: (name: string) => string | undefined;
    };
    response: {
      status?: number;
      json: (data: R) => void;
    };
    currentUser: User;
    project: Project;
    settings: AppSettings;
  };
}

//This is needed to make the file a module
export {};

