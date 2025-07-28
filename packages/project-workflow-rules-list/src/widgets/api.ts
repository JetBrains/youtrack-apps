import {HostAPI} from "../../@types/globals";
import { PluggableObjectUsage } from "./types.ts";

export class API {
  constructor(private host: HostAPI) {}

  getWorkflowRules(): Promise<PluggableObjectUsage[]> {
    const fields = 'id,enabled,priority,isBroken,' +
      'pluggableObject(id,name,title,typeAlias),' +
      'configuration(isActive,enabled,missingRequiredSettings,' +
      'app(id,name,title,icon,globalConfig(enabled,missingRequiredSettings)))';
    const projectId = YTApp.entity?.id;
    return this.host.fetchYouTrack<PluggableObjectUsage[]>(
      `admin/projects/${projectId}/pluggableObjectUsages`,
      {
        query: { fields }
      }
    );
  }

  updateWorkflowRuleEnabled(ruleId: string, enabled: boolean): Promise<void> {
    const projectId = YTApp.entity?.id;
    return this.host.fetchYouTrack(
      `admin/projects/${projectId}/pluggableObjectUsages/${ruleId}`,
      {
        method: "POST",
        body: { enabled }
      }
    );
  }

  updateWorkflowRulePriority(ruleId: string, priority: number): Promise<void> {
    const projectId = YTApp.entity?.id;
    return this.host.fetchYouTrack(
      `admin/projects/${projectId}/pluggableObjectUsages/${ruleId}`,
      {
        method: "POST",
        body: { priority }
      }
    );
  }

  updateWorkflowRulePriorityBulk(updates: Array<{id: string, priority: number}>): Promise<void> {
    const projectId = YTApp.entity?.id;
    return this.host.fetchYouTrack(
      `admin/projects/${projectId}/pluggableObjectUsages`,
      {
        method: "PUT",
        body: updates
      }
    );
  }
}
