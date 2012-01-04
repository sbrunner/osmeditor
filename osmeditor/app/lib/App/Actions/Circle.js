
/*
 * @requires plugins/Tool.js
 * @include GeoExt/widgets/Action.js
 * @include App/SelectFeature.js
 * @include App/CombinedUndo.js
 */

Ext.namespace("App.Action");

App.Action.Circle = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_circle",

    text: OpenLayers.i18n("Circle"),

    /** api: method[addActions]
     */
    addActions: function() {
        var actions = [new Ext.Action(this)];
        return App.ModifyFeatureGeometry.superclass.addActions.apply(this, [actions]);
    },

    handler: function() {
        var features = this.target.mapPanel.osm.selectedFeatures;
        var undo = new App.CombinedUndo();

        if (features.length != 1 && features[0].geometry.CLASS_NAME == "OpenLayers.Geometry.Point") {
            window.alert(OpenLayers.i18n("You should select one line or one polygone"));
            return;
        }

        var points = features[0].geometry.getVertices();
        if (points.length < 4) {
            window.alert(OpenLayers.i18n("You should select one line with at least 4 points"));
            return;
        }

        var ref = points[0];
        var points = points.map(function(p) {
            return {
                osm_id: p.osm_id,
                x: p.x - ref.x,
                y: p.y - ref.y
            }
        });
        var center = this.getCenter(points);

        var rs = points.map(function (point) {
            return {
                x: point.x,
                y: point.y,
                osm_id: point.osm_id,
                r: Math.sqrt(Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2))
            }
        });
        var r = rs.reduce(function (sum, r) {
            return sum + r.r;
        }, 0) / rs.length;

        rs.forEach(function(point) {
            var rr = r / point.r - 1;
            var moveX =  (point.x - center.x) * rr;
            var moveY = (point.y - center.y) * rr;

            var feature = this.target.mapPanel.getFeature(point.osm_id);
            feature.geometry.move(moveX, moveY);
            this.target.mapPanel.drawFeature(feature);
            undo.list.push({
                undo: function(mapPanel) {
                    feature.geometry.move(-moveX, -moveY);
                    mapPanel.drawFeature(feature);
                }
            });
        }, this);

        this.target.mapPanel.undoList.push(undo);
    },


    getAngle: function(xc, yc, x, y) {
        // calculate the angle from xc|yc to x|y
        if (xc == x && yc == y)
            return 0; // actually invalid, but we won't have this case in this context
        var yd = Math.abs(y - yc);
        if (yd == 0 && xc < x)
            return 0;
        if (yd == 0 && xc > x)
            return Math.PI;
        var xd = Math.abs(x - xc);
        var a = Math.atan2(xd, yd);
        if (y > yc) {
            a = Math.PI - a;
        }
        if (x < xc) {
            a = -a;
        }
        a = 1.5*Math.PI + a;
        if (a < 0) {
            a += 2.0*Math.PI;
        }
        if (a >= 2.0*Math.PI) {
            a -= 2.0*Math.PI;
        }
        return a;
    },

    getCenter: function(points) {
        var segments = [];
        var previousPoint = null;
        points.forEach(function (point) {
            if (previousPoint) {
                var a = (point.y - previousPoint.y) / (point.x - previousPoint.x);
                segments.push({
                    p1: previousPoint,
                    p2: point,
                    angle: this.getAngle(previousPoint.x, previousPoint.y, point.x, point.y),
                    a: a,
                    b: point.y - a * point.x
                })
            }
            previousPoint = point;
        }, this);

        var intersections = segments.map(function (segment1) {
            var diff = Math.PI;
            var segment2;
            segments.forEach(function (testSegment2) {
                var d = Math.abs(((segment1.angle - testSegment2.angle + 2*Math.PI) % Math.PI) - Math.PI / 2);
                if (d < diff) {
                    segment2 = testSegment2;
                    diff = d;
                }
            }, this);

            var is1 = {
                x: (segment1.p2.x + segment1.p1.x) / 2.0,
                y: (segment1.p2.y + segment1.p1.y) / 2.0
            }
            var a1 = -1.0 / segment1.a;
            var b1 = is1.y - a1 * is1.x;
            var is2 = {
                x: (segment2.p2.x + segment2.p1.x) / 2.0,
                y: (segment2.p2.y + segment2.p1.y) / 2.0
            }
            var a2 = -1.0 / segment2.a;
            var b2 = is2.y - a2 * is2.x;

            var x = (b2 - b1) / (a1 - a2);
            var y = a1 * x + b1;
            return {
                x: x,
                y: y
            };
        });

        var center = intersections.reduce(function (sum, intersection) {
            return {
                x: sum.x + intersection.x,
                y: sum.y + intersection.y
            }
        });
        return {
            x: center.x / intersections.length,
            y: center.y / intersections.length
        }
    }

});

Ext.preg(App.Action.Circle.prototype.ptype, App.Action.Circle);
