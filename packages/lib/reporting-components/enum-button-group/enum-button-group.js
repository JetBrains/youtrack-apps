import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import ButtonGroup from '@jetbrains/ring-ui/components/button-group/button-group';
import Button from '@jetbrains/ring-ui/components/button/button';

const EnumButton = ({value, active, onSelect, disabled}) => {
  const onClick = useCallback(() => onSelect(value), [value]);

  return (
    <Button
      key={`scale-${value.id}`}
      active={active}
      onClick={onClick}
      disabled={disabled}
    >
      {value.label}
    </Button>
  );
};

EnumButton.propTypes = {
  value: PropTypes.object.isRequired,
  active: PropTypes.bool,
  onSelect: PropTypes.func,
  disabled: PropTypes.bool
};


const EnumButtonGroup = (
  {values, selected, onChange, disabled}
) => (
  <ButtonGroup>
    {
      values.map(value => (
        <EnumButton
          key={`scale-${value.id}`}
          active={((selected || {}).id === value.id)}
          value={value}
          onSelect={onChange}
          disabled={disabled}
        >
          {value.label}
        </EnumButton>
      ))
    }
  </ButtonGroup>
);

EnumButtonGroup.propTypes = {
  values: PropTypes.array.isRequired,
  selected: PropTypes.object,
  disabled: PropTypes.bool,
  onChange: PropTypes.func
};

export default EnumButtonGroup;
