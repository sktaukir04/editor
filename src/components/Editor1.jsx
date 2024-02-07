import React, { useState, useRef } from "react";
import { Editor, EditorState, getDefaultKeyBinding, RichUtils } from 'draft-js';
import './Editor.css';
import '../../node_modules/draft-js/dist/Draft.css';

export const RichEditorExample = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const editorRef = useRef(null);

  const focusEditor = () => editorRef.current.focus();

  const handleKeyCommand = (command) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const mapKeyToEditorCommand = (e) => {
    if (e.keyCode === 9 /* TAB */) {
      const newEditorState = RichUtils.onTab(
        e,
        editorState,
        4, /* maxDepth */
      );
      if (newEditorState !== editorState) {
        setEditorState(newEditorState);
      }
      return null;
    } else if (e.keyCode === 32 /* SPACE */) {
      const content = editorState.getCurrentContent();
      const selection = editorState.getSelection();
      const block = content.getBlockForKey(selection.getStartKey());
      const text = block.getText();

      if (text.startsWith("#")) {
        return 'header';
      } else if (text.startsWith("* ")) {
        if (text.startsWith("*** ")) {
          return 'underline';
        } else if (text.startsWith("** ")) {
          return 'red-line';
        } else {
          return 'bold';
        }
      }
    }
    return getDefaultKeyBinding(e);
  };

  const toggleBlockType = (blockType) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType));
  };

  const toggleInlineStyle = (inlineStyle) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  };

  const className = 'RichEditor-editor' +
    (!editorState.getCurrentContent().hasText() &&
      editorState.getCurrentContent().getBlockMap().first().getType() !== 'unstyled'
      ? ' RichEditor-hidePlaceholder'
      : '');

  return (
    <div className="RichEditor-root">
      <BlockStyleControls
        editorState={editorState}
        onToggle={toggleBlockType}
      />
      <InlineStyleControls
        editorState={editorState}
        onToggle={toggleInlineStyle}
      />
      <div className={className} onClick={focusEditor}>
        <Editor
          blockStyleFn={getBlockStyle}
          customStyleMap={styleMap}
          editorState={editorState}
          handleKeyCommand={handleKeyCommand}
          keyBindingFn={mapKeyToEditorCommand}
          onChange={setEditorState}
          placeholder="Tell a story..."
          ref={editorRef}
          spellCheck={true}
        />
      </div>
    </div>
  );
};

const styleMap = {
  CODE: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2,
  },
};

function getBlockStyle(block) {
  switch (block.getType()) {
    case 'blockquote': return 'RichEditor-blockquote';
    default: return null;
  }
}

const StyleButton = ({ onToggle, style, label, active }) => {
  const handleClick = (e) => {
    e.preventDefault();
    onToggle(style);
  };

  let className = 'RichEditor-styleButton';
  if (active) {
    className += ' RichEditor-activeButton';
  }

  return (
    <span className={className} onMouseDown={handleClick}>
      {label}
    </span>
  );
};

const BLOCK_TYPES = [
  { label: 'H1', style: 'header-one' },
  { label: 'H2', style: 'header-two' },
  { label: 'H3', style: 'header-three' },
  { label: 'H4', style: 'header-four' },
  { label: 'H5', style: 'header-five' },
  { label: 'H6', style: 'header-six' },
  { label: 'Blockquote', style: 'blockquote' },
  { label: 'UL', style: 'unordered-list-item' },
  { label: 'OL', style: 'ordered-list-item' },
  { label: 'Code Block', style: 'code-block' },
];

const BlockStyleControls = ({ editorState, onToggle }) => {
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  return (
    <div className="RichEditor-controls">
      {BLOCK_TYPES.map((type) => (
        <StyleButton
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          onToggle={onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

const INLINE_STYLES = [
  { label: 'Bold', style: 'BOLD' },
  { label: 'Italic', style: 'ITALIC' },
  { label: 'Underline', style: 'UNDERLINE' },
  { label: 'Monospace', style: 'CODE' },
];

const InlineStyleControls = ({ editorState, onToggle }) => {
  const currentStyle = editorState.getCurrentInlineStyle();

  return (
    <div className="RichEditor-controls">
      {INLINE_STYLES.map((type) => (
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

export default RichEditorExample;
