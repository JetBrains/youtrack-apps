import {FC, memo} from 'react';
import Tag from '@jetbrains/ring-ui-built/components/tag/tag';

import './shared.css';

interface CustomTagProps {
  backgroundColor: string;
  textColor: string;
  name: string;
  title?: string;
  className?: string;
  onClick?: () => void;
  onRemove?: () => void;
}

const TagComponent: FC<CustomTagProps> = ({backgroundColor, textColor, name, title, className, onClick, onRemove}) => (
  <Tag
    readOnly={!onRemove}
    interactive={Boolean(onClick)}
    backgroundColor={backgroundColor}
    textColor={textColor}
    rgTagTitle={title}
    className={className}
    onClick={onClick ?? (() => {})}
    onRemove={onRemove}
  >
    {name}
  </Tag>
);

export const TagButton = memo(TagComponent);
