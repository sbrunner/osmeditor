
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
        var actions = [new Ext.Action(this)];
        return App.ModifyFeatureGeometry.superclass.addActions.apply(this, [actions]);
    },

    hasAttributes: function(feature) {
        for (a in feature.attributes) {
            return true;
        }
        return false;
    },

    handler: function() {
        // clone
        var features = [].concat(this.target.mapPanel.osm.selectedFeatures);
        var undo = new App.CombinedUndo();

        features.forEach(function (feature) {
            // TODO test if in relation and in download bbox

            this.target.mapPanel.deletedFeatures.push(feature);
            var deletedFeatures = [feature];

            var dep = this.target.mapPanel.depandancies[feature.osm_id];
            if (dep) {
                if (feature.geometry instanceof OpenLayers.Geometry.Point) {
                    dep.forEach(function (osmid) {
                        var f = this.target.mapPanel.getFeature(osmid);
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
                        this.target.mapPanel.drawFeature(feature);
                        var action = f.action;
                        if (!action) {
                            f.action = 'modified';
                        }
                        undo.list.push({
                            undo: function(mapPanel) {
                                geometry.addComponent(feature.geometry, index);
                                f.action = action;
                                mapPanel.drawFeature(f);
                            }
                        });
                    }, this);
                }
                else {
                    dep.forEach(function (osmid) {
                        var d = this.target.mapPanel.depandancies[osmid];
                        if (!d || d.length <= 1) {
                            var f = this.target.mapPanel.getFeature(osmid);
                            if (!this.hasAttributes(f)) {
                                this.target.mapPanel.deletedFeatures.push(f);
                                deletedFeatures.push(f);
                            }
                        }
                    }, this);
                }

                this.target.mapPanel.osm.removeFeatures(deletedFeatures);
                undo.list.push({
                    undo: function(mapPanel) {
                        deletedFeatures.forEach(function (feature) {
                            mapPanel.deletedFeatures = OpenLayers.Util.removeItem(mapPanel.deletedFeatures, feature);
                            mapPanel.drawFeature(feature);
                        });
                        mapPanel.osm.addFeatures(deletedFeatures);
                    }
                });
            }
        }, this);
        this.target.mapPanel.undoList.push(undo);
    }

});

Ext.preg(App.DeleteFeature.prototype.ptype, App.DeleteFeature);
