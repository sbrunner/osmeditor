
/*
 * License: GPL (transformed from JOSM).
 *
 * @requires plugins/Tool.js
 * @include App/CombinedUndo.js
 */

Ext.namespace("App.Action");

App.Action.Orthogonalize = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_orthogonalize",

    text: OpenLayers.i18n("Orthogonalize"),

    usage: OpenLayers.i18n("When one or more ways are selected, the shape is adjusted such, that all angles are 90 or 180 degrees.\n" +
            "You can add two nodes to the selection. Then, the direction is fixed by these two reference nodes. " +
            "(Afterwards, you can undo the movement for certain nodes:\n" +
            "Select them and press the shortcut for Orthogonalize / Undo.)"),

    // within a way
    innerTolerance: null,
    // ways relative to each other
    outerTolerance: null,

    nbDirections: 4,

    directionAngle: null,

    /** private: method[constructor]
     */
    constructor: function(config) {
        if (config && config.nbDirections) {
            this.nbDirections = config.nbDirections;
        }
        this.innerTolerance = Math.PI / this.nbDirections;
        this.outerTolerance = Math.PI / this.nbDirections;
        this.directionAngle = Math.PI / this.nbDirections * 2;
        App.Action.Orthogonalize.superclass.constructor.apply(this, arguments);
    },

    /** api: method[addActions]
     */
    addActions: function() {
        var actions = [new Ext.Action(this)];
        return App.Action.Orthogonalize.superclass.addActions.apply(this, [actions]);
    },

    handler: function() {
        var sel = this.target.mapPanel.osm.selectedFeatures;
        var undo = this.ortho(sel);
        this.target.mapPanel.undoList.push(undo);

    },

    ortho: function(sel) {
        var nodeList = [];
        var wayDataList = [];

        // collect nodes and ways from the selection
        sel.forEach(function (p) {
            if (p.geometry.CLASS_NAME == "OpenLayers.Geometry.Point") {
                nodeList.push(p.geometry);
            }
            else if (p.geometry.CLASS_NAME == "OpenLayers.Geometry.LineString" ||
                    p.geometry.CLASS_NAME == "OpenLayers.Geometry.LinearRing") {
                wayDataList.push({
                    way: p,
                    nodes: p.geometry.components
                });
            }
            else {
                wayDataList.push({
                    way: p,
                    nodes: p.geometry.components[0].components
                });
            }
        }, this);
        if (wayDataList.length == 0) {
            alert(this.usage);
            throw "wrong selection";
        }

        if (nodeList.length == 2 || nodeList.length == 0) {
            var undo = new App.CombinedUndo();

            if (nodeList.length == 2) {  // fixed direction
                undo.list = undo.list.concat(this.orthogonalize(wayDataList, nodeList));
            }
            else if (nodeList.length == 0) {
                var groups = this.buildGroups(wayDataList);
                groups.forEach(function(g) {
                    undo.list = undo.list.concat(this.orthogonalize(g, nodeList));
                }, this);
            }

            return undo;
        }
        else {
            alert(this.usage);
            throw "wrong selection";
        }
    },

    /**
     * Collect groups of ways with common nodes in order to orthogonalize each group separately.
     */
    buildGroups: function(wayDataList) {
        var groups = [];
        var remaining = [].concat(wayDataList);
        while (!remaining.length == 0) {
            var group = [];
            groups.push(group);
            var next = remaining.pop();
            this.extendGroupRec(group, next, [].concat(remaining));
            group.forEach(function(g) {
                OpenLayers.Util.removeItem(remaining, group);
            }, this);
        }
        return groups;
    },

    extendGroupRec: function(group, newGroupMember, remaining) {
        group.push(newGroupMember);
        for (var i = 0 ; i < remaining.length ; ++i) {
            var candidate = remaining[i];
            if (candidate == null) {
                continue;
            }
            if (!this.arrayDisjoint(candidate.nodes, newGroupMember.nodes)) {
                remaining[i] = null;
                this.extendGroupRec(group, candidate, remaining);
            }
        }
    },

    arrayDiff: function(array, otherArray) {
        var diff = [], found;
        for (var i=0; i<array.length; i++) {
            found = false;
            for (var j=0; j<otherArray.length; j++) {
                if (array[i] == otherArray[j]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                diff.push(this[i]);
            }
        }
        return diff;
    },

    arrayDisjoint: function(array, otherArray) {
        return this.arrayDiff(array, otherArray).length == 0;
    },

    /**
     *  Outline:
     *  1. Find direction of all segments
     *      - direction = 0..3 (right,up,left,down)
     *      - right is not really right, you may have to turn your screen
     *  2. Find average heading of all segments
     *      - heading = angle of a vector in polar coordinates
     *      - sum up horizontal segments (those with direction 0 or 2)
     *      - sum up vertical segments
     *      - turn the vertical sum by 90 degrees and add it to the horizontal sum
     *      - get the average heading from this total sum
     *  3. Rotate all nodes by the average heading so that right is really right
     *      and all segments are approximately NS or EW.
     *  4. If nodes are connected by a horizontal segment: Replace their y-Coordinate by
     *      the mean value of their y-Coordinates.
     *      - The same for vertical segments.
     *  5. Rotate back.
     *
     */
    orthogonalize: function(wayDataList, headingNodes) {
        // find average heading
        var headingAll;
        if (headingNodes.length == 0) {
            // find directions of the segments and make them consistent between different ways
            this.calcDirections(wayDataList[0], 0);
            var refHeading = wayDataList[0].heading;
            wayDataList.forEach(function(w) {
                this.calcDirections(w, 0);
                var directionOffset = this.angleToDirectionChange(w.heading - refHeading, this.outerTolerance);
                this.calcDirections(w, this.changeDirectionBy(0, directionOffset));
                if (this.angleToDirectionChange(refHeading - w.heading, this.outerTolerance) != 0) {
                    throw "error 1";
                }
            }, this);
            var totSum = {x: 0, y: 0};
            wayDataList.forEach(function(w) {
                totSum = this.sum(totSum, w.segSum);
            }, this);
            headingAll = this.polar({x: 0., y: 0.}, totSum);
        }
        else {
            headingAll = this.polar(headingNodes[0], headingNodes[1]);
            wayDataList.forEach(function(w) {
                this.calcDirections(w, 0);
                var directionOffset = this.angleToDirectionChange(w.heading - headingAll, this.outerTolerance);
                this.calcDirections(w, this.changeDirectionBy(0, directionOffset));
            }, this);
        }

        // put the nodes of all ways in a set
        var allNodes = [];
        wayDataList.forEach(function(w) {
            allNodes = allNodes.concat(w.nodes);
        }, this);

        // the new x and y value for each node
        var nXY = {};

        // calculate the centroid of all nodes
        // it is used as rotation center
        var pivot = {x: 0., y: 0.};
        allNodes.forEach(function(n) {
            pivot = this.sum(pivot, n);
        }, this);
        pivot = {x: pivot.x / allNodes.length, y: pivot.y / allNodes.length};

        // rotate
        allNodes.forEach(function(n) {
            var tmp = this.rotate_cc(pivot, n, - headingAll);
            nXY[n.id] = {
                directionsValues: [],
                directionsErrors: [],
                point: tmp
            }
            for (var i = 0 ; i < this.nbDirections / 2 ; i++) {
                var t = this.rotate_cc({x: 0., y: 0.}, tmp, i * this.directionAngle + Math.PI / 2);
                nXY[n.id].directionsValues[i] = t.x;
                nXY[n.id].directionsErrors[i] = Number.POSITIVE_INFINITY;
            }
        }, this);

        // orthogonalize
        for (var orientation = 0 ; orientation < this.nbDirections / 2 ; orientation++) {
            var s = [].concat(allNodes);
            var s_size = s.length;
            for (var dummy = 0; dummy < s_size; ++dummy) {
                if (s.length == 0) {
                    break;
                }
                var dummy_n = s[0];

                // will contain each node that can be reached from dummy_n
                // walking only on horizontal / vertical segments
                var cs = [dummy_n];

                var somethingHappened = true;
                while (somethingHappened) {
                    somethingHappened = false;
                    wayDataList.forEach(function(w) {
                        for (var i=0; i < w.nSeg; ++i) {
                            var n1 = w.nodes[i];
                            var n2 = w.nodes[i+1];
                            if (w.segDirections[i] === orientation || w.segDirections[i] === orientation + this.nbDirections / 2) {
                                if (OpenLayers.Util.indexOf(cs, n1) >= 0 && OpenLayers.Util.indexOf(cs, n2) < 0) {
                                    cs.push(n2);
                                    somethingHappened = true;
                                }
                                if (OpenLayers.Util.indexOf(cs, n2) >= 0 && OpenLayers.Util.indexOf(cs, n1) < 0) {
                                    cs.push(n1);
                                    somethingHappened = true;
                                }
                            }
                        }
                    }, this);
                }

                if (cs.length > 1) {
                    var average = 0;
                    cs.forEach(function(n) {
                        average += nXY[n.id].directionsValues[orientation];
                    }, this);
                    average = average / cs.length;

                    // if one of the nodes is a heading node, forget about the average and use its value
                    headingNodes.forEach(function(fn) {
                        if (OpenLayers.Util.indexOf(cs, fn) >= 0) {
                            average = nXY[fn.id].directionsValues[orientation];
                        }
                    }, this);

                    cs.forEach(function(n) {
                        nXY[n.id].directionsErrors[orientation] = average - nXY[n.id].directionsValues[orientation];
                    }, this);
                }

                cs.forEach(function(n) {
                    OpenLayers.Util.removeItem(s, n);
                }, this);
            }
            if (!s.length == 0) {
                throw "error 4";
            }
        }

        // rotate back and log the change
        commands = [];
        allNodes.forEach(function(n) {
            var nxy = nXY[n.id];
            var d1, d2;
            var e1 = Number.POSITIVE_INFINITY;
            var e2 = Number.POSITIVE_INFINITY;
            for (var d = 0 ; d < this.nbDirections / 2 ; d++) {
                var e = Math.abs(nxy.directionsErrors[d]);
                if (e < e1) {
                    e2 = e1;
                    d2 = d1;
                    e1 = e;
                    d1 = d;
                }
                else if (e < e2) {
                    e2 = e;
                    d2 = d;
                }
            }

            var c1 = this.getCorection(nxy.directionsErrors[d1], d1, d2);
            var c2 = this.getCorection(nxy.directionsErrors[d2], d2, d1);
            var tmp = this.sum(this.sum(nxy.point, c1), c2);
            tmp = this.rotate_cc(pivot, tmp, headingAll);

            var dx = tmp.x - n.x;
            var dy = tmp.y - n.y;
            n.move(dx, dy);
            if (this.target) {
                var feature = this.target.mapPanel.getFeature(n.osm_id);
                this.target.mapPanel.drawFeature(feature);
            }

            commands.push({
                undo: function(mapPanel) {
                    feature.geometry.move(-dx, -dy);
                    mapPanel.drawFeature(feature);
                }
            });
        }, this);
        return commands;
    },

    getCorection: function(e, d, dp) {
        if (d === undefined) {
            return {x: 0., y: 0.};
        }
        if (dp === undefined) {
            return this.rotate_cc({x: 0., y: 0.}, {x: 0, y: -e}, -this.directionAngle * d);
        }
        var a = (d - dp) * this.directionAngle;
        if (a < 0) {
            a = -a;
            dp += this.nbDirections / 2;
        }
        var coor = Math.sin(a);
        return this.rotate_cc({x: 0., y: 0.}, {x: -e * coor, y: 0.}, -this.directionAngle * dp);
    },

    /**
     * Estimate the direction of the segments, given the first segment povar s in the
     * direction <code>pInitialDirection</code>.
     * Then sum up all horizontal / vertical segments to have a good guess for the
     * heading of the entire way.
     */
    calcDirections: function(way, pInitialDirection) {
        way.nNode = way.nodes.length;
        way.nSeg = way.nNode - 1;

        en = [];
        for (var i=0; i < way.nNode; i++) {
            en[i] = {x: way.nodes[i].x, y: way.nodes[i].y};
        }
        way.segDirections = [];
        var direction = pInitialDirection;
        way.segDirections[0] = direction;
        for (var i=0; i < way.nSeg - 1; i++) {
            var h1 = this.polar(en[i],en[i+1]);
            var h2 = this.polar(en[i+1],en[i+2]);
            direction = this.changeDirectionBy(direction, this.angleToDirectionChange(h2 - h1, this.outerTolerance));
            way.segDirections[i+1] = direction;
        }

        // sum up segments
        var hv = []
        for (var i = 0 ; i < this.nbDirections ; i++) {
            hv[i] = {x: 0., y: 0.};
        }
        for (var i = 0; i < way.nSeg; ++i) {
            var segment = this.diff(en[i+1], en[i]);
            var dir = way.segDirections[i];
            hv[dir] = this.sum(hv[dir], segment);
        }

        // rotate the vertical vector by 90 degrees (clockwise) and add it to the horizontal vector
        way.segSum = {x: 0., y: 0.};
        for (var i = 0 ; i < this.nbDirections ; i++) {
            way.segSum = this.sum(way.segSum, this.rotate_cc({x: 0., y: 0.}, hv[i], i * this.directionAngle));
        }
        way.heading = this.polar({x: 0., y: 0.}, way.segSum);
    },

    /**
     * Make sure angle (up to 2*Pi) is in var erval [ 0, 2*Pi ).
     */
    standard_angle_0_to_2PI: function(a) {
        while (a >= 2 * Math.PI) {
            a -= 2 * Math.PI;
        }
        while (a < 0) {
            a += 2 * Math.PI;
        }
        return a;
    },

    /**
     * Make sure angle (up to 2*Pi) is in var erval ( -Pi, Pi ].
     */
    standard_angle_mPI_to_PI: function(a) {
        while (a > Math.PI) {
            a -= 2 * Math.PI;
        }
        while (a <= - Math.PI) {
            a += 2 * Math.PI;
        }
        return a;
    },

    /**
     * Recognize angle to be approximately 0, 90, 180 or 270 degrees.
     * returns an var egral value, corresponding to a counter clockwise turn:
     */
    angleToDirectionChange: function(a, deltaMax) {
        a = this.standard_angle_mPI_to_PI(a);

        var dirChange;
        for (var i = 0 ; i < this.nbDirections ; i++) {
            var d = Math.abs(this.standard_angle_mPI_to_PI(a + i * this.directionAngle));
            if (d < deltaMax) {
                dirChange = i;
                break;
            }
        }
        return dirChange;
    },

    changeDirectionBy: function(direction, directionChange) {
        tmp = (direction + directionChange) % this.nbDirections;
        // the % operator can return negative value
        if (tmp < 0) {
            tmp += this.nbDirections;
        }
        return tmp;
    },

    // rotate counter-clock-wise
    rotate_cc: function(pivot, en, angle) {
        var cosPhi = Math.cos(angle);
        var sinPhi = Math.sin(angle);
        var x = en.x - pivot.x;
        var y = en.y - pivot.y;
        var nx =  cosPhi * x - sinPhi * y + pivot.x;
        var ny =  sinPhi * x + cosPhi * y + pivot.y;
        return {x: nx, y: ny};
    },
    sum: function(en1, en2) {
        return {x: en1.x + en2.x, y: en1.y + en2.y};
    },
    diff: function(en1, en2) {
        return {x: en1.x - en2.x, y: en1.y - en2.y};
    },
    polar: function(en1, en2) {
        return Math.atan2(en2.y - en1.y, en2.x -  en1.x);
    }
});

Ext.preg(App.Action.Orthogonalize.prototype.ptype, App.Action.Orthogonalize);

/*
 * @requ ires OpenLayers/Format/WKT.js
 */
/*
var o90 = new App.Action.Orthogonalize();
var o60 = new App.Action.Orthogonalize({nbDirections: 6});
var o45 = new App.Action.Orthogonalize({nbDirections: 8});
var o30 = new App.Action.Orthogonalize({nbDirections: 12});

console.log("(-1, -1)");
console.log(o45.getCorection(1, 0, 1)); // (-1, -1)
console.log("(0, -1)");
console.log(o45.getCorection(1, 0, 2)); // (0, -1)
console.log("(1, -1)");
console.log(o45.getCorection(1, 0, 3)); // (1, -1)

console.log("(-1.4, 0)");
console.log(o45.getCorection(1, 1, 0)); // (-1.4, 0)
console.log("(-1, 0)");
console.log(o45.getCorection(1, 2, 0)); // (-1, 0)
console.log("(-1.4, 0)");
console.log(o45.getCorection(1, 3, 0)); // (-1.4, 0)

console.log("(1, 1)");
console.log(o45.getCorection(-1, 0, 1)); // (1, 1)
console.log("(0, 1)");
console.log(o45.getCorection(-1, 0, 2)); // (0, 1)
console.log("(-1, 1)");
console.log(o45.getCorection(-1, 0, 3)); // (-1, 1)

console.log("(1.4, 0)");
console.log(o45.getCorection(-1, 1, 0)); // (1.4, 0)
console.log("(1, 0)");
console.log(o45.getCorection(-1, 2, 0)); // (1, 0)
console.log("(1.4, 0)");
console.log(o45.getCorection(-1, 3, 0)); // (1.4, 0)
console.log();

var way = new OpenLayers.Feature.Vector(
new OpenLayers.Geometry.Polygon([
new OpenLayers.Geometry.LinearRing([
new OpenLayers.Geometry.Point(0,0),
new OpenLayers.Geometry.Point(0,1),
new OpenLayers.Geometry.Point(0.9,1.1),
new OpenLayers.Geometry.Point(1,0)
])]));
console.log(way.geometry.toString());
o90.ortho([way,
new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(0,0)),
new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(1,0))
])
console.log(way.geometry.toString());
console.log("POLYGON((0 0,0 1.05,0.95 1.05,0.95 0,0 0))");
console.log();

var way = new OpenLayers.Feature.Vector(
new OpenLayers.Geometry.Polygon([
new OpenLayers.Geometry.LinearRing([
new OpenLayers.Geometry.Point(0,0),
new OpenLayers.Geometry.Point(0,1),
new OpenLayers.Geometry.Point(0.9,1.1),
new OpenLayers.Geometry.Point(1,0)
])]));
console.log(way.geometry.toString());
o45.ortho([way,
new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(0,0)),
new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(1,0))
])
console.log(way.geometry.toString());
console.log("POLYGON((0 0,0 1.05,0.95 1.05,0.95 0,0 0))");
console.log();


var way = new OpenLayers.Feature.Vector(
new OpenLayers.Geometry.Polygon([
new OpenLayers.Geometry.LinearRing([
new OpenLayers.Geometry.Point(0,0),
new OpenLayers.Geometry.Point(0,1),
new OpenLayers.Geometry.Point(0.9,1.1),
new OpenLayers.Geometry.Point(1,0)
])]));
console.log(way.geometry.toString());
o90.ortho([way])
console.log(way.geometry.toString());

var way = new OpenLayers.Feature.Vector(
new OpenLayers.Geometry.Polygon([
new OpenLayers.Geometry.LinearRing([
new OpenLayers.Geometry.Point(0,0),
new OpenLayers.Geometry.Point(0,1),
new OpenLayers.Geometry.Point(0.9,1.1),
new OpenLayers.Geometry.Point(1,0)
])]));
console.log(way.geometry.toString());
o45.ortho([way])
console.log(way.geometry.toString());
*/
