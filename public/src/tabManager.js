function TabManager(id, force = false, editor) {
    this.id = id;
    this.root = document.getElementById(id);
    if(!this.root) console.warn("TabManager: Can't find element with \"" + id + "\" id!")
    this.tabs = [];
    this.currentTab = null;
    this.force = force;
    this.editor = editor;
}

TabManager.prototype.setCurrentFile = function(id) {
    for(var i = 0; i < this.tabs.length; i++)
    {
        if(this.tabs[i].id === id) {
            this.editor.setValue(this.tabs[i].content);
            this.currentTab = this.tabs[i]
        }
    }
}

TabManager.prototype.addTab = function(tab) {
    this.tabs.push({
        ...tab,
        content: '',
        id: String(Math.floor(Math.random() * 1000) + 1)
    });
    if(this.force) this.updateTabManager();
}

TabManager.prototype.updateTabManager = function() {
    const that = this
    this.root.innerHTML = ""
    this.tabs.forEach(val => {
        const tab = document.createElement('div');
        console.log(that.currentTab)
        if(that.currentTab && that.currentTab.id === val.id) tab.style.background = 'rgba(100, 100, 100, .1)'
        tab.dataset.name = val.name
        tab.dataset.id = val.id;
        tab.onclick = function(e) {
            e.preventDefault()
            that.setCurrentFile(e.target.dataset?.id)
        }
        const img = document.createElement('img')
        img.src = '/img/' + val.extension + '.png'
        img.onload = function() {
            img.width = 15
            tab.appendChild(img)
            const label_name = document.createElement('label')
            label_name.innerText = val.name;
            tab.appendChild(label_name)
            const close_btn = document.createElement('label')
            close_btn.innerHTML = '&times;'
            close_btn.onclick = function(e) {
                e.preventDefault()
                const id = e.target.dataset.id;
                that.tabs = that.tabs.filter((val) => val.id !== id);
                that.updateTabManager()
            }
            tab.appendChild(close_btn)
            that.root.appendChild(tab)
        }
    })
}