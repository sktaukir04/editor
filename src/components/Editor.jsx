import React, { useState, useRef, useEffect } from "react";
import { Editor, EditorState, getDefaultKeyBinding, RichUtils, convertToRaw, convertFromRaw, Modifier } from 'draft-js';
import './Editor.css';
import '../../node_modules/draft-js/dist/Draft.css';

export const RichEditorExample = () => {
    const [editorState, setEditorState] = useState(loadContentFromLocalStorage() || EditorState.createEmpty());
    const editorRef = useRef(null);

    useEffect(() => {
        saveContentToLocalStorage(editorState);
    }, [editorState]);

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
        if (e.keyCode === 9 ) {
            const newEditorState = RichUtils.onTab(
                e,
                editorState,
                4, 
            );
            if (newEditorState !== editorState) {
                setEditorState(newEditorState);
                return 'handled';
            }
        } else if (e.keyCode === 32 ) {
            const content = editorState.getCurrentContent();
            const selection = editorState.getSelection();
            const block = content.getBlockForKey(selection.getStartKey());
            const text = block.getText();

            if (text.startsWith("#")) {
                setEditorState(RichUtils.toggleBlockType(editorState, 'header-one'));
                return 'handled';
            } else if (text.startsWith("* ")) {
                if (text.startsWith("*** ")) {
                    setEditorState(RichUtils.toggleInlineStyle(editorState, 'UNDERLINE'));
                    return 'handled';
                } else if (text.startsWith("** ")) {
                    setEditorState(RichUtils.toggleInlineStyle(editorState, 'RED_TEXT'));
                    return 'handled';
                } else if (text.startsWith("* ")) {
                    setEditorState(RichUtils.toggleInlineStyle(editorState, 'BOLD'));
                    return 'handled';
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

    const saveContentToLocalStorage = (editorState) => {
        const contentState = editorState.getCurrentContent();
        const contentRaw = convertToRaw(contentState);
        localStorage.setItem('editorContent', JSON.stringify(contentRaw));
    };

    function loadContentFromLocalStorage() {
        try {
            const savedContent = localStorage.getItem('editorContent');
            if (savedContent) {
                const contentRaw = JSON.parse(savedContent);
                return EditorState.createWithContent(convertFromRaw(contentRaw));
            }
        } catch (error) {
            console.error('Error loading content from localStorage:', error);
        }
        return null;
    }


    const handleSaveClick = () => {
        saveContentToLocalStorage(editorState);
    };


    const styleMap = {
        CODE: {
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
            fontSize: 16,
            padding: 2,
        },
        BOLD: {
            fontWeight: 'bold',
        },
        RED_TEXT: {
            color: 'red',
        },
        UNDERLINE: {
            textDecoration: 'underline',
        },
    };


    const handleColorChange = (color) => {
        const selection = editorState.getSelection(); // Add this line
        const contentState = editorState.getCurrentContent();
        const contentWithColor = Modifier.applyInlineStyle(contentState, selection, `COLOR_${color}`);
        const newEditorState = EditorState.push(editorState, contentWithColor, 'change-inline-style');
        setEditorState(newEditorState); // Replace onToggle with setEditorState
    };

    const ColorPickerControl = ({ onColorChange }) => {
        // Implement your color picker UI and logic here
        // Example: return a simple button that triggers color change
        return (
            <button onClick={() => onColorChange('yourSelectedColor')}>
                Pick Color
            </button>
        );
    };

    function getBlockStyle(block) {
        switch (block.getType()) {
            case 'blockquote':
                return 'RichEditor-blockquote';
            case 'custom-color': // Add this case
                return `custom-color-${block.getData().get('color')}`;
            default:
                return null;
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
        { label: 'Custom Color', style: 'custom-color' },

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
                <ColorPickerControl onColorChange={(color) => handleColorChange(color)} />
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
    return (
        <div className="RichEditor-root">
            <div className="RichEditor-controls">
                <button onClick={handleSaveClick}>Save</button>
            </div>
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

