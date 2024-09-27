import React from 'react';
import classNames from 'classnames';

import Link from '@jetbrains/ring-ui/components/link/link';
import {i18n} from 'hub-dashboard-addons/dist/localization';

import ContentDefaultActivity from './content-default-activity';
import './style/activities-widget.css';
import filter from './activities-filter';

const previewWhiteList = [
  'image/gif',
  'image/png',
  'image/jpeg',
  'image/x-icon',
  'image/bmp',
  'image/x-windows-bmp',
  'image/tiff',
  'image/x-tiff',
  'image/webp'
];


class ContentAttachmentActivity extends ContentDefaultActivity {

  renderAttachmentStub(activity, attachment, removed) {
    const uniqueKey = `${activity.id}${attachment.id}`;
    const stubClass = 'aw__activity__attachment__header__stub';
    const modClass = removed && 'aw__activity__attachment__header__stub_removed';
    return (
      <span className={classNames(stubClass, modClass)} key={uniqueKey}>
        {attachment.name}
      </span>
    );
  }

  renderAttachmentThumbnail(activity, attachment) {
    const uniqueKey = `${activity.id}${attachment.id}`;

    const trimAttachmentsContext = url => {
      const attachmentsPrefix = 'api/files';
      return attachmentsPrefix + (url || '').split(attachmentsPrefix).pop();
    };

    const attachmentHref = `${filter.youTrackUrl}${trimAttachmentsContext(attachment.url)}`;
    const hasPreview = previewWhiteList.indexOf(attachment.mimeType);

    if (hasPreview >= 0) {
      const thumbnailURL = `${filter.youTrackUrl}${trimAttachmentsContext(attachment.thumbnailURL)}`;
      return (
        <div
          className="aw__activity__attachment__added-panel__thumbnail"
          key={uniqueKey}
        >
          <Link
            target={'_blank'}
            href={attachmentHref}
          >
            <img width={96} height={64} src={thumbnailURL} alt={'preview'}/>
          </Link>
        </div>
      );
    } else {
      return (
        <Link
          key={uniqueKey}
          target={'_blank'}
          href={attachmentHref}
        >
          {attachment.name}
        </Link>
      );
    }
  }

  // eslint-disable-next-line react/display-name
  renderContent = activity => {
    const fieldName = i18n('Attachment');
    const removedStubs = activity.removed;
    const addedStubs = activity.added.filter(attachment => !attachment.url);
    const addedThumbnails = activity.added.filter(attachment => attachment.url);

    return (
      <div className="aw__activity__attachment">
        <div className="aw__activity__attachment__header">
          <span className="aw__activity__attachment__header__field-name">
            {`${fieldName}:`}
          </span>
          {removedStubs.map(attachment =>
            this.renderAttachmentStub(activity, attachment, true)
          )}
          {addedStubs.map(attachment =>
            this.renderAttachmentStub(activity, attachment, false)
          )}
        </div>
        <div className="aw__activity__attachment__added-panel">
          {addedThumbnails.map(attachment =>
            this.renderAttachmentThumbnail(activity, attachment)
          )}
        </div>
      </div>
    );
  };
}

export default ContentAttachmentActivity;
