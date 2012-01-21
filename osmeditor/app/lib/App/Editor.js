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
 * @include OpenLayers/Layer/Bing.js
 * @include OpenLayers/Control/LoadingPanel.js
 * @include GeoExt/widgets/MapPanel.js
 * @include GeoExt/state/PermalinkProvider.js
 * @include App/Map.js
 * @include App/Pan.js
 * @include App/OpacitySlider.js
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
 * @include App/Undo.js
 * @include App/SelectFeatures.js
 * @include App/Actions/Circle.js
 * @include App/Actions/Orthogonalize.js
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
    // accept ':' in string replacement ex: addr:housenumber
    OpenLayers.String.tokenRegEx = /\$\{([\w.:]+?)\}/g;
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

    var osmResolutions = [156543.03390625, 78271.516953125, 39135.7584765625,
            19567.87923828125, 9783.939619140625,
            4891.9698095703125, 2445.9849047851562,
            1222.9924523925781, 611.4962261962891,
            305.74811309814453, 152.87405654907226,
            76.43702827453613, 38.218514137268066,
            19.109257068634033, 9.554628534317017,
            4.777314267158508, 2.388657133579254,
            1.194328566789627, 0.5971642833948135]
    var bingResolutions = osmResolutions.concat([0.29858214169740677]);
    var mapResolutions = bingResolutions.concat([
            0.14929107084870338, 0.07464553542435169]);

    app = new gxp.Viewer({
        portalConfig: {
            layout: "border",
            items: ['map']
        },
        tools: [{
            ptype: "osm_opacityslider"
        }, {
            ptype: "osm_pan",
            toggleGroup: "tool",
            pressed: true
        }, {
            ptype: 'osm_undo'
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
            ptype: "cgxp_menushortcut",
            type: '-'
        }, {
            ptype: "osm_selectfeatures",
            toggleGroup: "tool"
        }, {
            ptype: "osm_deletefeature"
        }, {
            ptype: "osm_circle"
        }, {
            ptype: "cgxp_menushortcut",
            type: '-'
        }, {
            ptype: "osm_orthogonalize"
        }, {
            ptype: "osm_orthogonalize",
            text: "60",
            nbDirections: 6
        }, {
            ptype: "osm_orthogonalize",
            text: "45",
            nbDirections: 8
        }, {
            ptype: "osm_orthogonalize",
            text: "30",
            nbDirections: 12
        }, {
            ptype: "cgxp_menushortcut",
            type: '-'
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
                    transitionEffect: 'resize',
                    resolutions: mapResolutions,
                    serverResolutions: mapResolutions
                }]
            }, {
                source: "ol",
                type: "OpenLayers.Layer.XYZ",
                args: ["mapnik", [
                    "http://a.tile.openstreetmap.org/${z}/${x}/${y}.png",
                    "http://b.tile.openstreetmap.org/${z}/${x}/${y}.png",
                    "http://c.tile.openstreetmap.org/${z}/${x}/${y}.png"
                ], {
                    ref: 'plan',
                    sphericalMercator: true,
                    wrapDateLine: true,
                    isBaseLayer: false,
                    transitionEffect: 'resize',
                    resolutions: mapResolutions,
                    serverResolutions: osmResolutions,
                    attribution: "Data CC-By-SA by <a href='http://openstreetmap.org/' target='_blank'>OpenStreetMap</a>"
                }]
            }, {
                source: "ol",
                type: "OpenLayers.Layer.Bing",
                args: [{
                    key: 'At1BfDJ7AORxoIDB3XWbl-LrBoS2LiofC9yirzytRrmFJK0sUD6jwCODSXuDas70',
                    type: 'Aerial',
                    ref: 'ortho',
                    resolutions: mapResolutions,
                    serverResolutions: bingResolutions
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
        var mapPanel = app.mapPanel;
        /* move layer to top */
        mapPanel.map.removeLayer(mapPanel.osm);
        mapPanel.map.addLayer(mapPanel.osm);
    }, this);
});





/*            mapPanel.getTopToolbar().addButton(new GeoExt.Action({
        text: "Rotate - Zoom",
        toggleGroup: "tool",
        desable: true,
        control: new OpenLayers.Control.TransformFeature(osm, {preserveAspectRatio: true}),
        map: mapPanel.map
    }));*/

