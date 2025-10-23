import React from "react";
import { DndContext, DragEndEvent, DragStartEvent, UniqueIdentifier } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Toggle from "@jetbrains/ring-ui-built/components/toggle/toggle";
import Button from "@jetbrains/ring-ui-built/components/button/button";
import Tooltip from "@jetbrains/ring-ui-built/components/tooltip/tooltip";
import Icon from "@jetbrains/ring-ui-built/components/icon/icon";
import classNames from "classnames";
import dragIcon from "@jetbrains/icons/drag";
import arrowUpIcon from "@jetbrains/icons/arrow-up";
import arrowDownIcon from "@jetbrains/icons/arrow-down";
import infoIcon from "@jetbrains/icons/info";
import copyToClipboard from "copy-to-clipboard";
import copyIcon from "@jetbrains/icons/copy";

import { PluggableObjectUsage } from "../../types";
import { GroupKey, SortKey, SortState, TableRowData, sortData } from "../model/tableModel";
import { useToast } from "./InlineToast";

const DRAG_COLUMN_WIDTH = "40px";
const INLINE_ACTIONS_COLUMN_WIDTH = "64px";
const PRIORITY_COLUMN_WIDTH = "120px";
const BASE_COLUMNS: [string, string] = [DRAG_COLUMN_WIDTH, "minmax(0, 1fr)"];
const COLUMNS_AFTER_RULE_WITH_PRIORITY = [PRIORITY_COLUMN_WIDTH, "90px", "120px", "110px", INLINE_ACTIONS_COLUMN_WIDTH];
const COLUMNS_AFTER_RULE = ["90px", "120px", "110px", INLINE_ACTIONS_COLUMN_WIDTH];

const getGridTemplate = (showPriority: boolean) => {
  const trailingColumns = showPriority ? COLUMNS_AFTER_RULE_WITH_PRIORITY : COLUMNS_AFTER_RULE;
  return [...BASE_COLUMNS, ...trailingColumns].join(" ");
};

const COPY_SUCCESS_TIMEOUT = 1000;
const COPY_FALLBACK_TIMEOUT = 1000;

const promptCopyFallback = (text: string) => {
  const fallback = document.createElement("textarea");
  fallback.value = text;
  fallback.readOnly = true;
  fallback.style.position = "absolute";
  fallback.style.left = "-9999px";
  document.body.appendChild(fallback);
  fallback.select();
  document.execCommand("copy");
  document.body.removeChild(fallback);
};

const getRuleSubtitle = (item: TableRowData) => item.ruleSubtitle;

const RuleTitleCell: React.FC<{
  rule: string;
  subtitle: string;
  appTitle: string;
  appName: string;
  onOpen: () => void;
  onCopyApp: (text: string, anchor: HTMLElement) => void;
  errors?: string[];
}> = ({rule, subtitle, appTitle, appName, onOpen, onCopyApp, errors}) => (
  <div className={classNames("rules-grid__cell", "ruleTitleColumn", {"ruleTitleColumn--error": errors && errors.length > 0})}>
    <div className="ruleTitle">
      {appTitle ? (
        <div className="ruleTitle__appName">
          <button
            type="button"
            className="ruleTitle__copy"
            aria-label={`Copy ${appTitle}`}
            onClick={(event) => onCopyApp(appName || appTitle, event.currentTarget)}
          >
            <Icon glyph={copyIcon} size={14} />
          </button>
          <span>{appTitle}</span>
        </div>
      ) : null}
      <div className="ruleTitle__primary">
        <button type="button" className="rule-link" onClick={onOpen}>
          {rule}
        </button>
      </div>
      <div className="table-line" title={subtitle}>{subtitle}</div>
      {errors && errors.length > 0 ? (
        <div className="ruleTitle__error" role="alert">
          {errors.map((error) => (
            <div key={error}>{error}</div>
          ))}
        </div>
      ) : null}
    </div>
  </div>
);

interface RuleRowActionHandlers {
  onRuleLinkClick: (item: TableRowData) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onMoveToTop?: (id: string) => void;
  onMoveToBottom?: (id: string) => void;
}

interface RuleCellsProps extends RuleRowActionHandlers {
  item: TableRowData;
  showPriority: boolean;
}

const renderTooltipContent = (reasons: string[]) => {
  if (reasons.length === 0) {
    return null;
  }

  return (
    <div>
      {reasons.map((reason) => (
        <div key={`reason-${reason}`}>{reason}</div>
      ))}
    </div>
  );
};

const ActiveCell: React.FC<{isActive: boolean; tooltip: React.ReactNode}> = ({isActive, tooltip}) => {
  let content: React.ReactNode = "No";

  if (isActive) {
    content = "Yes";
  } else if (tooltip) {
    content = (
      <Tooltip title={tooltip}>
        <span>No</span>
      </Tooltip>
    );
  }

  return <div className="rules-grid__cell activeColumn">{content}</div>;
};

const RuleCellsComponent: React.FC<RuleCellsProps> = ({
  item,
  showPriority,
  onRuleLinkClick,
  onToggleEnabled,
  onMoveToTop,
  onMoveToBottom,
}) => {
  const toast = useToast();
  const tooltipContent = renderTooltipContent(item.activeTooltip);

  const handleCopyApp = (text: string, anchor: HTMLElement) => {
    const success = copyToClipboard(text, {format: "text/plain"});
    if (success) {
      toast.show(`Copied “${text}”`, anchor, COPY_SUCCESS_TIMEOUT);
    } else {
      promptCopyFallback(text);
      toast.show("Copied via fallback", anchor, COPY_FALLBACK_TIMEOUT);
    }
  };

  const MOVE_ORDER_TOP_GLYPH = `<svg width="16" height="16" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" stroke="#000" transform="scale(1 -1)" stroke-width=".24"><path d="M256 56h240v32H256zm0 106.667h240v32H256zm0 106.666h240v32H256zM328 376h168v32H328z"/><path d="M161.231 408h5.969v68.783L302 393l-134.8-86.228V376h-5.965C98.8 376 48 311.4 48 232S98.8 88 161.231 88H216V56h-54.769C121.783 56 84.91 74.755 57.4 108.81 30.7 141.866 16 185.616 16 232s14.7 90.134 41.4 123.19C84.91 389.245 121.783 408 161.231 408Zm37.969-42.772 42.8 27.381-42.8 26.608Z"/></svg>`;

  const MOVE_ORDER_BOTTOM_GLYPH = '<svg width="16" height="16" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" stroke="#000" stroke-width=".24"><path d="M256 56h240v32H256zm0 106.667h240v32H256zm0 106.666h240v32H256zM328 376h168v32H328z"/><path d="M161.231 408h5.969v68.783L302 393l-134.8-86.228V376h-5.965C98.8 376 48 311.4 48 232S98.8 88 161.231 88H216V56h-54.769C121.783 56 84.91 74.755 57.4 108.81 30.7 141.866 16 185.616 16 232s14.7 90.134 41.4 123.19C84.91 389.245 121.783 408 161.231 408Zm37.969-42.772 42.8 27.381-42.8 26.608Z"/></svg>';

  const renderInlineActions = () => {
    if (!showPriority || !onMoveToTop || !onMoveToBottom) {
      return <div className="rules-grid__cell inlineActionsColumn" />;
    }

    return (
      <div className="rules-grid__cell inlineActionsColumn">
        <Button
          short
          title="Move to highest priority"
          aria-label={`Move ${item.rule} to highest priority`}
          onClick={() => onMoveToTop(item.id)}
          icon={MOVE_ORDER_TOP_GLYPH}
        />
        <Button
          short
          title="Move to lowest priority"
          aria-label={`Move ${item.rule} to lowest priority`}
          onClick={() => onMoveToBottom(item.id)}
          icon={MOVE_ORDER_BOTTOM_GLYPH}
        />
      </div>
    );
  };

  return (
    <>
      <RuleTitleCell
        rule={item.rule}
        subtitle={getRuleSubtitle(item)}
        appTitle={item.appTitle}
        appName={item.app}
        errors={item.errors}
        onOpen={() => onRuleLinkClick(item)}
        onCopyApp={handleCopyApp}
      />
      {showPriority ? (
        <div className="rules-grid__cell priorityColumn">{item.priority}</div>
      ) : null}
      <ActiveCell isActive={item.isActive} tooltip={tooltipContent} />
      <div className="rules-grid__cell autoAttachColumn">{item.autoAttach ? "Yes" : "No"}</div>
      <div className="rules-grid__cell enabledColumn">
        <Toggle
          checked={item.enabled}
          onChange={(event) => onToggleEnabled(item.id, event.target.checked)}
        />
      </div>
      {renderInlineActions()}
    </>
  );
};

const RuleCells = React.memo(RuleCellsComponent);
RuleCells.displayName = "RuleCells";

interface SortableRuleRowProps extends RuleCellsProps {
  dragEnabled: boolean;
}

const SortableRuleRowComponent: React.FC<SortableRuleRowProps> = (props) => {
  const { item, dragEnabled, showPriority } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !dragEnabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  const rowClassName = classNames("rules-table__row", {
    "disabled-row": item.isDisabled,
    "dragged-row": isDragging,
  });

  return (
    <div ref={setNodeRef} style={style} className={rowClassName}>
      <div className="rules-grid__row" style={{gridTemplateColumns: getGridTemplate(showPriority)}}>
        <div className="rules-grid__cell dragColumn">
          <span
            className={classNames("drag-handle", { "drag-handle--disabled": !dragEnabled })}
            {...(dragEnabled ? { ...attributes, ...listeners } : {})}
          >
            <Button
              icon={dragIcon}
              short
              title="Drag to reorder rule execution priority"
              disabled={!dragEnabled}
            />
          </span>
        </div>
        <RuleCells {...props} />
      </div>
    </div>
  );
};

const SortableRuleRow = React.memo(SortableRuleRowComponent);
SortableRuleRow.displayName = "SortableRuleRow";

const StaticRuleRowComponent: React.FC<RuleCellsProps> = (props) => {
  const { item } = props;

  const rowClassName = classNames("rules-table__row", {
    "disabled-row": item.isDisabled,
  });

  return (
    <div className={rowClassName}>
      <div className="rules-grid__row" style={{gridTemplateColumns: getGridTemplate(false)}}>
        <div className="rules-grid__cell dragColumn" />
        <RuleCells {...props} />
      </div>
    </div>
  );
};

const StaticRuleRow = React.memo(StaticRuleRowComponent);
StaticRuleRow.displayName = "StaticRuleRow";

const getSortIcon = (current: SortState[GroupKey], column: SortKey) => {
  if (current.key !== column) {
    return null;
  }
  return current.order === "asc" ? arrowUpIcon : arrowDownIcon;
};

const createActionHandlers = (
  showPriority: boolean,
  options: {
    onToggleEnabled: (id: string, enabled: boolean) => void;
    onMoveToTop: (ruleId: string) => void;
    onMoveToBottom: (ruleId: string) => void;
  },
): RuleRowActionHandlers => {
  const handlers: RuleRowActionHandlers = {
    onRuleLinkClick: (item) => {
      const url = `/admin/scripts/${item.appId}?scriptId=${item.pluggableObjectId}`;
      window.open(url, "_blank");
    },
    onToggleEnabled: options.onToggleEnabled,
  };

  if (showPriority) {
    handlers.onMoveToTop = (id) => options.onMoveToTop(id);
    handlers.onMoveToBottom = (id) => options.onMoveToBottom(id);
  }

  return handlers;
};

const renderSortButton = (
  groupName: GroupKey,
  column: SortKey,
  label: string,
  sortState: SortState,
  onSort: (group: GroupKey, key: SortKey) => void,
) => {
  const icon = getSortIcon(sortState[groupName], column);
  return (
    <button
      type="button"
      className="table-header-button"
      onClick={() => onSort(groupName, column)}
    >
      {label}
      {icon && <Icon glyph={icon} size={12} className="sort-icon" />}
    </button>
  );
};

const renderPriorityHeader = (
  groupName: GroupKey,
  sortState: SortState,
  onSort: (group: GroupKey, key: SortKey) => void,
) => (
  <div className="rules-grid__cell priorityColumn">
    <div className="priorityHeader">
      {renderSortButton(groupName, "priority", "Priority", sortState, onSort)}
      <Tooltip title="On-change rules are executed according to their priority. Higher priority rules are executed first.">
        <Button icon={infoIcon} short iconSize={14} title="Priority help" />
      </Tooltip>
    </div>
  </div>
);

const renderHeader = (
  groupName: GroupKey,
  showPriority: boolean,
  onSort: (group: GroupKey, key: SortKey) => void,
  sortState: SortState,
) => (
  <div className="rules-grid__header" style={{gridTemplateColumns: getGridTemplate(showPriority)}}>
    <div className="rules-grid__cell dragColumn" aria-label="Reorder" />
    <div className="rules-grid__cell ruleTitleColumn">
      {renderSortButton(groupName, "rule", "Rule", sortState, onSort)}
    </div>
    {showPriority && renderPriorityHeader(groupName, sortState, onSort)}
    <div className="rules-grid__cell activeColumn">
      {renderSortButton(groupName, "active", "Active", sortState, onSort)}
    </div>
    <div className="rules-grid__cell autoAttachColumn">
      {renderSortButton(groupName, "autoAttach", "Auto Attach", sortState, onSort)}
    </div>
    <div className="rules-grid__cell enabledColumn">
      {renderSortButton(groupName, "enabled", "Enabled", sortState, onSort)}
    </div>
    <div className="rules-grid__cell inlineActionsColumn header-actions" aria-hidden={!showPriority}>
      {showPriority ? (
        <span className="inline-actions-label">Order</span>
      ) : null}
    </div>
  </div>
);

export interface RulesTableProps {
  rules: PluggableObjectUsage[];
  rows: TableRowData[];
  groupName: GroupKey;
  sortState: SortState;
  activeDragId: UniqueIdentifier | null;
  disabled?: boolean;
  onSort: (group: GroupKey, key: SortKey) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onMoveToTop: (ruleId: string) => void;
  onMoveToBottom: (ruleId: string) => void;
}

export const RulesTable: React.FC<RulesTableProps> = ({
  rules,
  rows,
  groupName,
  sortState,
  activeDragId,
  disabled,
  onSort,
  onToggleEnabled,
  onDragStart,
  onDragEnd,
  onMoveToTop,
  onMoveToBottom,
}) => {
  if (rules.length === 0) {
    return null;
  }

  const showPriority = groupName === "on-change";
  const sortConfig = sortState[groupName];
  const sortedRows = sortData(rows, sortConfig);
  const handlers = createActionHandlers(showPriority, {
    onToggleEnabled,
    onMoveToTop,
    onMoveToBottom,
  });

  const content = showPriority ? (
    <SortableContext items={sortedRows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
      {sortedRows.map((row) => (
        <SortableRuleRow
          key={row.id}
          item={row}
          showPriority
          dragEnabled={!disabled}
          {...handlers}
        />
      ))}
    </SortableContext>
  ) : (
    sortedRows.map((row) => (
      <StaticRuleRow
        key={row.id}
        item={row}
        showPriority={false}
        {...handlers}
      />
    ))
  );

  const grid = (
    <div
      className={classNames("rules-grid", {
        "rules-grid--draggable": showPriority,
        "rules-grid--dragging": showPriority && !!activeDragId,
        "rules-grid--blocked": disabled,
      })}
    >
      {renderHeader(groupName, showPriority, onSort, sortState)}
      <div className="rules-grid__body">{content}</div>
    </div>
  );

  if (!showPriority) {
    return grid;
  }

  return (
    <div className="rules-table-wrapper">
      <DndContext
        modifiers={[restrictToVerticalAxis]}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        {grid}
      </DndContext>
    </div>
  );
};


