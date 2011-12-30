
/*
 * @requires plugins/Tool.js
 */

Ext.namespace("App");

App.Download = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_download",

    text: OpenLayers.i18n("Download"),

    force: false,

    handler: function() {
        var osm = this.target.mapPanel.map.getLayersByName("OSM")[0];
        if (!this.force && (osm.getFeatureBy('action', 'modified') ||
                osm.getFeatureBy('action', 'new') ||
                osm.getFeatureBy('action', 'deleted'))) {
            alert(OpenLayers.i18n("Unable to up download new area on modified features"));
        }
        else {
            this.target.mapPanel.undoList = [];
            this.target.mapPanel.depandancies = {};
            this.target.mapPanel.bboxstrategie.update();
        }
    },

    /** api: method[addActions]
     */
    addActions: function() {
        var actions = [new Ext.Action(this)];
        return App.Download.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.Download.prototype.ptype, App.Download);
