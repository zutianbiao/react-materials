import React, { useState } from 'react';
import IceContainer from '@icedesign/container';
import { Editor } from 'slate-react';
import { Value } from 'slate';
import { isKeyHotkey } from 'is-hotkey';
import initialValue from './initRichValue.json';

import './RichEditor.scss';
import styles from './index.module.scss';

// 当前富文本组件使用了 Slate 详细文档请参见 https://docs.slatejs.org/

const DEFAULT_NODE = 'paragraph';
const isBoldHotkey = isKeyHotkey('mod+b');
const isItalicHotkey = isKeyHotkey('mod+i');
const isUnderlinedHotkey = isKeyHotkey('mod+u');
const isCodeHotkey = isKeyHotkey('mod+`');

export default function RichEditor() {
  const [value, setValue] = useState(Value.fromJSON(initialValue));

  const hasMark = (type) => {
    return value.activeMarks.some((mark) => mark.type === type);
  };

  const hasBlock = (type) => {
    return value.blocks.some((node) => node.type === type);
  };

  const onChange = ({ value }) => {
    console.log('当前富文本数据的 JSON 表示：', value.toJSON());
    setValue(value);
  };

  // 摁下快捷键之后，设置当前选中文本要切换的富文本类型
  const onKeyDown = (event, change) => {
    let mark;

    if (isBoldHotkey(event)) {
      mark = 'bold';
    } else if (isItalicHotkey(event)) {
      mark = 'italic';
    } else if (isUnderlinedHotkey(event)) {
      mark = 'underlined';
    } else if (isCodeHotkey(event)) {
      mark = 'code';
    } else {
      return;
    }

    event.preventDefault();
    change.toggleMark(mark);
    return true;
  };

  // 标记当前选中文本
  const onClickMark = (event, type) => {
    event.preventDefault();
    const change = value.change().toggleMark(type);
    onChange(change);
  };

  // 切换当前 block 类型
  const onClickBlock = (event, type) => {
    event.preventDefault();
    const change = value.change();
    const { document } = value;

    if (type !== 'bulleted-list' && type !== 'numbered-list') {
      const isActive = hasBlock(type);
      const isList = hasBlock('list-item');

      if (isList) {
        change
          .setBlock(isActive ? DEFAULT_NODE : type)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list');
      } else {
        change.setBlock(isActive ? DEFAULT_NODE : type);
      }
    } else {
      const isList = hasBlock('list-item');
      const isType = value.blocks.some((block) => {
        return !!document.getClosest(
          block.key,
          (parent) => parent.type === type
        );
      });

      if (isList && isType) {
        change
          .setBlock(DEFAULT_NODE)
          .unwrapBlock('bulleted-list')
          .unwrapBlock('numbered-list');
      } else if (isList) {
        change
          .unwrapBlock(
            type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list'
          )
          .wrapBlock(type);
      } else {
        change.setBlock('list-item').wrapBlock(type);
      }
    }

    onChange(change);
  };

  const renderMarkButton = (type, icon) => {
    const isActive = hasMark(type);
    const onMouseDown = (event) => onClickMark(event, type);

    return (
      <span className="button" onMouseDown={onMouseDown} data-active={isActive}>
        <span className="material-icons">{icon}</span>
      </span>
    );
  };

  const renderBlockButton = (type, icon) => {
    const isActive = hasBlock(type);
    const onMouseDown = (event) => onClickBlock(event, type);

    return (
      <span className="button" onMouseDown={onMouseDown} data-active={isActive}>
        <span className="material-icons">{icon}</span>
      </span>
    );
  };

  // 配置 block type 对应在富文本里面的渲染组件
  const renderNode = (props) => {
    const { attributes, children, node } = props;
    switch (node.type) {
      case 'block-quote':
        return <blockquote {...attributes}>{children}</blockquote>;
      case 'bulleted-list':
        return <ul {...attributes}>{children}</ul>;
      case 'heading-one':
        return <h1 {...attributes}>{children}</h1>;
      case 'heading-two':
        return <h2 {...attributes}>{children}</h2>;
      case 'list-item':
        return <li {...attributes}>{children}</li>;
      case 'numbered-list':
        return <ol {...attributes}>{children}</ol>;
      default:
        return <div {...attributes}>{children}</div>;
    }
  };

  // 配置 mark 对应在富文本里面的渲染组件
  const renderMark = (props) => {
    const { children, mark } = props;
    switch (mark.type) {
      case 'bold':
        return <strong>{children}</strong>;
      case 'code':
        return <code>{children}</code>;
      case 'italic':
        return <em>{children}</em>;
      case 'underlined':
        return <u>{children}</u>;
      default:
        return <span>{children}</span>;
    }
  };

  return (
    <div className="rich-editor">
      <IceContainer>
        <div>
          <div className="rich-editor-menu rich-editor-toolbar-menu">
            {renderMarkButton('bold', 'format_bold')}
            {renderMarkButton('italic', 'format_italic')}
            {renderMarkButton('underlined', 'format_underlined')}
            {renderMarkButton('code', 'code')}
            {renderBlockButton('heading-one', 'looks_one')}
            {renderBlockButton('heading-two', 'looks_two')}
            {renderBlockButton('block-quote', 'format_quote')}
            {renderBlockButton('numbered-list', 'format_list_numbered')}
            {renderBlockButton('bulleted-list', 'format_list_bulleted')}
          </div>
          <div className="rich-editor-body">
            <Editor
              className={styles.editor}
              placeholder="请编写一些内容..."
              value={value}
              onChange={onChange}
              onKeyDown={onKeyDown}
              renderNode={renderNode}
              renderMark={renderMark}
              spellCheck
            />
          </div>
        </div>
      </IceContainer>
    </div>
  );
}
