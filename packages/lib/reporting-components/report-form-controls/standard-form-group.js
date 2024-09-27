import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import '../report-widget/report-widget.scss';

const StandardFormGroup = ({
  label, children, noIndentation, inputCompensationHack
}) => (
  <div className={classNames({
    'ring-form__group': !noIndentation && !inputCompensationHack
  })}
  >
    {
      !!label &&
      <div className={classNames('ring-form__label', {
        'report-widget__input-label-compensation-hack': inputCompensationHack
      })}
      >
        {label}
      </div>
    }
    {
      !!children &&
      <div className="ring-form__control">
        {children}
      </div>
    }
  </div>
);

StandardFormGroup.propTypes = {
  label: PropTypes.string,
  children: PropTypes.node,
  noIndentation: PropTypes.bool,
  inputCompensationHack: PropTypes.bool
};

export default StandardFormGroup;
