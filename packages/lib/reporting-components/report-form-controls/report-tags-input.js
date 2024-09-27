import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import {RerenderableTagsInput} from '@jetbrains/ring-ui/components/tags-input/tags-input';


const ReportTagsInput = ({
  options, optionToTag, onChange, ...restProps
}) => {

  const onAddOption = useCallback(({tag}) => {
    if (tag && tag.model) {
      onChange((options || []).concat([tag.model]));
    }
  }, [options]);

  const onRemoveOption = useCallback(({tag}) => {
    if (tag && tag.model) {
      onChange(
        (options || []).filter(option => option.id !== tag.model.id)
      );
    }
  }, [options]);

  return (
    <RerenderableTagsInput
      className="ring-form__group"
      tags={(options || []).map(optionToTag)}
      onAddTag={onAddOption}
      onRemoveTag={onRemoveOption}
      {...restProps}
    />
  );
};

ReportTagsInput.propTypes = {
  options: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  optionToTag: PropTypes.func.isRequired
};

export default ReportTagsInput;
