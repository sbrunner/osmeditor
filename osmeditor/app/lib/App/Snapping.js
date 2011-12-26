
/*
 * @requires OpenLayers/Control/Snapping.js
 */

Ext.namespace("App");

App.Snapping = OpenLayers.Class(OpenLayers.Control.Snapping, {

    snapped: null,

    testTarget: function(target, loc) {
        var resolution = this.layer.map.getResolution();
        if ("minResolution" in target) {
            if (resolution < target.minResolution) {
                return null;
            }
        }
        if ("maxResolution" in target) {
            if (resolution >= target.maxResolution) {
                return null;
            }
        }
        var tolerance = {
            node: this.getGeoTolerance(target.nodeTolerance, resolution),
            vertex: this.getGeoTolerance(target.vertexTolerance, resolution),
            edge: this.getGeoTolerance(target.edgeTolerance, resolution)
        };
        // this could be cached if we don't support setting tolerance values directly
        var maxTolerance = Math.max(
            tolerance.node, tolerance.vertex, tolerance.edge
        );
        var result = {
            rank: Number.POSITIVE_INFINITY, dist: Number.POSITIVE_INFINITY
        };
        var eligible = false;
        var features = target.layer.features;
        var feature, type, vertices, vertex, closest, dist, found;
        var numTypes = this.precedence.length;
        var ll = new OpenLayers.LonLat(loc.x, loc.y);
        for (var i=0, len=features.length; i<len; ++i) {
            feature = features[i];
            if (feature !== this.feature && !feature._sketch &&
               feature.state !== OpenLayers.State.DELETE &&
               (!target.filter || target.filter.evaluate(feature))) {
                if (feature.atPoint(ll, maxTolerance, maxTolerance)) {
                    for (var j=0, stop=Math.min(result.rank+1, numTypes); j<stop; ++j) {
                        type = this.precedence[j];
                        if (target[type]) {
                            if (type === "edge") {
                                closest = feature.geometry.distanceTo(loc, {details: true});
                                dist = closest.distance;
                                var pointFind = false;

                                if (eligible && result.toFeatures.length == 1) {
                                    points = this.crossing(result.toFeatures[0].geometry, feature.geometry);
                                    points.forEach(function(point) {
                                        var pointClosest = point === true ? closest : point.distanceTo(loc, {details: true});
                                        var pointDist = pointClosest.distance;
                                        if (pointDist <= tolerance['node']) {
                                            result = {
                                                toFeatures: [feature, result.toFeatures[0]],
                                                toIndices: [closest.index, result.toIndices[0]],
                                                toIndicesDistance: [closest.indexDistance, result.toIndicesDistance[0]],
                                                rank: j, dist: dist,
                                                x: pointClosest.x0, y: pointClosest.y0 // closest coords on feature
                                            };
                                            eligible = true;
                                            pointFind = true;
                                        }
                                    }, this);
                                }
                                if (pointFind) {
                                    // don't look for lower precedence types for this feature
                                    break;
                                }

                                if (dist <= tolerance[type] && dist < result.dist) {
                                    result = {
                                        toFeatures: [feature],
                                        toIndices: [closest.index],
                                        toIndicesDistance: [closest.indexDistance],
                                        rank: j, dist: dist,
                                        x: closest.x0, y: closest.y0 // closest coords on feature
                                    };
                                    eligible = true;
                                }
                            } else {
                                // look for nodes or vertices
                                vertices = feature.geometry.getVertices(type === "node");
                                found = false;
                                for (var k=0, klen=vertices.length; k<klen; ++k) {
                                    vertex = vertices[k];
                                    dist = vertex.distanceTo(loc);
                                    if (dist <= tolerance[type] &&
                                            (j < result.rank || (j === result.rank && dist < result.dist))) {
                                        result = {
                                            toFeatures: [feature],
                                            toIndices: [k],
                                            toIndicesDistance: [0],
                                            rank: j, dist: dist,
                                            x: vertex.x, y: vertex.y
                                        };
                                        eligible = true;
                                        found = true;
                                    }
                                }
                                if (found) {
                                    // don't look for lower precedence types for this feature
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
        if (eligible) {
            this.snapped = result;
        }
        return eligible ? result : null;
    },

    /** private */
    crossing: function(source, target) {
        var results = [];
        if ((source instanceof OpenLayers.Geometry.LineString || source instanceof OpenLayers.Geometry.LinearRing) &&
                (target instanceof OpenLayers.Geometry.LineString || target instanceof OpenLayers.Geometry.LinearRing)) {
            var verts = source.components;
            for (var i=0, stop=verts.length-2; i<=stop; ++i) {
                var vert1 = verts[i];
                var vert2 = verts[i+1];
                var seg = {
                    x1: vert1.x, y1: vert1.y,
                    x2: vert2.x, y2: vert2.y
                };
                results = results.concat(this.crossWithSegment(seg, target.components));
            }
        } else {
            if ((source instanceof OpenLayers.Geometry.LineString || source instanceof OpenLayers.Geometry.LinearRing)
                    && target instanceof OpenLayers.Geometry.Collection) {
                target.components.forEach(function(g) {
                    results = results.concat(this.crossing(source, g));
                }, this);
            }
            else if (source instanceof OpenLayers.Geometry.Collection) {
                source.components.forEach(function(g) {
                    results = results.concat(this.crossing(g, target));
                }, this);
            }
        }
        return results;
    },

    crossWithSegment: function(seg, verts) {
        var result = [];

        for (var i=0, stop=verts.length-2; i<=stop; ++i) {
            var vert1 = verts[i];
            var vert2 = verts[i+1];
            var target = {x1: vert1.x, y1: vert1.y, x2: vert2.x, y2: vert2.y};
            point = OpenLayers.Geometry.segmentsIntersect(seg, target, {point: true});
            if (point) {
                result.push(point);
            }
        }
        return result;
    },

    CLASS_NAME: "App.Snapping"
});

