
/*
 * @requires plugins/Tool.js
 * @include GeoExt/widgets/Action.js
 * @include OpenLayers/Handler/Path.js
 * @include OpenLayers/Control/DrawFeature.js
 */

Ext.namespace("App");

App.CreatePath = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_createpath",

    text: OpenLayers.i18n("Path"),

    /** api: method[addActions]
     */
    addActions: function() {
        this.control = new OpenLayers.Control.DrawFeature(
                this.target.mapPanel.map.getLayersByName("OSM")[0],
                OpenLayers.Handler.Path);
        var control = this.control;

        OpenLayers.Event.observe(document, "keydown", function(evt) {
            if (control.active) {
                var handled = false;
                switch (evt.keyCode) {
                    case 90: // z
                        if (evt.metaKey || evt.ctrlKey) {
                            control.undo();
                            handled = true;
                        }
                        break;
                    case 89: // y
                        if (evt.metaKey || evt.ctrlKey) {
                            control.redo();
                            handled = true;
                        }
                        break;
                    case 27: // esc
                        control.cancel();
                        handled = true;
                        break;
                }
                if (handled) {
                    OpenLayers.Event.stop(evt);
                }
            }
        });

        this.map = this.target.mapPanel.map;
        var actions = [new GeoExt.Action(this)];
        return App.CreatePath.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.CreatePath.prototype.ptype, App.CreatePath);
