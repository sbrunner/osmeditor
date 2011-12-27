
/*
 * @requires GeoExt/widgets/MapPanel.js
 */

Ext.namespace("App");

App.Map = Ext.extend(GeoExt.MapPanel, {
    xtype: "osm_map",

    /* the used display projection */
    displayProjection: null,

    deletedFeatures: [],

    new_osm_id: -1,

    /** private */
    // true when we redraw depandancies
    updating: false,

    /** private */
    snappedList: {},
    /** private */
    snappedIndices: {},

    depandancies: {},

    /** private: method[initComponent]
     *  Initializes the map panel. Creates an OpenLayers map if
     *  none was provided in the config options passed to the
     *  constructor.
     */
    initComponent: function() {
        App.Map.superclass.initComponent.call(this);
        this.map.displayProjection = this.displayProjection;
        delete this.displayProjection;

        var styleMap = new OpenLayers.StyleMap(null, {
            createSymbolizer: function(feature, intent) {
                if (intent == 'select' && feature && feature.selectStyle) {
                    return feature.selectStyle;
                }
                else if ((!intent || intent == 'default') && feature && feature.defaultStyle) {
                    return feature.defaultStyle;
                }
                else {
                    return OpenLayers.StyleMap.prototype.createSymbolizer.apply(this, arguments);
                }
            }
        });
        this.addStyle('yellow', styleMap.styles["default"]);
        this.addStyle('blue', styleMap.styles["select"]);
        this.addStyle('green', styleMap.styles["temporary"]);

        this.bboxstrategie = new OpenLayers.Strategy.BBOX({
            ratio: 1.2,
            autoActivate: false,
            projection: epsg900913
        });

        osm = new OpenLayers.Layer.Vector("OSM", {
            projection: epsg900913,
            strategies: [this.bboxstrategie],
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

        osm.staticStyleMap = new OpenLayers.StyleMap();
        this.addStyle('yellow', osm.staticStyleMap.styles["default"]);
        this.addStyle('blue', osm.staticStyleMap.styles["select"]);
        this.addStyle('green', osm.staticStyleMap.styles["temporary"]);
        osm.staticStyleMap = OSM.Style.JOSM.getStyleMap(osm.staticStyleMap);
        osm.staticStyleMap = OSM.Style.Mapnik.getStyleMap(osm.staticStyleMap);

        osm.events.register('sketchcomplete', this, function(e) {
            this.update(e);
        });
        osm.events.register('sketchmodified', this, function(e) {
            if (e.feature.geometry.CLASS_NAME != "OpenLayers.Geometry.Point") {
                var snapped = this.map.getControlsByClass("App.Snapping")[0].snapped;
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

        this.map.addLayer(osm);

        this.map.addControl(new App.Snapping({
            layer: osm,
            targets: [osm],
            autoActivate: true
        }));
    },

    /** private: method[applyState]
     *  :param state: ``Object`` The state to apply.
     *
     *  Apply the state provided as an argument.
     */
    applyState: function(state) {
        this.center = new OpenLayers.LonLat(state.x, state.y).transform(
                this.map.displayProjection,
                this.map.projection);
        this.zoom = state.zoom;
    },

    /** private: method[getState]
     *  :return:  ``Object`` The state.
     *
     *  Returns the current state for the map panel.
     */
    getState: function() {
        var state;

        // Ext delays the call to getState when a state event
        // occurs, so the MapPanel may have been destroyed
        // between the time the event occurred and the time
        // getState is called
        if(!this.map) {
            return;
        }

        // record location and zoom level
        var center = this.map.getCenter().transform(
                this.map.projection,
                this.map.displayProjection);
        // map may not be centered yet, because it may still have zero
        // dimensions or no layers
        state = center ? {
            x: center.lon,
            y: center.lat,
            zoom: this.map.getZoom()
        } : {};

        return state;
    },

    addStyle: function(color, destination) {
        destination.addRules([new OpenLayers.Rule({
            symbolizer: {
                pointRadius: 3,
                fillOpacity: 1,
                fillColor: color,
                strokeOpacity: 0,
                strokeWidth: 20
            },
            filter: new OSM.Style.Utils.PointFilter()
        })]);
        destination.addRules([new OpenLayers.Rule({
            symbolizer: {
                pointRadius: 5,
                strokeColor: color,
                strokeWidth: 3
            },
            filter: new OSM.Style.Utils.PathFilter()
        })]);
        destination.addRules([new OpenLayers.Rule({
            symbolizer: {
                pointRadius: 5,
                fillOpacity: 0.4,
                fillColor: color,
                strokeColor: color,
                strokeWidth: 1
            },
            filter: new OSM.Style.Utils.PolygonFilter()
        })]);
    },

    update: function(e) {
        if (!this.updating) {
            this.updating = true;
            try {
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
                            var snapped = this.map.getControlsByClass("App.Snapping")[0].snapped;
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

                osm.features.forEach(function(f) {
                    if (!f.defautStyle) {
                        f.selectStyle = osm.staticStyleMap.createSymbolizer(f, "select");
                        f.defaultStyle = osm.staticStyleMap.createSymbolizer(f);
                    }
                }, this);

                var features = [].concat(osm.features); // clone
                var dirty = false;
                features.sort(function (f1, f2) {
                    var t1;
                    if (f1.geometry.CLASS_NAME == 'OpenLayers.Geometry.Point') {
                        t1 = 0;
                    }
                    else if (f1.geometry.CLASS_NAME == 'OpenLayers.Geometry.LineString') {
                        t1 = 1
                    }
                    else {
                        t1 = f1.geometry.getArea() / 30;
                    }
                    var t2;
                    if (f2.geometry.CLASS_NAME == 'OpenLayers.Geometry.Point') {
                        t2 = 0;
                    }
                    else if (f2.geometry.CLASS_NAME == 'OpenLayers.Geometry.LineString') {
                        t2 = 1
                    }
                    else {
                        t2 = f2.geometry.getArea() / 30;
                    }
                    var result = t2 - t1
                    dirty = dirty || result >= 1;
                    return result;
                });
                if (dirty) {
                    osm.removeAllFeatures();
                    osm.addFeatures(features);
                }

                this.depandancies = {};
                osm.features.forEach(function(f) {
                    if (f.type != 'node') {
                        f.geometry.getVertices().forEach(function(p) {
                            this.addDep(f.osm_id, p.osm_id);
                        }, this);
                    }
                }, this);
                this.snappedList = {};
                this.snappedIndices = [];
            }
            finally {
                this.updating = false;
            }
        }
    },

    /** private */
    addDep: function (id1, id2) {
        if (this.depandancies[id1]) {
            if (this.depandancies[id1].indexOf(id2) < 0) {
                this.depandancies[id1].push(id2);
            }
        }
        else {
            this.depandancies[id1] = [id2];
        }
        if (this.depandancies[id2]) {
            if (this.depandancies[id2].indexOf(id1) < 0) {
                this.depandancies[id2].push(id1);
            }
        }
        else {
            this.depandancies[id2] = [id1];
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
                this.map.getLayersByName("OSM")[0].addFeatures([feat]);
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
                            this.snappedIndices[f.fid].forEach(function (a) {
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
                        var dep = this.depandancies[p.osm_id];
                        var components = p.parent.components;
                        dep.forEach(function(d) {
                            var f2 = osm.getFeatureBy('osm_id', d);
                            if (f2.geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon") {
                                f2.geometry.components[0].components.forEach(function(d) {
                                    components[i] = f.geometry;
                                }, this);
                            }
                            else {
                                f2.geometry.components.forEach(function(d) {
                                    components[i] = f.geometry;
                                }, this);
                            }
                            dep.components
                        }, this);
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

Ext.reg(App.Map.prototype.xtype, App.Map);
