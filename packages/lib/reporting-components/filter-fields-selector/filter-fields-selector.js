import React, {useCallback, useEffect, useState} from 'react';
import PropTypes from 'prop-types';
import Select from '@jetbrains/ring-ui/components/select/select';
import Tooltip from '@jetbrains/ring-ui/components/tooltip/tooltip';
import classNames from 'classnames';
import List from '@jetbrains/ring-ui/components/list/list';
import {ChevronDownIcon} from '@jetbrains/ring-ui/components/icon';
import guid from 'mout/random/guid';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import './filter-fields-selector.scss';

const getEmptyOption = emptyText => ({
  key: '-1',
  label: emptyText || i18n('No value'),
  model: null
});

const capitalizeFirstLetter = str =>
  (str && (str.substring(0, 1).toUpperCase() + str.substring(1)));

const toSelectOption = filterField => {
  const getDescription = () => (
    filterField && filterField.customField &&
    filterField.customField.fieldType &&
    filterField.customField.fieldType.presentation
  ) || '';

  return filterField && {
    key: filterField.id,
    label: capitalizeFirstLetter(
      filterField.localizedName || filterField.presentation || filterField.name
    ),
    model: filterField,
    description: getDescription()
  };
};

const getFilterFieldsOptions = (filterFields, canBeEmpty, emptyText) => {
  const options = filterFields.map(toSelectOption);
  if (canBeEmpty) {
    options.unshift({
      rgItemType: List.ListProps.Type.MARGIN,
      key: guid()
    });
    options.unshift(getEmptyOption(emptyText));
  }
  return options;
};


const FilterFieldsSelector = ({
  projects, onChange, filterFieldsSource,
  selectedField, canBeEmpty, disabled,
  placeholder
}) => {

  if (disabled) {
    const presentation = selectedField
      ? selectedField.presentation
      : (placeholder || '');

    return (
      <span className="report-widget__disabled">
        {presentation}
        <ChevronDownIcon
          color={ChevronDownIcon.Color.GRAY}
          size={ChevronDownIcon.Size.Size12}
        />
      </span>
    );
  }

  const [selectedFieldIsValid, setSelectedFieldValidity] = useState(true);
  const [filterFields, setFilterFields] = useState([]);

  useEffect(() => {
    let isSubscribed = true;

    (async function load() {
      const newFilterFields = await filterFieldsSource(projects);
      const newFilterFieldsValidity = selectedField
        ? (newFilterFields || []).some(
          field => field.id === selectedField.id
        ) : true;

      if (isSubscribed) {
        setFilterFields(newFilterFields);
        setSelectedFieldValidity(newFilterFieldsValidity);
      }
    }());

    return () => {
      isSubscribed = false;
    };
  }, [projects, selectedField]);

  const changeFilterField = useCallback(
    selected => onChange((selected || {}).model),
    [onChange]
  );

  const filterFieldSelect = (
    <Select
      className={classNames({
        'filter-fields-selector': true,
        'filter-fields-selector_empty': !selectedField,
        'filter-fields-selector_error': !selectedFieldIsValid
      })}
      data={getFilterFieldsOptions(
        filterFields, canBeEmpty, placeholder
      )}
      disabled={disabled}
      selected={toSelectOption(selectedField)}
      loading={!filterFields.length}
      onSelect={changeFilterField}
      filter={true}
      label={placeholder || i18n('＋Add field')}
      type={Select.Type.INLINE}
      disableMoveOverflow={true}
      maxHeight={170}
    />
  );

  if (selectedFieldIsValid) {
    return filterFieldSelect;
  }

  return (
    <Tooltip
      title={
        i18n('This field does not exist in some of the selected projects')
      }
    >
      {filterFieldSelect}
    </Tooltip>
  );
};

FilterFieldsSelector.propTypes = {
  projects: PropTypes.array,
  onChange: PropTypes.func,
  filterFieldsSource: PropTypes.func.isRequired,
  selectedField: PropTypes.object,
  canBeEmpty: PropTypes.bool,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string
};

export default FilterFieldsSelector;
