function Editor(root, config, extension) {
    this.editor = CodeMirror(root, {
            lineNumbers: true,
            mode: config[extension].name.toLowerCase(),
            lineSeparator: '\n',
            indentWithTabs: true,
            indentUnit: 4,
            theme: 'darcula',
            lineNumberFormatter: (line) => {
                return line
            },
            showCursorWhenSelecting: true,
            pasteLinesPerSelection: true,
            autofocus: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            extraKeys: {
                'Ctrl-/': (cm) => {
                    console.log(cm)
                    const start = cm.getCursor(true);
                    const end = cm.getCursor(false);
                    if((start.line !== end.line) || (start.ch !== end.ch))
                    {
                        if(editor.getLine(start.line).trim().startsWith(config[extension].commentUnit))
                        {
                            editor.uncomment({
                                ...start
                            }, {
                                ...end
                            })
                        }
                        else {
                            editor.blockComment({
                                ...start
                            }, {
                                ...end
                            })
                        }
                    }
                    else {
                        editor.toggleComment();
                    }
                }
            }
        })
}

Editor.prototype.setValue = function(value) {
    this.editor.setValue(value)
}

Editor.prototype.toggleComment = function() {
    this.editor.toggleComment()
}