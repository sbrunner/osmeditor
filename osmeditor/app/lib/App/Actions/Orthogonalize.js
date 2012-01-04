
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

    // within a way
    TOLERANCE1: Math.PI/4,
    // ways relative to each other
    TOLERANCE2: Math.PI/4,

    RIGHT: 0,
    UP: 1,
    LEFT: 2,
    DOWN: 3,


    /** api: method[addActions]
     */
    addActions: function() {
        var actions = [new Ext.Action(this)];
        return App.Action.Orthogonalize.superclass.addActions.apply(this, [actions]);
    },

    handler: function() {
        var nodeList = [];
        var wayDataList = [];
        var sel = this.target.mapPanel.osm.selectedFeatures;

        // collect nodes and ways from the selection
        sel.forEach(function (p) {
            if (p.geometry.CLASS_NAME == "OpenLayers.Geometry.Point") {
                nodeList.push(p.geometry);
            }
            else if (p.geometry.CLASS_NAME == "OpenLayers.Geometry.LineString") {
                wayDataList.push({
                    way: p,
                    nodes: p.geometry.components
                });
            } else {
                wayDataList.push({
                    way: p,
                    nodes: p.geometry.components[0].components
                });
            }
        }, this);
        if (wayDataList.length == 0) {
            alert(OpenLayers.i18n("When one or more ways are selected, the shape is adjusted such, that all angles are 90 or 180 degrees.\n" +
                    "You can add two nodes to the selection. Then, the direction is fixed by these two reference nodes. " +
                    "(Afterwards, you can undo the movement for certain nodes:\n" +
                    "Select them and press the shortcut for Orthogonalize / Undo.)"));
            return;
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

            this.target.mapPanel.undoList.push(undo);
        }
        else {
            alert(OpenLayers.i18n("When one or more ways are selected, the shape is adjusted such, that all angles are 90 or 180 degrees.\n" +
                    "You can add two nodes to the selection. Then, the direction is fixed by these two reference nodes. " +
                    "(Afterwards, you can undo the movement for certain nodes:\n" +
                    "Select them and press the shortcut for Orthogonalize / Undo.)"));
            return;
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
        remaining.forEach(function(candidate) {
            if (candidate == null) {
                return;
            }
            if (!arrayDisjovar (candidate.way.components, newGroupMember.way.nodes)) {
                remaining.set(i, null);
                extendGroupRec(group, candidate, remaining);
            }
        }, this);
        for (var i = 0; i < remaining.length; ++i) {
            var candidate = remaining[i];
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
            this.calcDirections(wayDataList[0], this.RIGHT);
            var refHeading = wayDataList[0].heading;
            wayDataList.forEach(function(w) {
                this.calcDirections(w, this.RIGHT);
                var directionOffset = this.angleToDirectionChange(w.heading - refHeading, this.TOLERANCE2);
                this.calcDirections(w, this.changeDirectionBy(this.RIGHT, directionOffset));
                if (this.angleToDirectionChange(refHeading - w.heading, this.TOLERANCE2) != 0) {
                    throw "error 1";
                }
            }, this);
            var totSum = { x: 0, y: 0};
            wayDataList.forEach(function(w) {
                totSum = this.sum(totSum, w.segSum);
            }, this);
            headingAll = this.polar({x: 0., y: 0.}, totSum);
        }
        else {
            headingAll = this.polar(headingNodes[0], headingNodes[1]);
            wayDataList.forEach(function(w) {
                this.calcDirections(w, this.RIGHT);
                var directionOffset = this.angleToDirectionChange(w.heading - headingAll, this.TOLERANCE2);
                this.calcDirections(w, this.changeDirectionBy(this.RIGHT, directionOffset));
            }, this);
        }

        // put the nodes of all ways in a set
        var allNodes = [];
        wayDataList.forEach(function(w) {
            allNodes = allNodes.concat(w.nodes);
        }, this);

        // the new x and y value for each node
        var nX = {};
        var nY = {};

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
            nX[n.osm_id] = tmp.x;
            nY[n.osm_id] = tmp.y;
        }, this);

        // orthogonalize
        var HORIZONTAL = [this.RIGHT, this.LEFT];
        var VERTICAL = [this.UP, this.DOWN];
        var ORIENTATIONS = [HORIZONTAL, VERTICAL];
        ORIENTATIONS.forEach(function(orientation) {
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
                            if (OpenLayers.Util.indexOf(orientation, w.segDirections[i]) >= 0) {
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

                var nC = (orientation == HORIZONTAL) ? nY : nX;

                var average = 0;
                cs.forEach(function(n) {
                    average += nC[n.osm_id];
                }, this);
                average = average / cs.length;

                // if one of the nodes is a heading node, forget about the average and use its value
                headingNodes.forEach(function(fn) {
                    if (OpenLayers.Util.indexOf(cs, fn) >= 0) {
                        average = nC[fn.osm_id];
                    }
                }, this);

                cs.forEach(function(n) {
                    nC[n.osm_id] = average;
                }, this);

                cs.forEach(function(n) {
                    s.remove(n);
                }, this);
            }
            if (!s.length == 0) throw new RuntimeException();
        }, this);

        // rotate back and log the change
        commands = [];
        allNodes.forEach(function(n) {
            var tmp = {x: nX[n.osm_id], y: nY[n.osm_id]};
            tmp = this.rotate_cc(pivot, tmp, headingAll);
            var dx = tmp.x - n.x;
            var dy = tmp.y - n.y;
            if (OpenLayers.Util.indexOf(headingNodes, n) >= 0) { // The heading nodes should not have changed
                var EPSILON = 1E-6;
                if (Math.abs(dx) > Math.abs(EPSILON * tmp.x) ||
                        Math.abs(dy) > Math.abs(EPSILON * tmp.x))
                    throw "error 2";
            }
            else {
                console.log(1111)
                console.log(dx)
                console.log(dy)
                var feature = this.target.mapPanel.getFeature(n.osm_id);
                feature.geometry.move(dx, dy);
                this.target.mapPanel.drawFeature(feature);
                commands.push({
                    undo: function(mapPanel) {
                        feature.geometry.move(-dx, -dy);
                        mapPanel.drawFeature(feature);
                    }
                });
            }
        }, this);
        return commands;
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
            direction = this.changeDirectionBy(direction, this.angleToDirectionChange(h2 - h1, this.TOLERANCE1));
            way.segDirections[i+1] = direction;
        }

        // sum up segments
        var h = {x: 0., y: 0.};
        //var lh = this.abs(h);
        var v = {x: 0., y: 0.};
        //var lv = this.abs(v);
        for (var i = 0; i < way.nSeg; ++i) {
            var segment = this.diff(en[i+1], en[i]);
            if (way.segDirections[i] == this.RIGHT) {
                h = this.sum(h,segment);
            }
            else if (way.segDirections[i] == this.UP) {
                v = this.sum(v,segment);
            }
            else if (way.segDirections[i] == this.LEFT) {
                h = this.diff(h,segment);
            }
            else if (way.segDirections[i] == this.DOWN) {
                v = this.diff(v,segment);
            }
            else {
                throw "error 3";
            }
            /**
             * When summing up the length of the sum vector should increase.
             * However, it is possible to construct ways, such that this assertion fails.
             * So only uncomment this for testing
             **/
            //                if (segDirections[i].ordinal() % 2 == 0) {
            //                    if (this.abs(h) < lh) throw new AssertionError();
            //                    lh = this.abs(h);
            //                } else {
            //                    if (this.abs(v) < lv) throw new AssertionError();
            //                    lv = this.abs(v);
            //                }
        }
        // rotate the vertical vector by 90 degrees (clockwise) and add it to the horizontal vector
        way.segSum = this.sum(h, {x: v.y, y: - v.x});
        //            if (this.abs(this.segSum) < lh) throw new AssertionError();
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
        var d0 = Math.abs(a);
        var d90 = Math.abs(a - Math.PI / 2);
        var d_m90 = Math.abs(a + Math.PI / 2);
        var dirChange;
        if (d0 < deltaMax) {
            dirChange =  0;
        }
        else if (d90 < deltaMax) {
            dirChange =  1;
        }
        else if (d_m90 < deltaMax) {
            dirChange = -1;
        }
        else {
            a = this.standard_angle_0_to_2PI(a);
            var d180 = Math.abs(a - Math.PI);
            if (d180 < deltaMax) {
                dirChange = 2;
            }
            else {
                return Number.NaN;
            }
        }
        return dirChange;
    },

    changeDirectionBy: function(direction, directionChange) {
        tmp = (direction + directionChange) % 4;
        if (tmp < 0) {
            tmp += 4;          // the % operator can return negative value
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
