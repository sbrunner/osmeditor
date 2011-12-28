
/*
 * @requires OpenLayers/Control/SelectFeature.js
 */

App.SelectFeature = OpenLayers.Class(OpenLayers.Control.SelectFeature, {
    viewPortDiv: null, // required
    hover: true, // to call overFeature / outFeature
    overFeature: function(feature) {
        this.hover = false; // to make clickFeature working
        if (feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Point") {
            OpenLayers.Element.addClass(this.map.viewPortDiv, "olOverFeaturePoint");
        }
        else if (feature.geometry.CLASS_NAME == "OpenLayers.Geometry.LineString") {
            OpenLayers.Element.addClass(this.map.viewPortDiv, "olOverFeatureLine");
        }
        else if (feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon") {
            OpenLayers.Element.addClass(this.map.viewPortDiv, "olOverFeaturePolygon");
        }
    },
    outFeature: function(feature) {
        OpenLayers.Element.removeClass(this.map.viewPortDiv, "olOverFeaturePoint");
        OpenLayers.Element.removeClass(this.map.viewPortDiv, "olOverFeatureLine");
        OpenLayers.Element.removeClass(this.map.viewPortDiv, "olOverFeaturePolygon");
    }
});
