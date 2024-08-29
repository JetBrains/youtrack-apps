import React, {memo, useState} from 'react';
import type {FC} from 'react';
import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import ButtonSet from '@jetbrains/ring-ui-built/components/button-set/button-set';
import Input, {Size} from '@jetbrains/ring-ui-built/components/input/input';

import API from '../api';

const host = await YTApp.register();
const api = new API(host);

const user = await api.getUser();

// eslint-disable-next-line complexity
const AppComponent: FC = () => {
  const [liked, setLiked] = useState(user.liked);
  const [leftMessage, setLeftMessage] = useState(user.leftMessage);
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const onLike = async () => {
    if (!user.isGuest) {
      await api.postLike();
    }
    setLiked(true);
  };

  const onDislike = async () => {
    setLiked(false);
  };

  const onSend = async () => {
    if (user.isGuest) {
      await api.postGuestDislike(message, userName, userEmail);
    } else {
      await api.postDislike(message);
    }
    setLeftMessage(true);
  };

  const onMessageChange = async (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setMessage(event.target.value);
  };

  const onUserNameChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUserName(event.target.value);
  };

  const onUserEmailChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUserEmail(event.target.value);
  };

  return (
    <ControlsHeightContext.Provider value={ControlsHeight.S}>
      <div className="widget">
        {liked === undefined && (
          <>
            <div>{'Was this article helpful?'}</div>
            <ButtonSet>
              <Button onClick={onLike}>{'Yes'}</Button>
              <Button onClick={onDislike}>{'No'}</Button>
            </ButtonSet>
          </>
        )}

        {(liked === true || leftMessage) && (
          <div>{'Thanks for your feedback!'}</div>
        )}

        {liked === false && !leftMessage && (
          <>
            <div>{'How can we improve?'}</div>

            {user.isGuest && (
              <>
                <Input
                  label={'Name'}
                  value={userName}
                  onChange={onUserNameChange}
                />

                <Input
                  label={'Email'}
                  value={userEmail}
                  onChange={onUserEmailChange}
                />
              </>
            )}

            <Input
              multiline
              value={message}
              onChange={onMessageChange}
              size={Size.L}
              className="message"
              placeholder={'Tell us what you think would make this article better'}
            />

            <ButtonSet>
              <Button
                disabled={!message || (user.isGuest && !userName)}
                onClick={onSend}
              >
                {'Send'}
              </Button>
            </ButtonSet>
          </>
        )}
      </div>
    </ControlsHeightContext.Provider>
  );
};

export const App = memo(AppComponent);
