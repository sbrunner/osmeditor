
Ext.namespace("App");

App.CombinedUndo = Ext.extend(function() {this.list = []}, {
    list: null,
    undo: function(mapPanel) {
        this.list.reverse().forEach(function(elem) {
            elem.undo(mapPanel);
        }, this);
    }
});
