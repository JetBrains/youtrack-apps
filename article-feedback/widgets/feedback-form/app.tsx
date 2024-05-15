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

const AppComponent: FC = () => {
  const [liked, setLiked] = useState(user.liked);
  const [leftMessage, setLeftMessage] = useState(user.leftMessage);
  const [message, setMessage] = useState('');

  const onLike = async () => {
    await host.fetchApp('backend/like', {scope: true, method: 'post'});
    setLiked(true);
  };

  const onDislike = async () => {
    await host.fetchApp('backend/dislike', {scope: true, method: 'post'});
    setLiked(false);
  };

  const onSend = async () => {
    await host.fetchApp('backend/feedback', {scope: true, method: 'post', query: {message}});
    setLeftMessage(true);
  };

  const onMessageChange = async (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setMessage(event.target.value);
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
            <Input
              multiline
              value={message}
              onChange={onMessageChange}
              size={Size.L}
              className="message"
            />
            <ButtonSet>
              <Button disabled={!message} onClick={onSend}>
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
