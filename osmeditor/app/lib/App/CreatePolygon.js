
/*
 * @requires plugins/Tool.js
 * @include GeoExt/widgets/Action.js
 * @include OpenLayers/Handler/Polygon.js
 * @include OpenLayers/Control/DrawFeature.js
 */

Ext.namespace("App");

App.CreatePolygon = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_createpolygon",

    text: OpenLayers.i18n("Polygon"),

    /** api: method[addActions]
     */
    addActions: function() {
        this.control = new OpenLayers.Control.DrawFeature(
                this.target.mapPanel.map.getLayersByName("OSM")[0],
                OpenLayers.Handler.Polygon);
        this.map = this.target.mapPanel.map;
        var actions = [new GeoExt.Action(this)];
        return App.CreatePolygon.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.CreatePolygon.prototype.ptype, App.CreatePolygon);
