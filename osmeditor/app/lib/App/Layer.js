
/*
 * @requires plugins/Tool.js
 * @include OpenLayers/Protocol/OSMAPI.js
 * @include OpenLayers/Layer/Vector.js
 * @include OpenLayers/Strategy/BBOX.js
 * @include OpenLayers/Format/OSM.js
 * @include OSM/Style/Mapnik.js
 * @include OSM/Style/JOSM.js
 * @include App/Snapping.js
 */

Ext.namespace("App");

App.Layer = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_layer",

    new_osm_id: -1,

    /** private */
    // true when we redraw depandancies
    updating: false,

    /** private */
    snappedList: {},
    /** private */
    snappedIndices: {},

    addOutput: function(config) {
        var styleMap = new OpenLayers.StyleMap();
        styleMap.styles["default"].addRules([new OpenLayers.Rule({
            symbolizer: {
                pointRadius: 5,
                fillOpacity: 0.4,
                fillColor: 'yellow',
                strokeColor: 'yellow',
                strokeWidth: 2
            },
            filter: new OpenLayers.Filter()
        })]);
        styleMap.styles.select.addRules([new OpenLayers.Rule({
            symbolizer: {
                pointRadius: 5,
                fillOpacity: 0.6,
                fillColor: 'blue',
                strokeColor: 'blue',
                strokeWidth: 2
            },
            filter: new OpenLayers.Filter()
        })]);
        styleMap = OSM.Style.JOSM.getStyleMap(styleMap);
        styleMap = OSM.Style.Mapnik.getStyleMap(styleMap);

        this.target.mapPanel.bboxstrategie = new OpenLayers.Strategy.BBOX({
            ratio: 1.2,
            autoActivate: false,
            projection: epsg900913
        });

        osm = new OpenLayers.Layer.Vector("OSM", {
            projection: epsg900913,
            strategies: [this.target.mapPanel.bboxstrategie],
            protocol: new OpenLayers.Protocol.OSMAPI({
                    url: "http://api.openstreetmap.org/api/0.6/map?",
                format: new OpenLayers.Format.OSM({
                    interestingTagsExclude: [],
                    internalProjection: epsg900913,
                    checkTags: false,
                    shareNode: true
                    /*,
                    relationsParsers: {
                        multipolygon: OpenLayers.Format.OSM.multipolygonParser,
                        boundary:     OpenLayers.Format.OSM.multipolygonParser,
                        route:        OpenLayers.Format.OSM.routeParser
                    }*/
                })
            }),
            styleMap: styleMap,
            attribution: "Data CC-By-SA by <a href='http://openstreetmap.org/' target='_blank'>OpenStreetMap</a>",
            getFeaturesBy: function(property, value) {
                var features = [];
                for (var i=0, len=this.features.length; i<len; ++i) {
                    if (this.features[i][property] == value) {
                        features.push(this.features[i]);
                    }
                }
                return features;
            }
        });

        osm.events.register('sketchcomplete', this, function(e) {
            this.update(e);
        });
        osm.events.register('sketchmodified', this, function(e) {
            if (e.feature.geometry.CLASS_NAME != "OpenLayers.Geometry.Point") {
                var snapped = this.target.mapPanel.map.getControlsByClass("App.Snapping")[0].snapped;
                e.feature.geometry.getVertices().forEach(function(p) {
                    if (e.vertex.id != p.id && snapped && snapped.x == p.x && snapped.y == p.y) {
                        this.snappedList[snapped.x + 21000000 + snapped.y * 42000000] = snapped;
                    }
                }, this);
            }
        });
        osm.events.register('featuresadded', this, function(e) {
            this.update(e);
        });
        osm.events.register('featuremodified', this, function(e) {
            if (!e.feature.action) {
                e.feature.action = 'modified';
            }
            this.update(e);
        });

        // should be directly added to be accessible by others plugins
        this.target.mapPanel.map.addLayer(osm);
        this.target.addListener('ready', function() {
            this.target.mapPanel.map.removeLayer(osm);
            this.target.mapPanel.map.addLayer(osm);
        }, this);

        this.target.mapPanel.featuresDeleted = [];

        this.target.mapPanel.map.addControl(new App.Snapping({
            layer: osm,
            targets: [osm],
            autoActivate: true
        }));
    },

    update: function(e) {
        // var fl = e.features;
        // manage delete, ...
        if (!this.updating) {
            this.updating = true;
            if (e && e.feature) {
                f = e.feature;
                if (!f.osm_id) {
                    f.action = 'new';
                    f.osm_id = this.new_osm_id;
                    this.new_osm_id -= 1;
                    if (f.geometry.CLASS_NAME == "OpenLayers.Geometry.Point") {
                        f.type = 'node';
                        f.fid = "node." + f.osm_id;
                        f.geometry.osm_id = f.osm_id;
                        var snapped = this.target.mapPanel.map.getControlsByClass("App.Snapping")[0].snapped;
                        if (snapped && snapped.x == f.geometry.x && snapped.y == f.geometry.y) {
                            this.snappedList[snapped.x + 21000000 + snapped.y * 42000000] = snapped;
                            this.snappedPoint(f.geometry);
                        }
                    }
                    else {
                        f.type = 'way';
                        f.fid = "way." + f.osm_id;
                        f.geometry.getVertices().forEach(function(p) {
                            this.addFeatureToPoint(p)
                        }, this);
                    }
                } else {
                    if (f.action != 'new') {
                        f.action = 'modified';
                    }
                    if (f.geometry.CLASS_NAME != "OpenLayers.Geometry.Point") {
                        f.geometry.getVertices().forEach(function(p) {
                            if (!p.osm_id) {
                                this.addFeatureToPoint(p)
                            }
                        }, this);
                    }
                }
            }
/*                    var dirty = false;
            osm.features.sort(function (f1, f2) {
                t1 = 0
                if (f1.geometry.CLASS_NAME == 'OpenLayers.Geometry.Point') {
                    t1 = 3;
                }
                else if (f1.geometry.CLASS_NAME == 'OpenLayers.Geometry.LineString') {
                    t1 = 2
                }
                t2 = 0
                if (f2.geometry.CLASS_NAME == 'OpenLayers.Geometry.Point') {
                    t2 = 3;
                }
                else if (f2.geometry.CLASS_NAME == 'OpenLayers.Geometry.LineString') {
                    t2 = 2
                }
                dirty = dirty || (t1 != t2);
                return t2 - t1;
            });*/
            this.target.mapPanel.depandancies = {};
            var fl = osm.features;
            fl.forEach(function(f) {
                if (f.type != 'node') {
                    f.geometry.getVertices().forEach(function(p) {
                        this.addDep(f.osm_id, p.osm_id);
                    }, this);
                }
            }, this);
            this.snappedList = {};
            this.snappedIndices = [];
/*                    if (dirty) {
                osm.redraw();
            }*/
            this.updating = false;
        }
    },

    /** private */
    addDep: function (id1, id2) {
        if (this.target.mapPanel.depandancies[id1]) {
            if (this.target.mapPanel.depandancies[id1].indexOf(id2) < 0) {
                this.target.mapPanel.depandancies[id1].push(id2);
            }
        }
        else {
            this.target.mapPanel.depandancies[id1] = [id2];
        }
        if (this.target.mapPanel.depandancies[id2]) {
            if (this.target.mapPanel.depandancies[id2].indexOf(id1) < 0) {
                this.target.mapPanel.depandancies[id2].push(id1);
            }
        }
        else {
            this.target.mapPanel.depandancies[id2] = [id1];
        }
    },

    /** private */
    addFeatureToPoint: function(p) {
        if (!p.osm_id) {
            if (this.snappedPoint(p)) {
                var feat = new OpenLayers.Feature.Vector();
                feat.geometry = p;
                feat.osm_id = this.new_osm_id;
                p.osm_id = this.new_osm_id;
                this.new_osm_id -= 1;
                feat.type = "node";
                feat.fid = "node." + feat.osm_id;
                feat.action = 'new';
                this.target.mapPanel.map.getLayersByName("OSM")[0].addFeatures([feat]);
            }
        }
    },

    /** private */
    snappedPoint: function(p) {
        var snapped = this.snappedList[p.x + 21000000 + p.y * 42000000];
        if (snapped) {
            if (snapped && snapped.x == p.x && snapped.y == p.y) {
                for (var i = 0, len = snapped.toFeatures.length ; i < len ; i++) {
                    var f = snapped.toFeatures[i];
                    var index = snapped.toIndices[i];
                    var oldIndex = index;
                    var dist = snapped.toIndicesDistance[i];
                    if (f.geometry.CLASS_NAME != "OpenLayers.Geometry.Point") {
                        if (this.snappedIndices[f.fid]) {
                            this.snappedIndices.forEach(function (a) {
                                if (a[0] < oldIndex) {
                                    index += 1;
                                }
                                else if (a[0] == oldIndex && a[1] < dist) {
                                    index += 1;
                                }
                            });
                        }
                        else {
                            this.snappedIndices[f.fid] = [];
                        }
                        this.snappedIndices[f.fid].push([oldIndex, dist]);
                    }
                    if (f.geometry.CLASS_NAME == "OpenLayers.Geometry.Point") {
                        var components = p.parent.components;
                        for (var i = 0, len = components.length ; i < len ; i++) {
                            if (components[i].x == f.geometry.x && components[i].y == f.geometry.y) {
                                components[i] = f.geometry;
                            }
                        }
                        return false;
                    }
                    else if (f.geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon") {
                        f.geometry.components[0].addComponent(p, index + 1);
                    }
                    else {
                        f.geometry.addComponent(p, index + 1);
                    }
                }
            }
        }
        return true;
    }
});

Ext.preg(App.Layer.prototype.ptype, App.Layer);
