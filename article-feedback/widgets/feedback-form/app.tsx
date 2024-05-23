import React, {memo, useState} from 'react';
import type {FC} from 'react';
import {ControlsHeightContext, ControlsHeight} from '@jetbrains/ring-ui-built/components/global/controls-height';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import ButtonSet from '@jetbrains/ring-ui-built/components/button-set/button-set';
import Input, {Size} from '@jetbrains/ring-ui-built/components/input/input';

const host = await YTApp.register();

const debug = await host.fetchApp('backend/debug', {scope: true});
console.log('debug', debug);

const user = (await host.fetchApp('backend/user', {scope: true})) as {
  isGuest: boolean;
  liked?: boolean;
  leftMessage?: boolean;
};
console.log('user', user);

// eslint-disable-next-line complexity
const AppComponent: FC = () => {
  const [liked, setLiked] = useState(user.liked);
  const [leftMessage, setLeftMessage] = useState(user.leftMessage);
  const [message, setMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const onLike = async () => {
    if (!user.isGuest) {
      await host.fetchApp('backend/like', {scope: true, method: 'post'});
    }
    setLiked(true);
  };

  const onDislike = async () => {
    if (!user.isGuest) {
      await host.fetchApp('backend/dislike', {scope: true, method: 'post'});
    }
    setLiked(false);
  };

  const onSend = async () => {
    if (user.isGuest) {
      await host.fetchApp(
        'backend/guest-feedback',
        {scope: true, method: 'post', query: {message, userName, userEmail}}
      );
    } else {
      await host.fetchApp('backend/feedback', {scope: true, method: 'post', query: {message}});
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
