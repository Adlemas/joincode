function Editor(root, config = {
    'js': {name: 'JavaScript'}
}, extension = 'js', readOnly = false, additional = {}, defaultValue = '') {
    this.editor = CodeMirror(root, {
            lineNumbers: true,
            mode: {
                name: config[extension].name.toLowerCase(),
                globalVars: true
            },
            autoCloseTags: true,
            lineSeparator: '\n',
            indentWithTabs: true,
            indentUnit: 4,
            theme: 'ayu-mirage',
            historyEventDelay: 400,
            workTime: 100, workDelay: 100,
            pollInterval: 50,
            showTrailingSpace: true,
            continueComments: 'Enter',
            foldGutter: true,
            readOnly: readOnly,
            styleActiveLine: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
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
                    const start = cm.getCursor(true);
                    const end = cm.getCursor(false);
                    if((start.line !== end.line) || (start.ch !== end.ch))
                    {
                        if(this.editor.getLine(start.line).trim().startsWith(config[extension].commentUnit))
                        {
                            this.editor.uncomment({
                                ...start
                            }, {
                                ...end
                            })
                        }
                        else {
                            this.editor.blockComment({
                                ...start
                            }, {
                                ...end
                            })
                        }
                    }
                    else {
                        this.editor.toggleComment();
                    }
                },
                "Ctrl-Space": "autocomplete",
                "Ctrl-F": "find"
            },
            lint: {
                'esversion': 6
            },
            styleActiveLine: readOnly ? false : true,
            ...additional
    })

    this._root = root;

    if(defaultValue.length > 0)
        this.setValue(defaultValue)
}

Editor.prototype.setValue = function(value) {
    this.editor.setValue(value)
}

Editor.prototype.toggleComment = function() {
    this.editor.toggleComment()
}

Editor.prototype._setOption = function(name, value) {
    this.editor.setOption(name, value)
} 

class RemoteEditor extends Editor {
    constructor(root, config, extension, options, additional = {}) {
        super(root, config, extension, true, additional)
        this.options = {
            timeout: 0,
            ...options
        }
    }

    receiveContent() {

    }
}