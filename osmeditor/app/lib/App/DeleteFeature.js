
/*
 * @requires plugins/Tool.js
 * @include GeoExt/widgets/Action.js
 * @include App/SelectFeature.js
 * @include App/CombinedUndo.js
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
            var deletedFeatures = [feature];

            var undo = new App.CombinedUndo();

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
                        var f = mapPanel.getFeature(osmid);
                        var geometry = f.geometry;
                        if (f.geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon") {
                            geometry = geometry.components[0];
                        }
                        var index = 0;
                        for (var leni = geometry.components.length ; index < leni ; index++) {
                            if (geometry.components[index] == feature.geometry) {
                                break;
                            }
                        }
                        geometry.removeComponent(feature.geometry);
                        mapPanel.drawFeature(feature);
                        undo.list.push({
                            undo: function(mapPanel) {
                                geometry.addComponent(feature.geometry, index)
                                mapPanel.drawFeature(f);
                            }
                        });
                    }, this);
                }
                else {
                    dep.forEach(function (osmid) {
                        var d = mapPanel.depandancies[osmid];
                        if (!d || d.length <= 1) {
                            var f = this.layer.getFeatureBy('osm_id', osmid);
                            if (!hasAttributes(f)) {
                                mapPanel.deletedFeatures.push(f);
                                deletedFeatures.push(f);
                            }
                        }
                    }, this);
                }
            }


            mapPanel.osm.removeFeatures(deletedFeatures);
            undo.list.push({
                undo: function(mapPanel) {
                    deletedFeatures.forEach(function (feature) {
                        mapPanel.deletedFeatures = mapPanel.deletedFeatures.splice(
                                mapPanel.deletedFeatures.indexOf(feature), 1);
                        mapPanel.drawFeature(feature);
                    });
                    mapPanel.osm.addFeatures(deletedFeatures);
                }
            });
            mapPanel.undoList.push(undo);
        }

        this.map = mapPanel.map;
        var actions = [new GeoExt.Action(this)];
        return App.ModifyFeatureGeometry.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.DeleteFeature.prototype.ptype, App.DeleteFeature);
