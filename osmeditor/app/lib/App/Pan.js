
/*
 * @requires plugins/Tool.js
 */

Ext.namespace("App");
 
App.Pan = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_pan",

    text: OpenLayers.i18n("Pan"),

    /** api: method[addActions]
     */
    addActions: function() {
        var actions = [new Ext.Action(this)];
        return App.Pan.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.Pan.prototype.ptype, App.Pan);
