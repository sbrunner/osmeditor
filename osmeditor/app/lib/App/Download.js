
/*
 * @requires plugins/Tool.js
 * @incude OpenLayers/Layer/Vector.js
 * @incude OpenLayers/Feature/Vector.js
 * @incude OpenLayers/Geometry/Polygon.js
 */

Ext.namespace("App");

App.Download = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_download",

    text: OpenLayers.i18n("Download"),

    force: false,

    layer: null,

    handler: function() {
        var osm = this.target.mapPanel.osm;
        if (!this.force && (osm.getFeatureBy('action', 'modified') ||
                osm.getFeatureBy('action', 'new') ||
                this.target.mapPanel.deletedFeatures.length > 0)) {
            console.log("Modified");
            console.log(osm.getFeatureBy('action', 'modified'));
            console.log("New");
            console.log(osm.getFeatureBy('action', 'new'));
            console.log("Deleted");
            console.log(this.target.mapPanel.deletedFeatures.length);
            console.log(this.target.mapPanel.deletedFeatures);
            alert(OpenLayers.i18n("Unable to up download new area on modified features"));
        }
        else {
            var mapBounds = this.target.mapPanel.bboxstrategie.getMapBounds();
            if (mapBounds !== null && this.target.mapPanel.bboxstrategie.invalidBounds(mapBounds)) {
                this.target.mapPanel.osm.destroyFeatures();
                this.tool.displayBbox(mapBounds);
                this.target.mapPanel.undoList = [];
                this.target.mapPanel.depandancies = {};
                this.target.mapPanel.bboxstrategie.update();
            }
        }
    },

    displayBbox: function(mapBounds) {
        var maxextent = this.target.mapPanel.map.getMaxExtent().toGeometry().components[0];
        var mapBounds100 = new OpenLayers.Bounds(
            mapBounds.left - 100,
            mapBounds.bottom - 100,
            mapBounds.right + 100,
            mapBounds.top + 100).toGeometry().components[0];
        var mapBounds1000 = new OpenLayers.Bounds(
            mapBounds.left - 1000,
            mapBounds.bottom - 1000,
            mapBounds.right + 1000,
            mapBounds.top + 1000).toGeometry().components[0];
        var mapBounds10000 = new OpenLayers.Bounds(
            mapBounds.left - 10000,
            mapBounds.bottom - 10000,
            mapBounds.right + 10000,
            mapBounds.top + 10000).toGeometry().components[0];
        var mapBounds100000 = new OpenLayers.Bounds(
            mapBounds.left - 100000,
            mapBounds.bottom - 100000,
            mapBounds.right + 100000,
            mapBounds.top + 100000).toGeometry().components[0];
        var mapBounds1000000 = new OpenLayers.Bounds(
            mapBounds.left - 1000000,
            mapBounds.bottom - 1000000,
            mapBounds.right + 1000000,
            mapBounds.top + 1000000).toGeometry().components[0];
        var mapBounds10000000 = new OpenLayers.Bounds(
            mapBounds.left - 10000000,
            mapBounds.bottom - 10000000,
            mapBounds.right + 10000000,
            mapBounds.top + 10000000).toGeometry().components[0];
        var style = {
            'fillColor': 'black',
            'fillOpacity': 0.2,
            'stroke': false
        };


        this.layer.destroyFeatures();
        this.layer.addFeatures([
            new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Polygon([
                mapBounds100, mapBounds.toGeometry().components[0]]), {}, style),
            new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Polygon([
                mapBounds1000, mapBounds100]), {}, style),
            new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Polygon([
                mapBounds10000, mapBounds1000]), {}, style),
            new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Polygon([
                mapBounds100000, mapBounds10000]), {}, style),
            new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Polygon([
                mapBounds1000000, mapBounds100000]), {}, style),
            new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Polygon([
                mapBounds10000000, mapBounds1000000]), {}, style),
            new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Polygon([
                maxextent, mapBounds10000000]), {}, style)
        ]);
    },

    /** api: method[addActions]
     */
    addActions: function() {
        this.tool = this;
        this.target.addListener('ready', function() {
            this.layer = new OpenLayers.Layer.Vector();
            this.target.mapPanel.map.addLayer(this.layer);
        }, this);
        var action = new Ext.Action(this);
        return App.Download.superclass.addActions.apply(this, [action]);
    }
});

Ext.preg(App.Download.prototype.ptype, App.Download);
