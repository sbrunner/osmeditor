/**
 * The main class to habe the OSM editor
 */

/*
 * @include util.js
 * @include widgets/Viewer.js
 * @include plugins/OLSource.js
 * @include OpenLayers/Control/Navigation.js
 * @include OpenLayers/Control/KeyboardDefaults.js
 * @include OpenLayers/Control/MousePosition.js
 * @include OpenLayers/Control/ArgParser.js
 * @include OpenLayers/Control/Attribution.js
 * @include OpenLayers/Control/PanZoomBar.js
 * @include OpenLayers/Layer/SphericalMercator.js
 * @include OpenLayers/Control/LoadingPanel.js
 * @include GeoExt/widgets/MapPanel.js
 * @include GeoExt/state/PermalinkProvider.js
 * @include App/Map.js
 * @include App/Pan.js
 * @include App/Download.js
 * @include App/Login.js
 * @include App/Save.js
 * @include App/CreatePoint.js
 * @include App/CreatePath.js
 * @include App/CreatePolygon.js
 * @include App/DragFeature.js
 * @include App/ModifyFeatureGeometry.js
 * @include App/EditFeature.js
 * @include App/DeleteFeature.js
 * @include App/MenuShortcut.js
 */

var app;
var epsg900913 = new OpenLayers.Projection("EPSG:900913");
var epsg4326 = new OpenLayers.Projection("EPSG:4326");

Ext.onReady(function() {
    Ext.BLANK_IMAGE_URL = "lib/ext/Ext/resources/images/default/s.gif";
    OpenLayers.ImgPath = "app/images/";
    OpenLayers.ProxyHost = "proxy.php?url="; // proxy is required here
    OpenLayers.Number.thousandsSeparator = ' ';
    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
    OpenLayers.ImgPath = "http://map.stephane-brunner.ch/app/images/oltheme/";
    Ext.QuickTips.init();

    // create permalink provider
    var permalinkProvider = new GeoExt.state.PermalinkProvider({encodeType: false});
    Ext.state.Manager.setProvider(permalinkProvider);
    // update link when state changes
    var onStatechange = function(provider) {
        var l = provider.getLink();
        Ext.get("permalink").update("<a href=" + l + ">Permalink</a>");
    };
    permalinkProvider.on({statechange: onStatechange});

    app = new gxp.Viewer({
        portalConfig: {
            layout: "border",
            items: ['map']
        },
        tools: [{
            ptype: "osm_pan",
            toggleGroup: "tool",
            pressed: true
        }, {
            ptype: "cgxp_menushortcut",
            type: '-'
        }, {
            ptype: "osm_download"
        }, {
            ptype: "osm_login"
        }, {
            ptype: "osm_save"
        }, {
            ptype: "osm_download",
            text: OpenLayers.i18n("Revert all"),
            force: true
        }, {
            ptype: "cgxp_menushortcut",
            type: '-'
        }, {
            ptype: "osm_createpoint",
            toggleGroup: "tool"
        }, {
            ptype: "osm_createpath",
            toggleGroup: "tool"
        }, {
            ptype: "osm_createpolygon",
            toggleGroup: "tool"
        }, {
            ptype: "cgxp_menushortcut",
            type: '-'
        }, {
            ptype: "osm_dragfeature",
            toggleGroup: "tool"
        }, {
            ptype: "osm_modifyfeaturegeometry",
            toggleGroup: "tool"
        }, {
            ptype: "osm_editfeature",
            toggleGroup: "tool"
        }, {
            ptype: "osm_deletefeature",
            toggleGroup: "tool"
        }],
        sources: {
            "ol": {
                ptype: "gxp_olsource"
            }
        },
        map: {
            id: "map",
            xtype: "osm_map",
            projection: epsg900913,
            displayProjection: epsg4326,
            units: "m",
            maxExtent: [-128 * 156543.03390625,
                -128 * 156543.03390625,
                128 * 156543.03390625,
                128 * 156543.03390625],
            maxResolution: 156543.03390625,
            layers: [{
                source: "ol",
                type: "OpenLayers.Layer.XYZ",
                args: ["blank", "no.png", {
                    sphericalMercator: true,
                    wrapDateLine: true,
                    isBaseLayer: true,
                    numZoomLevels: 22
                }]
            }, {
                source: "ol",
                type: "OpenLayers.Layer.XYZ",
                args: ["mapnik", [
                    "http://a.tile.openstreetmap.org/${z}/${x}/${y}.png",
                    "http://b.tile.openstreetmap.org/${z}/${x}/${y}.png",
                    "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png"
                ], {
                    sphericalMercator: true,
                    wrapDateLine: true,
                    isBaseLayer: false,
                    numZoomLevels: 19,
                    attribution: "Data CC-By-SA by <a href='http://openstreetmap.org/' target='_blank'>OpenStreetMap</a>"
                }]
            }],
            controls: [
                new OpenLayers.Control.Navigation(),
                new OpenLayers.Control.KeyboardDefaults(),
                new OpenLayers.Control.MousePosition({displayProjection: epsg4326}),
                new OpenLayers.Control.ArgParser(),
                new OpenLayers.Control.Attribution(),
                new OpenLayers.Control.LoadingPanel(),
                new OpenLayers.Control.PanZoomBar({panIcons: false, zoomWorldIcon: false})
            ]
        }
    });

    app.addListener('ready', function() {
        var map = app.mapPanel.map;
        var osm = map.getLayersByName("OSM")[0];
        map.removeLayer(osm);
        map.addLayer(osm);
    }, this);
});





/*            mapPanel.getTopToolbar().addButton(new GeoExt.Action({
        text: "Rotate - Zoom",
        toggleGroup: "tool",
        desable: true,
        control: new OpenLayers.Control.TransformFeature(osm, {preserveAspectRatio: true}),
        map: mapPanel.map
    }));
    mapPanel.getTopToolbar().addButton(new GeoExt.Action({
        text: "Delete",
        toggleGroup: "tool",
        desable: true,
        control: new OpenLayers.Control.SelectFeature(osm, {
            onBeforeSelect: function(f) {
            }
        }),
        map: mapPanel.map
    }));*/

