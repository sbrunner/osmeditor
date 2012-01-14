
/*
 * @requires plugins/Tool.js
 * @include GeoExt/widgets/Action.js
 */

Ext.namespace("App");

App.DragFeature = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_dragfeature",

    text: OpenLayers.i18n("DragFeature"),

    /** api: method[addActions]
     */
    addActions: function() {
        var mapPanel = this.target.mapPanel;
        this.control = new OpenLayers.Control.DragFeature(mapPanel.osm, {
            overFeature: function(feature) {
                if (feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Point") {
                    OpenLayers.Element.addClass(mapPanel.map.viewPortDiv, "olOverFeaturePoint");
                }
                else if (feature.geometry.CLASS_NAME == "OpenLayers.Geometry.LineString") {
                    OpenLayers.Element.addClass(mapPanel.map.viewPortDiv, "olOverFeatureLine");
                }
                else if (feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon") {
                    OpenLayers.Element.addClass(mapPanel.map.viewPortDiv, "olOverFeaturePolygon");
                }
                OpenLayers.Control.DragFeature.prototype.overFeature.apply(this, arguments);
            },
            outFeature: function(feature) {
                OpenLayers.Element.removeClass(mapPanel.map.viewPortDiv, "olOverFeaturePoint");
                OpenLayers.Element.removeClass(mapPanel.map.viewPortDiv, "olOverFeatureLine");
                OpenLayers.Element.removeClass(mapPanel.map.viewPortDiv, "olOverFeaturePolygon");
                OpenLayers.Control.DragFeature.prototype.outFeature.apply(this, arguments);
            },
            downFeature: function(pixel) {
                OpenLayers.Element.addClass(mapPanel.map.viewPortDiv, "olDownFeature");
                var res = this.map.getResolution();
                this.moveX = 0;
                this.moveY = 0;
                OpenLayers.Control.DragFeature.prototype.downFeature.apply(this, arguments)
            },
            upFeature: function(pixel) {
                OpenLayers.Element.removeClass(mapPanel.map.viewPortDiv, "olDownFeature");
                OpenLayers.Control.DragFeature.prototype.upFeature.apply(this, arguments);
            },
            deactivate: function() {
                OpenLayers.Element.removeClass(this.map.viewPortDiv, "olOverFeaturePoint");
                OpenLayers.Element.removeClass(this.map.viewPortDiv, "olOverFeatureLine");
                OpenLayers.Element.removeClass(this.map.viewPortDiv, "olOverFeaturePolygon");
                OpenLayers.Element.removeClass(this.map.viewPortDiv, "olDownFeature");
                return OpenLayers.Control.DragFeature.prototype.deactivate.apply(this, arguments);
            },
            onComplete: function(feature, pixel) {
                var moveX = this.moveX;
                var moveY = this.moveY;

                var featureActions = {};
                var features = {};
                if (feature.type == 'node') {
                    if (!feature.action) {
                        featureActions[feature.osm_id] = feature.action;
                        feature.action = 'modified';
                    }
                }
                else {
                    feature.geometry.getVertices().forEach(function(node) {
                        var feature = mapPanel.getFeature(node.osm_id);
                        if (!feature.action) {
                            featureActions[feature.osm_id] = feature.action;
                            features[feature.osm_id] = feature;
                            feature.action = 'modified';
                        }
                    });
                }
                mapPanel.undoList.push({
                    undo: function(mapPanel) {
                        feature.geometry.move(-moveX, -moveY);
                        for (osm_id in features) {
                            features[osm_id].action = featureActions[osm_id];
                        }
                        mapPanel.drawFeature(feature);
                    }
                });
            },
            onDrag: function(f) {
                mapPanel.drawFeature(f);
            },
            moveFeature: function(pixel) {
                var res = this.map.getResolution();
                this.moveX += res * (pixel.x - this.lastPixel.x);
                this.moveY += res * (this.lastPixel.y - pixel.y);
                OpenLayers.Control.DragFeature.prototype.moveFeature.apply(this, arguments);
            }
        });
        this.map = mapPanel.map;
        var actions = [new GeoExt.Action(this)];
        return App.DragFeature.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.DragFeature.prototype.ptype, App.DragFeature);
