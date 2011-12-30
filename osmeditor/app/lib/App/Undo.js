
/*
 * @requires plugins/Tool.js
 */

Ext.namespace("App");

App.Undo = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_undo",

    text: OpenLayers.i18n("Undo"),

    /** api: method[addActions]
     */
    addActions: function() {
        this.mapPanel = this.target.mapPanel;
        var actions = [new Ext.Action(this)];
        return App.CreatePolygon.superclass.addActions.apply(this, [actions]);
    },

    handler: function() {
        if (this.mapPanel.undoList.length > 0) {
            this.mapPanel.undoList.pop().undo(this.mapPanel);
        }
    }
});

Ext.preg(App.Undo.prototype.ptype, App.Undo);
