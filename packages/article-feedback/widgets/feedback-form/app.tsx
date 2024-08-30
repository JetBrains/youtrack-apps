import React, {memo, useState} from 'react';
import type {FC} from 'react';

import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import ButtonSet from '@jetbrains/ring-ui-built/components/button-set/button-set';
import Input, {Size} from '@jetbrains/ring-ui-built/components/input/input';
import Link from '@jetbrains/ring-ui-built/components/link/link';

import API from '../api';

const host = await YTApp.register();
const api = new API(host);

const user = await api.getUser();

// eslint-disable-next-line complexity
const AppComponent: FC = () => {
  const [liked, setLiked] = useState<boolean | undefined>();
  const [leftMessage, setLeftMessage] = useState(user.leftMessage);
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const isDisabled = React.useMemo(() => {
    return !message.trim() || (user.isGuest && !userName);
  }, [message, userName]);

  const onLike = async () => {
    if (!user.isGuest) {
      await api.postLike();
    }
    setLiked(true);
  };

  const onDislike = async () => {
    setLiked(false);
  };

  const onChangeMyMind = async () => {
    setLiked(undefined);
    setLeftMessage(false);
    setMessage('');
    setUserName('');
    setUserEmail('');
  };

  const onSend = async () => {
    if (isDisabled) {
      return;
    }

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
      <form className="widget" onSubmit={onSend}>
        {liked === undefined && (
          <>
            <div data-test="feedback-question">{'Was this article helpful?'}</div>
            <ButtonSet>
              <Button onClick={onLike} data-test="yes-button">{'Yes'}</Button>
              <Button onClick={onDislike} data-test="no-button">{'No'}</Button>
            </ButtonSet>
          </>
        )}

        {(liked === true || leftMessage) && (
          <>
            <div>{'Thanks for your feedback!'}</div>
            <Link onClick={onChangeMyMind}>{'I changed my mind'}</Link>
          </>
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
                disabled={isDisabled}
                onClick={onSend}
                data-test="send-button"
              >
                {'Send'}
              </Button>
            </ButtonSet>
          </>
        )}
      </form>
    </ControlsHeightContext.Provider>
  );
};

export const App = memo(AppComponent);
