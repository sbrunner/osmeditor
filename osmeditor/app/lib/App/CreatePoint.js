
/*
 * @requires plugins/Tool.js
 * @include GeoExt/widgets/Action.js
 * @include OpenLayers/Handler/Point.js
 * @include OpenLayers/Control/DrawFeature.js
 */

Ext.namespace("App");

App.CreatePoint = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_createpoint",

    text: OpenLayers.i18n("Point"),

    /** api: method[addActions]
     */
    addActions: function() {
        this.control = new OpenLayers.Control.DrawFeature(
                this.target.mapPanel.map.getLayersByName("OSM")[0],
                OpenLayers.Handler.Point);
        this.map = this.target.mapPanel.map;
        var actions = [new GeoExt.Action(this)];
        return App.CreatePoint.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.CreatePoint.prototype.ptype, App.CreatePoint);
