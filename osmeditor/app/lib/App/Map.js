
/*
 * @requires GeoExt/widgets/MapPanel.js
 */

Ext.namespace("App");

App.Map = Ext.extend(GeoExt.MapPanel, {
    xtype: "osm_map",

    /* the used display projection */
    displayProjection: null,

    /** private: method[initComponent]
     *  Initializes the map panel. Creates an OpenLayers map if
     *  none was provided in the config options passed to the
     *  constructor.
     */
    initComponent: function() {
        App.Map.superclass.initComponent.call(this);
        this.map.displayProjection = this.displayProjection;
        delete this.displayProjection;
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
    }
});

Ext.reg(App.Map.prototype.xtype, App.Map);
