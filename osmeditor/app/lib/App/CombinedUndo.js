
Ext.namespace("App");

App.CombinedUndo = Ext.extend(function() {this.list = []}, {
    list: null,
    undo: function() {
        this.list.reverse().forEach(function(elem) {
            elem.undo();
        }, this);
    }
});
