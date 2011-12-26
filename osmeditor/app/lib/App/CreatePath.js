
/*
 * @requires plugins/Tool.js
 * @include GeoExt/widgets/Action.js
 * @include OpenLayers/Handler/Path.js
 * @include OpenLayers/Control/DrawFeature.js
 */

Ext.namespace("App");

App.CreatePath = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_createpath",

    text: OpenLayers.i18n("Path"),

    /** api: method[addActions]
     */
    addActions: function() {
        this.control = new OpenLayers.Control.DrawFeature(
                this.target.mapPanel.map.getLayersByName("OSM")[0],
                OpenLayers.Handler.Path);
        this.map = this.target.mapPanel.map;
        var actions = [new GeoExt.Action(this)];
        return App.CreatePath.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.CreatePath.prototype.ptype, App.CreatePath);
