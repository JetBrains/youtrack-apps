import React from "react";
import classNames from "classnames";
import Tooltip from "@jetbrains/ring-ui-built/components/tooltip/tooltip";
import Icon from "@jetbrains/ring-ui-built/components/icon/icon";
import infoIcon from "@jetbrains/icons/info";

import { PresetFilter } from "../model/presets";

interface FilterBarProps {
  filterQuery: string;
  onFilterChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  helpContent: React.ReactNode;
  presets: PresetFilter[];
  activePresetId: string | null;
  onPresetToggle: (preset: PresetFilter) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterQuery,
  onFilterChange,
  helpContent,
  presets,
  activePresetId,
  onPresetToggle,
}) => (
  <div className="filter-bar">
    <div className="filter-bar__row">
      <label className="filter-bar__label" htmlFor="workflow-rules-filter">
        Filter
      </label>
      <div className="filter-bar__input-wrapper">
        <input
          id="workflow-rules-filter"
          className="filter-bar__input"
          type="text"
          placeholder="Filter rules by name or attribute, like &quot;group: action&quot; or &quot;autoAttach: true&quot;"
          value={filterQuery}
          onChange={onFilterChange}
        />
        <Tooltip title={helpContent}>
          <button
            type="button"
            className="filter-bar__help-button"
            aria-label="Filter syntax help"
          >
            <Icon glyph={infoIcon} size={16} />
          </button>
        </Tooltip>
      </div>
    </div>
    <div className="filter-bar__presets" role="group" aria-label="Predefined filters">
      {presets.map((preset) => {
        const isActive = activePresetId === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            className={classNames("filter-toggle", { "filter-toggle--active": isActive })}
            onClick={() => onPresetToggle(preset)}
            aria-pressed={isActive}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  </div>
);

FilterBar.displayName = "FilterBar";


