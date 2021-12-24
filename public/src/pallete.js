function CommandPallete(id, editor) {
    this.id = id;
    this.root = document.getElementById(this.id);
    this.commands = [];
    this.template = [];
    this.ul = this.root.querySelector("ul")
    this.hidePallete()
    this.input = this.root.querySelector("input")
    console.log(this.input)
    this.input.oninput = this.onChange.bind(this);
    this.lastLength = 0;

    if(editor) editor.onkeyup = (e) => {
        console.log(e)
        if(e.keyCode == 27) this.hidePallete()
        else if(e.key == '<' && e.shiftKey && e.ctrlKey) this.openPallete()
    }

    document.onkeyup = (e) => {
        if(e.keyCode == 27) this.hidePallete()
        else if(e.key == '<' && e.shiftKey && e.ctrlKey) this.openPallete()
    }
}

CommandPallete.prototype.sortCommands = function(text = '', index = 0, list = null) {
    if(list === null) list = this.commands;
    var sorted = []
    var other = []
    list.forEach((val) => {
        if(val.command[index] === text[index]) sorted.push(val);
        else if(!val.command[index]) sorted.push(val);
        else other.push(val);
    })
    if(sorted.length > 1) sorted = this.sortCommands(text, index + 1, sorted)
    var sorted = [...sorted, ...other]
    return sorted;
}

CommandPallete.prototype.onChange = function(e) {
    console.log(e.target.value.length < this.lastLength, this.lastLength)
    if(e.target.value.length <= 0 || e.target.value.length < this.lastLength) {
        this.commands = this.template;
        this.commands = this.sortCommands(e.target.value)
        this.updatePallete(e.target.value)
        return;
    }
    this.lastLength = e.target.value.length
    this.commands = this.sortCommands(e.target.value);
    this.updatePallete(e.target.value)
}

CommandPallete.prototype.clearCommands = function() {
    this.commands = [];
    this.template = []
    this.updatePallete()
}

CommandPallete.prototype.addCommand = function(command, listener) {
    if(command.length <= 0) return;
    this.commands.push({
        command: command,
        listener: listener,
    });
    this.template.push({
        command: command,
        listener: listener,
    })
}

CommandPallete.prototype.updatePallete = function(text = null) {
    this.ul.innerHTML = ""
    var isSeparate = false;
    for(var i = 0; i < this.commands.length; i++)
    {
        const item = document.createElement('li')
        if(text !== null && this.commands[i].command.startsWith(text))
            item.innerHTML = "> " + "<strong>" + this.commands[i].command.slice(0, text.length) + "</strong>" + this.commands[i].command.slice(text.length)
        else 
        {
            if(!isSeparate) {
                const hr = document.createElement('hr')
                hr.color = '#aaa'
                hr.size = .7
                this.ul.appendChild(hr)
                isSeparate = true;
            }
            item.innerText = "> " + this.commands[i].command
        }

        item.onclick = this.commands[i].listener

        this.ul.appendChild(item)
    }
}

CommandPallete.prototype.openPallete = function() {
    this.root.style.display = 'flex';
    this.input.focus()
}

CommandPallete.prototype.hidePallete = function() {
    this.root.style.display = 'none';
}