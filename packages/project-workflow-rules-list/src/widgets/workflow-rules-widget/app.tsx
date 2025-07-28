import React, { memo, useEffect, useState } from "react";
import Table from "@jetbrains/ring-ui-built/components/table/table";
import Selection from "@jetbrains/ring-ui-built/components/table/selection";
import { Column } from "@jetbrains/ring-ui-built/components/table/header-cell";
import Toggle from "@jetbrains/ring-ui-built/components/toggle/toggle";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import Tooltip from "@jetbrains/ring-ui-built/components/tooltip/tooltip";
import DropdownMenu from "@jetbrains/ring-ui-built/components/dropdown-menu/dropdown-menu";
import moveToTopIcon from "@jetbrains/icons/move-to-top";
import moreOptionsIcon from "@jetbrains/icons/more-options";
import settingsIcon from "@jetbrains/icons/settings";
import pencilIcon from "@jetbrains/icons/pencil";
import infoIcon from "@jetbrains/icons/info";
import {API} from "../api.ts";
import { PluggableObjectUsage } from "../types.ts";

const host = await YTApp.register();
const api = new API(host);

interface TableRowData {
  id: string;
  rule: string;
  ruleSubtitle: string;
  app: string;
  isDisabled: boolean;
  isActive: boolean;
  enabled: boolean;
  isBroken: boolean;
  configEnabled: boolean;
  configMissingRequiredSettings: boolean;
  globalConfigEnabled: boolean;
  globalConfigMissingRequiredSettings: boolean;
  activeTooltip: string[];
  priority: number;
  appId: string;
  pluggableObjectId: string;
}

const getGroupTitle = (groupName: string): string => {
  const titles: Record<string, string> = {
    'on-change': 'On-Change Rules',
    'on-schedule': 'On-Schedule Rules',
    'statemachine': 'State Machine Rules',
    'action': 'Action Rules'
  };
  return titles[groupName] || groupName;
};

const AppComponent: React.FunctionComponent = () => {
  const [workflowRules, setWorkflowRules] = useState<PluggableObjectUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rules = await api.getWorkflowRules();
        setWorkflowRules(rules);
      } catch {
        // Handle error silently or show user-friendly message
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const groupedRules = {
    'on-change': workflowRules
      .filter(rule => rule.pluggableObject.typeAlias === 'on-change')
      .sort((a, b) => b.priority - a.priority), // Sort descending by priority
    'on-schedule': workflowRules.filter(rule => rule.pluggableObject.typeAlias === 'on-schedule'),
    'action': workflowRules.filter(rule => rule.pluggableObject.typeAlias === 'action'),
    'statemachine': workflowRules.filter(rule => rule.pluggableObject.typeAlias === 'statemachine')
  };

  const handleToggleEnabled = async (ruleId: string, enabled: boolean) => {
    try {
      await api.updateWorkflowRuleEnabled(ruleId, enabled);
      // Refresh data after update
      const rules = await api.getWorkflowRules();
      setWorkflowRules(rules);
    } catch {
      // Handle error silently or show user-friendly message
    }
  };


  const handleReorder = async (params: { data: TableRowData[], oldIndex: number, newIndex: number }) => {
    try {
      // Calculate new priorities based on position
      // Higher position = higher priority (descending order)
      const updates = params.data.map((item, index) => ({
        id: item.id,
        priority: params.data.length - index // Higher index gets lower priority
      }));

      await api.updateWorkflowRulePriorityBulk(updates);

      // Refresh data after update
      const rules = await api.getWorkflowRules();
      setWorkflowRules(rules);
    } catch {
      // Handle error silently or show user-friendly message
    }
  };

  const handleMoveToTop = async (ruleId: string, rules: PluggableObjectUsage[]) => {
    try {
      // Find the highest priority in the current rules
      const maxPriority = Math.max(...rules.map(rule => rule.priority));

      // Set the selected rule's priority to be higher than the current max
      const updates = [{
        id: ruleId,
        priority: maxPriority + 1
      }];

      await api.updateWorkflowRulePriorityBulk(updates);

      // Refresh data after update
      const updatedRules = await api.getWorkflowRules();
      setWorkflowRules(updatedRules);
    } catch {
      // Handle error silently or show user-friendly message
    }
  };

  // Helper function to calculate active status
  const calculateActiveStatus = (rule: PluggableObjectUsage) => {
    const enabled = rule.enabled;
    const notIsBroken = !rule.isBroken;
    const configEnabled = rule.configuration.enabled;
    const notConfigMissingRequiredSettings = !rule.configuration.missingRequiredSettings;
    const globalConfigEnabled = rule.configuration.app.globalConfig.enabled;
    const notGlobalConfigMissingRequiredSettings = !rule.configuration.app.globalConfig.missingRequiredSettings;

    // Rule is active only if all conditions are true
    const isActive = enabled && 
                     notIsBroken && 
                     configEnabled && 
                     notConfigMissingRequiredSettings && 
                     globalConfigEnabled && 
                     notGlobalConfigMissingRequiredSettings;

    return {
      isActive,
      enabled,
      notIsBroken,
      configEnabled,
      notConfigMissingRequiredSettings,
      globalConfigEnabled,
      notGlobalConfigMissingRequiredSettings
    };
  };

  // Helper function to collect reasons for inactive status
  const collectInactiveReasons = (status: ReturnType<typeof calculateActiveStatus>) => {
    const reasons = [];
    if (!status.enabled) {
      reasons.push('Rule is disabled');
    }
    if (!status.notIsBroken) {
      reasons.push('Rule requirements are not met');
    }
    if (!status.configEnabled) {
      reasons.push('App is disabled in Project App Settings');
    }
    if (!status.notConfigMissingRequiredSettings) {
      reasons.push('Missing required settings in Project App Settings');
    }
    return reasons;
  };

  // Helper function to collect global config reasons for inactive status
  const collectGlobalConfigReasons = (status: ReturnType<typeof calculateActiveStatus>) => {
    const reasons = [];
    if (!status.globalConfigEnabled) {
      reasons.push('App is disabled in App Settings');
    }
    if (!status.notGlobalConfigMissingRequiredSettings) {
      reasons.push('Missing required App Settings');
    }
    return reasons;
  };

  // Helper function to generate tooltip for inactive rules
  const generateActiveTooltip = (status: ReturnType<typeof calculateActiveStatus>) => {
    if (status.isActive) {
      return [];
    }

    const reasons = [
      ...collectInactiveReasons(status),
      ...collectGlobalConfigReasons(status)
    ];

    return reasons;
  };

  const renderTable = (rules: PluggableObjectUsage[], groupName: string) => {
    const data: TableRowData[] = rules.map(rule => {
      const activeStatus = calculateActiveStatus(rule);
      const activeTooltip = generateActiveTooltip(activeStatus);
      const isDisabled = !rule.enabled || !activeStatus.isActive;
      return {
        id: rule.id,
        rule: rule.pluggableObject.title,
        ruleSubtitle: `${rule.configuration.app.name}/${rule.pluggableObject.name}`,
        app: rule.configuration.app.title,
        isDisabled: isDisabled,
        isActive: activeStatus.isActive,
        enabled: rule.enabled,
        isBroken: rule.isBroken,
        configEnabled: rule.configuration.enabled,
        configMissingRequiredSettings: rule.configuration.missingRequiredSettings,
        globalConfigEnabled: rule.configuration.app.globalConfig.enabled,
        globalConfigMissingRequiredSettings: rule.configuration.app.globalConfig.missingRequiredSettings,
        activeTooltip: activeTooltip,
        priority: rule.priority,
        appId: rule.configuration.app.id,
        pluggableObjectId: rule.pluggableObject.id
      };
    });

    const handleEditClick = (item: TableRowData) => {
      const url = `/admin/scripts/${item.appId}?scriptId=${item.pluggableObjectId}`;
      window.open(url, '_blank');
    };

    const handleViewClick = (item: TableRowData) => {
      const url = `/admin/workflows?selected=${item.appId}`;
      window.open(url, '_blank');
    };

    const handleAppSettingsClick = (item: TableRowData) => {
      const url = `/admin/apps?selected=${item.appId}&appTab=settings`;
      window.open(url, '_blank');
    };

    const handleProjectWorkflowSettingsClick = (item: TableRowData) => {
      const projectId = YTApp.entity?.id;
      const url = `/projects/${projectId}?selected=${item.appId}&tab=workflow`;
      window.open(url, '_blank');
    };

    const handleProjectAppSettingsClick = (item: TableRowData) => {
      const projectId = YTApp.entity?.id;
      const url = `/projects/${projectId}?selected=${item.appId}&tab=apps&appTab=settings`;
      window.open(url, '_blank');
    };

    const columns: Column<TableRowData>[] = [
      {
        id: 'rule',
        title: 'Rule',
        className: 'ruleTitleColumn',
        headerClassName: 'ruleTitleColumn',
        getValue: (item: TableRowData) => (
          <div>
            <div>{item.rule}</div>
            <div className={"table-line"}>
              {item.ruleSubtitle}
            </div>
          </div>
        )
      }
    ];

    // Add Priority column after App for on-change group
    if (groupName === 'on-change') {
      columns.push({
        id: 'priority',
        title: (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span>Priority</span>
            <Tooltip title="On-change rules are executed according to their priority. Higher priority rules are executed first.">
              <Button
                icon={infoIcon}
                short
                iconSize={14}
              />
            </Tooltip>
          </div>
        ),
        getValue: (item: TableRowData) => item.priority
      });
    }

    // Add remaining columns
    columns.push(
      {
        id: 'app',
        title: 'App',
        className: 'appTitleColumn',
        headerClassName: 'appTitleColumn',
        getValue: (item: TableRowData) => item.app
      },
      {
        id: 'active',
        title: 'Active',
        getValue: (item: TableRowData) => {
          if (item.isActive) {
            return 'Yes';
          } else {
            return (
              <Tooltip
                title={(
                  <>
                    {item.activeTooltip.map((reason) => (
                      <div key={`reason-${reason}`}>{reason}</div>
                    ))}
                  </>
                )}
              >
                <span>No</span>
              </Tooltip>
            );
          }
        }
      },
      {
        id: 'enabled',
        title: 'Enabled',
        getValue: (item: TableRowData) => (
          <Toggle
            checked={item.enabled}
            onChange={(event) => handleToggleEnabled(item.id, event.target.checked)}
          />
        )
      },
      {
        id: 'actions',
        title: '',
        className: 'actionsColumn',
        headerClassName: 'actionsColumn',
        getValue: (item: TableRowData) => (
          <DropdownMenu
            anchor={(
              <Button
                title="Actions"
                short
                icon={moreOptionsIcon}
              />
            )}
            data={[
              ...(groupName === 'on-change' ? [{
                label: 'Move to highest priority',
                glyph: moveToTopIcon,
                onClick: () => handleMoveToTop(item.id, rules)
              }] : []),
              {
                label: 'Open in JS editor',
                glyph: pencilIcon,
                onClick: () => handleEditClick(item)
              },
              {
                label: 'Workflow settings',
                glyph: settingsIcon,
                onClick: () => handleViewClick(item)
              },
              {
                label: 'App settings',
                glyph: settingsIcon,
                onClick: () => handleAppSettingsClick(item)
              },
              {
                label: 'Project workflow settings',
                glyph: settingsIcon,
                onClick: () => handleProjectWorkflowSettingsClick(item)
              },
              {
                label: 'Project app settings',
                glyph: settingsIcon,
                onClick: () => handleProjectAppSettingsClick(item)
              }
            ]}
          />
        )
      }
    );

    const selection = new Selection({
      data: data,
      getKey: (item: TableRowData) => item.id
    });

    const getRowClassName = (item: TableRowData) => {
      return item.isDisabled ? 'disabled-row' : '';
    };

    // Only make on-change table draggable
    const isOnChangeTable = groupName === 'on-change';

    return (
      <Table
        caption={getGroupTitle(groupName)}
        data={data}
        columns={columns}
        selection={selection}
        selectable={false}
        getItemKey={(item: TableRowData) => item.id}
        getItemLevel={() => 0}
        isItemCollapsed={() => false}
        onItemCollapse={() => {}}
        getItemClassName={getRowClassName}
        dragHandleTitle={isOnChangeTable ? 'Drag to reorder rule execution priority' : undefined}
        draggable={isOnChangeTable}
        onReorder={isOnChangeTable ? handleReorder : undefined}
        sortKey={isOnChangeTable ? 'priority' : undefined}
        className="rules-table"
      />
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="widget">
      {Object.entries(groupedRules).map(([groupName, rules]) => (
        rules.length > 0 && (
          <div key={groupName}>
            {renderTable(rules, groupName)}
          </div>
        )
      ))}
    </div>
  );
};

export const App = memo(AppComponent);
