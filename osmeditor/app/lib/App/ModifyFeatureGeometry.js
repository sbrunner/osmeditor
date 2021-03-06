
/*
 * @requires plugins/Tool.js
 * @include GeoExt/widgets/Action.js
 * @include OpenLayers/Control/ModifyFeature.js
 */

Ext.namespace("App");

App.ModifyFeatureGeometry = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_modifyfeaturegeometry",

    text: OpenLayers.i18n("ModifyFeature"),

    /** api: method[addActions]
     */
    addActions: function() {
        var mapPanel = this.target.mapPanel;
        var original = null;
        var featureActions = {};
        this.control = new OpenLayers.Control.ModifyFeature(mapPanel.osm, {
                unselectFeature: function(f) {
                    OpenLayers.Control.ModifyFeature.prototype.unselectFeature.apply(this, arguments);
                    f.geometry.getVertices().forEach(function(p) {
                        mapPanel.drawFeature(mapPanel.osm.getFeatureBy('osm_id', p.osm_id));
                    }, this);

                    var o = original;
                    var al = featureActions;
                    featureActions = {};
                    mapPanel.undoList.push({
                        undo: function(mapPanel) {
                            var components = [];
                            var c = o.components;
                            if (o.CLASS_NAME == "OpenLayers.Geometry.Polygon") {
                                c = c[0].components;
                            }
                            c.forEach(function(p) {
                                var a = mapPanel.getFeature(p.osm_id);
                                a.geometry.x = p.x;
                                a.geometry.y = p.y;
                                components.push(p.osm_id);
                            }, this);

                            var ga = mapPanel.getFeature(o.osm_id);
                            var line = ga.geometry;
                            if (line.CLASS_NAME == "OpenLayers.Geometry.Polygon") {
                                line = line.components[0];
                            }
                            line.components.forEach(function(p) {
                                if (components.indexOf(p.osm_id) < 0) {
                                    line.removeComponent(p);
                                    mapPanel.removeFeature(p.osm_id);
                                }
                            }, this);

                            f.geometry.getVertices().forEach(function(p) {
                                mapPanel.drawFeature(mapPanel.getFeature(p.osm_id));
                            }, this);

                            for (var osm_id in al) {
                                mapPanel.getFeature(osm_id).action = al[osm_id];
                            }
                        }
                    });
                },
                selectFeature: function(f) {
                    original = f.geometry.clone();
                    original.osm_id = f.osm_id;
                    OpenLayers.Control.ModifyFeature.prototype.selectFeature.apply(this, arguments);
                },
                dragComplete: function(vertex) {
                    OpenLayers.Control.ModifyFeature.prototype.dragComplete.apply(this, arguments);

                    var fv = mapPanel.getFeature(vertex.geometry.osm_id);
                    if (fv.action != 'new') {
                        featureActions[fv.osm_id] = fv.action;
                        fv.action = 'modified';
                    }
                    mapPanel.drawFeature(vertex);
                }
            }
        );
        this.control.virtualStyle.display = 1;
        this.control.virtualStyle.pointRadius = 3;
        this.control.virtualStyle.fillOpacity = 0.8;
        this.control.virtualStyle.fillColor = 'blue';
        this.control.virtualStyle.strokeColor = 'blue';
        this.control.virtualStyle.strokeOpacity = 0.1;
        this.control.virtualStyle.strokeWidth = 20;

        this.control.dragVertex = function(vertex, pixel) {
            if (this.feature.geometry.CLASS_NAME != "OpenLayers.Geometry.Point" && vertex._index) {
                var f = new OpenLayers.Feature.Vector();
                f.geometry = vertex.geometry;
                this.feature.layer.addFeatures(f);
                if (this.feature.action != 'new') {
                    featureActions[this.feature.osm_id] = this.feature.action;
                    this.feature.action = "modified";
                }
            }
            OpenLayers.Control.ModifyFeature.prototype.dragVertex.apply(this, arguments);
        };
        this.map = this.target.mapPanel.map;

        var actions = [new GeoExt.Action(this)];
        return App.ModifyFeatureGeometry.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.ModifyFeatureGeometry.prototype.ptype, App.ModifyFeatureGeometry);
