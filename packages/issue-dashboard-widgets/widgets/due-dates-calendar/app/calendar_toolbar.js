import React from 'react';
import Button from '@jetbrains/ring-ui/components/button/button';
import ButtonGroup from '@jetbrains/ring-ui/components/button-group/button-group';
import Text from '@jetbrains/ring-ui/components/text/text';
import {i18n} from 'hub-dashboard-addons/dist/localization';
import Toolbar from 'react-big-calendar/lib/Toolbar';


class CalendarToolbar extends Toolbar {

  navigatePrevious = () => this.navigate('PREV');
  navigateNext = () => this.navigate('NEXT');
  navigateToday = () => this.navigate('TODAY');

  setDayView = () => this.view('day');
  setWeekView = () => this.view('week');
  setMonthView = () => this.view('month');

  render() {
    const selectedView = this.props.view;
    return (
      <div>
        <div className="custom-toolbar-navigate">
          <div className="navigation-block">
            <Button
              className="nav-button"
              onClick={this.navigatePrevious}
            >{'←'}</Button>
            <Button
              className="nav-button"
              onClick={this.navigateToday}
            >{i18n('Today')}</Button>
            <Button
              className="nav-button"
              onClick={this.navigateNext}
            >{'→'}</Button>
          </div>
          <div className="selection-title"><Text className="selection-title-text">{this.props.label}</Text></div>
          <div className="rbc-btn-group">
            <ButtonGroup>
              <Button
                active={selectedView === 'day'}
                onClick={this.setDayView}
              >{i18n('Day')}</Button>
              <Button
                active={selectedView === 'week'}
                onClick={this.setWeekView}
              >{i18n('Week')}</Button>
              <Button active={selectedView === 'month'} onClick={this.setMonthView}>{i18n('Month')}</Button>
            </ButtonGroup>
          </div>
        </div>
      </div>
    );
  }
}

export default CalendarToolbar;
