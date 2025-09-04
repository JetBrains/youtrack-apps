import React from 'react';
import PropTypes from 'prop-types';

import styles from './empty-widget.module.css';

const EmptyWidgetFaces = {
  ERROR: '{{ (>_<) }}',
  JOY: '(⌒‿⌒)',
  HAPPY: '＼(＾▽＾)／',
  OK: '(・_・)',
};

const EmptyWidget = ({face, message, children}) => (
  <div className={styles.empty} data-test="empty-widget">
    {
      face && (
        <div className={styles.face} data-test="empty-widget-face">
          {face}
        </div>
      )}
    {
      message && (
        <div className={styles.message} data-test="empty-widget-message">
          {message}
        </div>
      )}
    {
      children && (
        <div className={styles.additionalContent}>
          {children}
        </div>
      )}
  </div>
);

EmptyWidget.propTypes = {
  face: PropTypes.string,
  message: PropTypes.string,
  children: PropTypes.node
};


export {EmptyWidgetFaces};
export default EmptyWidget;
