
/*
 * @requires plugins/Tool.js
 * @include GeoExt/widgets/Action.js
 * @include App/SelectFeature.js
 */

Ext.namespace("App");

App.DeleteFeature = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_deletefeature",

    text: OpenLayers.i18n("DeleteFeature"),

    /** api: method[addActions]
     */
    addActions: function() {
        var mapPanel = this.target.mapPanel;
        this.control = new App.SelectFeature(mapPanel.map.getLayersByName("OSM")[0], {});

        this.control.onSelect = function(feature) {
            mapPanel.deletedFeatures.push(feature);
            this.layer.removeFeatures(feature);

            var dep = mapPanel.depandancies[feature.osm_id];
            if (dep) {
                hasAttributes = function(feature) {
                    for (a in feature.attributes) {
                        return true;
                    }
                    return false;
                };
                if (feature.geometry instanceof OpenLayers.Geometry.Point) {
                    dep.forEach(function (osmid) {
                        var f = this.layer.getFeatureBy('osm_id', osmid);
                        if (f.geometry instanceof OpenLayers.Geometry.LinearRing) {
                            f.geometry.removeComponent(feature.geometry);
                            f.layer.redraw(f);
                        }
                        else if (f.geometry instanceof OpenLayers.Geometry.Polygon) {
                            f.geometry.components[0].removeComponent(feature.geometry);
                            f.layer.redraw(f);
                        }
                    }, this);
                }
                else {
                    dep.forEach(function (osmid) {
                        var d = mapPanel.depandancies[osmid];
                        if (!d || d.length <= 1) {
                            var f = this.layer.getFeatureBy('osm_id', osmid);
                            if (!hasAttributes(f)) {
                                mapPanel.deletedFeatures.push(f);
                                this.layer.removeFeatures(f);
                            }
                        }
                    }, this);
                }
            }
        }

        this.map = mapPanel.map;
        var actions = [new GeoExt.Action(this)];
        return App.ModifyFeatureGeometry.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.DeleteFeature.prototype.ptype, App.DeleteFeature);
