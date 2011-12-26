
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
        this.control = new OpenLayers.Control.ModifyFeature(
            mapPanel.map.getLayersByName("OSM")[0], {
                onUnselect: function(f) {
                    f.geometry.getVertices().forEach(function(p) {
                        osm.drawFeature(osm.getFeatureBy('osm_id', p.osm_id));
                    });
                },
                dragVertex: function(vertex) {
                    OpenLayers.Control.ModifyFeature.prototype.dragVertex.apply(this, arguments);

                    // TODO set modified
                    /*if (f.type == 'node' && !f.action) {
                        f.action = 'modified';
                    }*/
                    var dep = mapPanel.depandancies[vertex.osm_id];
                    if (dep) {
                        for (var i = 0, leni = dep.length; i < leni; i++) {
                            var id = dep[i];
                            var fd = osm.getFeatureBy('osm_id', id);
                            osm.drawFeature(fd);
                            if (fd.type == 'node') {
                                if (!fd.action) {
                                    fd.action = 'modified';
                                }
                                var dep2 = mapPanel.depandancies[id];
                                if (dep2) {
                                    for (var j = 0, lenj = dep2.length; j < lenj; j++) {
                                        var fd2 = osm.getFeatureBy('osm_id', dep2[j]);
                                        mapPanel.map.getLayersByName("OSM")[0].drawFeature(fd2);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        );
        this.map = this.target.mapPanel.map;

        var actions = [new GeoExt.Action(this)];
        return App.ModifyFeatureGeometry.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.ModifyFeatureGeometry.prototype.ptype, App.ModifyFeatureGeometry);
