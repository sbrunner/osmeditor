
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
                OpenLayers.Control.DragFeature.prototype.overFeature.apply(this, arguments)
            },
            outFeature: function(feature) {
                OpenLayers.Element.removeClass(mapPanel.map.viewPortDiv, "olOverFeaturePoint");
                OpenLayers.Element.removeClass(mapPanel.map.viewPortDiv, "olOverFeatureLine");
                OpenLayers.Element.removeClass(mapPanel.map.viewPortDiv, "olOverFeaturePolygon");
                OpenLayers.Control.DragFeature.prototype.outFeature.apply(this, arguments)
            },
            downFeature: function(pixel) {
                OpenLayers.Element.addClass(mapPanel.map.viewPortDiv, "olDownFeature");
                var res = this.map.getResolution();
                this.firstX = res * pixel.x;
                this.firstY = res * pixel.y;
                OpenLayers.Control.DragFeature.prototype.downFeature.apply(this, arguments)
            },
            upFeature: function(pixel) {
                OpenLayers.Element.removeClass(mapPanel.map.viewPortDiv, "olDownFeature");
                OpenLayers.Control.DragFeature.prototype.upFeature.apply(this, arguments)
            },
            onComplete: function(feature, pixel) {
                var firstX = this.firstX;
                var firstY = this.firstY;
                var res = this.map.getResolution();
                mapPanel.undoList.push({
                    undo: function(mapPanel) {
                        feature.geometry.move(firstX - res * pixel.x, res * pixel.y - firstY);
                        mapPanel.drawFeature(f);
                    }
                });
            },
            onDrag: function(f) {
                if (f.type == 'node' && !f.action) {
                    f.action = 'modified';
                }
                mapPanel.drawFeature(f);
            }
        });
        this.map = mapPanel.map;
        var actions = [new GeoExt.Action(this)];
        return App.DragFeature.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.DragFeature.prototype.ptype, App.DragFeature);
