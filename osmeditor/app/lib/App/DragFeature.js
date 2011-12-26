
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
        this.control = new OpenLayers.Control.DragFeature(
            mapPanel.map.getLayersByName("OSM")[0], {
            onDrag: function(f) {
                if (f.type == 'node' && !f.action) {
                    f.action = 'modified';
                }
                var dep = mapPanel.depandancies[f.osm_id];
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
        });
        this.map = mapPanel.map;
        var actions = [new GeoExt.Action(this)];
        return App.DragFeature.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.DragFeature.prototype.ptype, App.DragFeature);
