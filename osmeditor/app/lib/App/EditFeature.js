
/*
 * @requires plugins/Tool.js
 * @include App/SelectFeature.js
 * @include GeoExt/widgets/Action.js
 * @include GeoExt/widgets/Popup.js
 */

Ext.namespace("App");

App.EditFeature = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_editfeature",

    text: OpenLayers.i18n("Edit"),

    popup: null,

    oldProperties: null,

    keys: null,
    attributes: null,

    addWord: function(key, value) {
        if (!this.attributes[key]) {
            this.keys.push([key]);
            this.attributes[key] = [];
        }
        this.attributes[key].push([value]);
    },

    addAccessWord: function(key) {
        this.keys.push([key]);
        this.attributes[key] = [['yes'], ['no'], ['destination'], ['agricultural'], ['delivery'], ['designated'], ['forestry'], ['official'], ['permissive'], ['private']];
        this.addWord(key + ':forward', 'yes');
        this.addWord(key + ':forward', 'no');
        this.addWord(key + ':backward', 'yes');
        this.addWord(key + ':backward', 'no');
    },

    /** api: method[addActions]
     */
    addActions: function() {

        this.keys = [['name']];
        this.attributes = {};
        this.addWord('addr:city', '');
        this.addWord('addr:country', '');
        this.addWord('addr:housenumber', '');
        this.addWord('addr:housename', '');
        this.addWord('addr:postecode', '');
        this.addWord('addr:street', '');
        this.addAccessWord('agricultural');
        this.addAccessWord('access');
        this.addWord('admin_level', '10');
        this.addWord('admin_level', '2');
        this.addWord('admin_level', '3');
        this.addWord('admin_level', '4');
        this.addWord('admin_level', '5');
        this.addWord('admin_level', '6');
        this.addWord('admin_level', '7');
        this.addWord('admin_level', '8');
        this.addWord('admin_level', '9');
        this.addWord('aerialway', 'cable_car');
        this.addWord('aerialway', 'chair_lift');
        this.addWord('aerialway', 'drag_lift');
        this.addWord('aerialway', 'gondola');
        this.addWord('aerialway', 'goods');
        this.addWord('aerialway', 'j-bar');
        this.addWord('aerialway', 'platter');
        this.addWord('aerialway', 'rope_tow');
        this.addWord('aerialway', 'station');
        this.addWord('aerialway', 't-bar');
        this.addWord('aeroway', 'aerodrome');
        this.addWord('aeroway', 'airport');
        this.addWord('aeroway', 'apron');
        this.addWord('aeroway', 'gate');
        this.addWord('aeroway', 'helipad');
        this.addWord('aeroway', 'runway');
        this.addWord('aeroway', 'taxiway');
        this.addWord('aeroway', 'terminal');
        this.addWord('amenity', 'atm');
        this.addWord('amenity', 'bank');
        this.addWord('amenity', 'bar');
        this.addWord('amenity', 'bicycle_rental');
        this.addWord('amenity', 'biergarten');
        this.addWord('amenity', 'bus_station');
        this.addWord('amenity', 'bus_stop');
        this.addWord('amenity', 'cafe');
        this.addWord('amenity', 'car_sharing');
        this.addWord('amenity', 'cinema');
        this.addWord('amenity', 'college');
        this.addWord('amenity', 'courthouse');
        this.addWord('amenity', 'drinking_water');
        this.addWord('amenity', 'embassy');
        this.addWord('amenity', 'emergency_phone');
        this.addWord('amenity', 'fast_food');
        this.addWord('amenity', 'fire_station');
        this.addWord('amenity', 'fuel');
        this.addWord('amenity', 'grave_yard');
        this.addWord('amenity', 'hospital');
        this.addWord('amenity', 'kindergarten');
        this.addWord('amenity', 'library');
        this.addWord('amenity', 'place_of_worship');
        this.addWord('amenity', 'parking');
        this.addWord('amenity', 'pharmacy');
        this.addWord('amenity', 'picnic_site');
        this.addWord('amenity', 'place_of_worship');
        this.addWord('amenity', 'police');
        this.addWord('amenity', 'post_box');
        this.addWord('amenity', 'post_office');
        this.addWord('amenity', 'prison');
        this.addWord('amenity', 'pub');
        this.addWord('amenity', 'recycling');
        this.addWord('amenity', 'restaurant');
        this.addWord('amenity', 'school');
        this.addWord('amenity', 'shelter');
        this.addWord('amenity', 'telephone');
        this.addWord('amenity', 'toilets');
        this.addWord('amenity', 'university');
        this.addWord('area', 'yes');
        this.addWord('barrier', 'block');
        this.addWord('barrier', 'bollard');
        this.addWord('barrier', 'embankment');
        this.addWord('barrier', 'gate');
        this.addWord('barrier', 'hedge');
        this.addWord('barrier', 'lift_gate');
        this.addAccessWord('bicycle');
        this.addWord('building', 'yes');
        this.addWord('building', 'station');
        this.addWord('building', 'supermarket');
        this.addWord('building', 'station');
        this.addWord('building', 'supermarket');
        this.addAccessWord('bus');
        this.addWord('capital', 'yes');
        this.addWord('capacity', '');
        this.addWord('capacity:disabled', '');
        this.addAccessWord('caravan');
        this.addWord('construction', 'bus_guideway');
        this.addWord('construction', 'cycleway');
        this.addWord('construction', 'living_street');
        this.addWord('construction', 'motorway');
        this.addWord('construction', 'motorway_link');
        this.addWord('construction', 'primary');
        this.addWord('construction', 'primary_link');
        this.addWord('construction', 'residential');
        this.addWord('construction', 'secondary');
        this.addWord('construction', 'secondary_link');
        this.addWord('construction', 'service');
        this.addWord('construction', 'tertiary');
        this.addWord('construction', 'tertiary_link');
        this.addWord('construction', 'trunk');
        this.addWord('construction', 'trunk_link');
        this.addWord('construction', 'unclassified');
        this.addWord('cycleway', 'lane');
        this.addWord('cycleway', 'track');
        this.addWord('cycleway', 'opposite_lane');
        this.addWord('cycleway', 'opposite_track');
        this.addWord('cycleway', 'opposite');
        this.addWord('cycleway', 'shared');
        this.addWord('cycleway', 'share_busway');
        this.addWord('cycleway', 'shared_lane');
        this.addWord('cycleway', 'sharrow');
        this.addWord('disused', 'yes');
        this.addAccessWord('emergency');
        this.addWord('fee', 'yes');
        this.addWord('fee', 'no');
        this.addAccessWord('foot');
        this.addAccessWord('forestry');
        this.addAccessWord('goods');
        this.addAccessWord('hazmat');
        this.addAccessWord('hgv');
        this.addWord('highway', 'bridleway');
        this.addWord('highway', 'bus_stop');
        this.addWord('highway', 'byway');
        this.addWord('highway', 'construction');
        this.addWord('highway', 'cycleway');
        this.addWord('highway', 'footway');
        this.addWord('highway', 'ford');
        this.addWord('highway', 'gate');
        this.addWord('highway', 'living_street');
        this.addWord('highway', 'mini_roundabout');
        this.addWord('highway', 'minor');
        this.addWord('highway', 'motorway_junction');
        this.addWord('highway', 'motorway_link');
        this.addWord('highway', 'path');
        this.addWord('highway', 'pedestrian');
        this.addWord('highway', 'platform');
        this.addWord('highway', 'primary');
        this.addWord('highway', 'primary_link');
        this.addWord('highway', 'proposed');
        this.addWord('highway', 'raceway');
        this.addWord('highway', 'residential');
        this.addWord('highway', 'rest_area');
        this.addWord('highway', 'road');
        this.addWord('highway', 'secondary');
        this.addWord('highway', 'secondary_link');
        this.addWord('highway', 'service');
        this.addWord('highway', 'services');
        this.addWord('highway', 'steps');
        this.addWord('highway', 'tertiary');
        this.addWord('highway', 'tertiary_link');
        this.addWord('highway', 'track');
        this.addWord('highway', 'traffic_signals');
        this.addWord('highway', 'trunk');
        this.addWord('highway', 'trunk_link');
        this.addWord('highway', 'unclassified');
        this.addWord('highway', 'unsurfaced');
        this.addWord('historic', 'archaeological_site');
        this.addWord('historic', 'memorial');
        this.addAccessWord('horse');
        this.addAccessWord('hov');
        this.addWord('landuse', 'allotments');
        this.addWord('landuse', 'basin');
        this.addWord('landuse', 'brownfield');
        this.addWord('landuse', 'cemetery');
        this.addWord('landuse', 'commercial');
        this.addWord('landuse', 'conservation');
        this.addWord('landuse', 'construction');
        this.addWord('landuse', 'farm');
        this.addWord('landuse', 'farmland');
        this.addWord('landuse', 'farmyard');
        this.addWord('landuse', 'field');
        this.addWord('landuse', 'forest');
        this.addWord('landuse', 'garages');
        this.addWord('landuse', 'grass');
        this.addWord('landuse', 'grave_yard');
        this.addWord('landuse', 'greenfield');
        this.addWord('landuse', 'industrial');
        this.addWord('landuse', 'landfill');
        this.addWord('landuse', 'meadow');
        this.addWord('landuse', 'military');
        this.addWord('landuse', 'orchard');
        this.addWord('landuse', 'quarry');
        this.addWord('landuse', 'railway');
        this.addWord('landuse', 'recreation_ground');
        this.addWord('landuse', 'reservoir');
        this.addWord('landuse', 'residential');
        this.addWord('landuse', 'retail');
        this.addWord('landuse', 'village_green');
        this.addWord('landuse', 'vineyard');
        this.addWord('landuse', 'water');
        this.addWord('landuse', 'wood');
        this.addWord('layer', '-5');
        this.addWord('layer', '-4');
        this.addWord('layer', '-3');
        this.addWord('layer', '-2');
        this.addWord('layer', '-1');
        this.addWord('layer', '1');
        this.addWord('layer', '2');
        this.addWord('layer', '3');
        this.addWord('layer', '4');
        this.addWord('layer', '5');
        this.addWord('leisure', 'common');
        this.addWord('leisure', 'garden');
        this.addWord('leisure', 'golf_course');
        this.addWord('leisure', 'marina');
        this.addWord('leisure', 'nature_reserve');
        this.addWord('leisure', 'park');
        this.addWord('leisure', 'pitch');
        this.addWord('leisure', 'playground');
        this.addWord('leisure', 'recreation_ground');
        this.addWord('leisure', 'slipway');
        this.addWord('leisure', 'sports_centre');
        this.addWord('leisure', 'stadium');
        this.addWord('leisure', 'swimming_pool');
        this.addWord('leisure', 'track');
        this.addWord('lock', 'yes');
        this.addWord('man_made', 'breakwater');
        this.addWord('man_made', 'embankment');
        this.addWord('man_made', 'groyne');
        this.addWord('man_made', 'lighthouse');
        this.addWord('man_made', 'mast');
        this.addWord('man_made', 'pier');
        this.addWord('man_made', 'power_wind');
        this.addWord('man_made', 'water_tower');
        this.addWord('man_made', 'windmill');
        this.addWord('military', 'barracks');
        this.addWord('military', 'danger_area');
        this.addAccessWord('mofa');
        this.addAccessWord('moh');
        this.addAccessWord('moped');
        this.addAccessWord('motocar');
        this.addAccessWord('motorcycle');
        this.addAccessWord('motor_vehicle');
        this.addWord('natural', 'bay');
        this.addWord('natural', 'beach');
        this.addWord('natural', 'cave_entrance');
        this.addWord('natural', 'cliff');
        this.addWord('natural', 'desert');
        this.addWord('natural', 'field');
        this.addWord('natural', 'glacier');
        this.addWord('natural', 'heath');
        this.addWord('natural', 'hedge');
        this.addWord('natural', 'lake');
        this.addWord('natural', 'land');
        this.addWord('natural', 'marsh');
        this.addWord('natural', 'mud');
        this.addWord('natural', 'peak');
        this.addWord('natural', 'sand');
        this.addWord('natural', 'scrub');
        this.addWord('natural', 'spring');
        this.addWord('natural', 'tree');
        this.addWord('natural', 'volcano');
        this.addWord('natural', 'water');
        this.addWord('natural', 'wetland');
        this.addWord('natural', 'wood');
        this.addWord('maxlength', '');
        this.addWord('maxheight', '');
        this.addWord('maxspeed', '');
        this.addWord('maxstay', '');
        this.addWord('maxweight', '');
        this.addWord('maxwidth', '');
        this.addWord('oneway', '-1');
        this.addWord('oneway', 'yes');
        this.addWord('oneway', 'no');
        this.addWord('oneway:bicycle', '-1');
        this.addWord('oneway:bicycle', 'yes');
        this.addWord('oneway:bicycle', 'no');
        this.addWord('parking', 'surface');
        this.addWord('parking', 'multi-storey');
        this.addWord('parking', 'underground');
        this.addWord('parking', 'sheds');
        this.addWord('parking', 'carports');
        this.addWord('parking', 'garage_boxes');
        this.addWord('park_ride', 'yes');
        this.addWord('park_ride', 'no');
        this.addWord('park_ride', 'bus');
        this.addWord('park_ride', 'train');
        this.addWord('park_ride', 'tram');
        this.addWord('park_ride', 'metro');
        this.addWord('park_ride', 'ferry');
        this.addWord('place', 'city');
        this.addWord('place', 'continent');
        this.addWord('place', 'country');
        this.addWord('place', 'farm');
        this.addWord('place', 'hamlet');
        this.addWord('place', 'island');
        this.addWord('place', 'isolated_dwelling');
        this.addWord('place', 'large_town');
        this.addWord('place', 'large_village');
        this.addWord('place', 'locality');
        this.addWord('place', 'metropolis');
        this.addWord('place', 'small_town');
        this.addWord('place', 'state');
        this.addWord('place', 'suburb');
        this.addWord('place', 'town');
        this.addWord('place', 'village');
        this.addWord('point', 'yes');
        this.addWord('power', 'generator');
        this.addWord('power_source', 'wind');
        this.addWord('power', 'station');
        this.addWord('power', 'sub_station');
        this.addAccessWord('psv');
        this.addWord('railway', 'abandoned');
        this.addWord('railway', 'construction');
        this.addWord('railway', 'disused');
        this.addWord('railway', 'funicular');
        this.addWord('railway', 'halt');
        this.addWord('railway', 'level_crossing');
        this.addWord('railway', 'light_rail');
        this.addWord('railway', 'miniature');
        this.addWord('railway', 'monorail');
        this.addWord('railway', 'narrow_gauge');
        this.addWord('railway', 'platform');
        this.addWord('railway', 'preserved');
        this.addWord('railway', 'rail');
        this.addWord('railway', 'siding');
        this.addWord('railway', 'spur');
        this.addWord('railway', 'spur-siding-yard');
        this.addWord('railway', 'station');
        this.addWord('railway', 'subway');
        this.addWord('railway', 'subway_entrance');
        this.addWord('railway', 'tram');
        this.addWord('railway', 'tram_stop');
        this.addWord('religion', 'christian');
        this.addWord('religion', 'jewish');
        this.addWord('religion', 'muslim');
        this.addWord('religion', 'sikh');
        this.addWord('service', 'parking_aisle');
        this.addWord('shop', 'bakery');
        this.addWord('shop', 'bicycle');
        this.addWord('shop', 'butcher');
        this.addWord('shop', 'car');
        this.addWord('shop', 'car_repair');
        this.addWord('shop', 'clothes');
        this.addWord('shop', 'convenience');
        this.addWord('shop', 'department_store');
        this.addWord('shop', 'doityourself');
        this.addWord('shop', 'fashion');
        this.addWord('shop', 'florist');
        this.addWord('shop', 'hairdresser');
        this.addWord('shop', 'supermarket');
        this.addAccessWord('snowmobile');
        this.addWord('supervised', 'yes');
        this.addWord('supervised', 'no');
        this.addAccessWord('ski');
        this.addAccessWord('ski:nordic');
        this.addAccessWord('ski:alpine');
        this.addAccessWord('ski:telemark');
        this.addAccessWord('taxi');
        this.addWord('tourism', 'alpine_hut');
        this.addWord('tourism', 'attraction');
        this.addWord('tourism', 'bed_and_breakfast');
        this.addWord('tourism', 'camp_site');
        this.addWord('tourism', 'caravan_site');
        this.addWord('tourism', 'chalet');
        this.addWord('tourism', 'guest_house');
        this.addWord('tourism', 'hostel');
        this.addWord('tourism', 'hotel');
        this.addWord('tourism', 'information');
        this.addWord('tourism', 'motel');
        this.addWord('tourism', 'museum');
        this.addWord('tourism', 'picnic_site');
        this.addWord('tourism', 'theme_park');
        this.addWord('tourism', 'viewpoint');
        this.addWord('tourism', 'zoo');
        this.addAccessWord('tourist_bus');
        this.addWord('tracktype', 'grade1');
        this.addWord('tracktype', 'grade2');
        this.addWord('tracktype', 'grade3');
        this.addWord('tracktype', 'grade4');
        this.addWord('tracktype', 'grade5');
        this.addWord('tunnel', 'yes');
        this.addAccessWord('vehicle');
        this.addWord('waterway', 'canal');
        this.addWord('waterway', 'dam');
        this.addWord('waterway', 'derelict_canal');
        this.addWord('waterway', 'ditch');
        this.addWord('waterway', 'dock');
        this.addWord('waterway', 'drain');
        this.addWord('waterway', 'lock');
        this.addWord('waterway', 'lock_gate');
        this.addWord('waterway', 'mill_pond');
        this.addWord('waterway', 'river');
        this.addWord('waterway', 'riverbank');
        this.addWord('waterway', 'stream');
        this.addWord('waterway', 'wadi');
        this.addWord('waterway', 'weir');

        var mapPanel = this.target.mapPanel;
        var control = new App.SelectFeature(mapPanel.osm, {});
        var tool = this;
        this.control = control;
        control.onUnselect = function(f) {
            if (tool.popup) {
                tool.popup.close();
            }
        };
        control.onSelect = function(f) {
            if (tool.popup) {
                tool.popup.close();
            }
            var Property = Ext.data.Record.create([
                {name: 'property'},
                {name: 'value'}
            ]);
            var data = [];
            tool.oldProperties = {};
            for (var property in f.attributes) {
                data.push([property, f.attributes[property]]);
                tool.oldProperties[property] = f.attributes[property];
            }
            var store = new Ext.data.ArrayStore({
                autoDestroy: true,
                storeId: 'myStore',
                idIndex: 0,
                fields: ['property', 'value'],
                data: data
            });
            var keyEditor = new Ext.form.ComboBox({
                mode: 'local',
                store: new Ext.data.ArrayStore({
                    fields: ['text'],
                    data: tool.keys
                }),
                emptyText: '...',
                displayField: 'text',
                valueField: 'text',
                minChars: 1
            });
            var valueEditor = new Ext.form.ComboBox({
                mode: 'local',
                store: new Ext.data.ArrayStore({
                    fields: ['text'],
                    data: []
                }),
                emptyText: '...',
                displayField: 'text',
                valueField: 'text',
                minChars: 1
            });
            var grid = new Ext.grid.EditorGridPanel({
                store: store,
                colModel: new Ext.grid.ColumnModel({
                    defaults: {
                        width: 120
                    },
                    columns: [
                        {header: OpenLayers.i18n('Property'), dataIndex: 'property', editor: keyEditor},
                        {header: OpenLayers.i18n('Value'), dataIndex: 'value', editor: valueEditor}
                    ]
                }),
                viewConfig: {
                    forceFit: true
                },
                sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
                hideHeaders: true,
                boxMinHeight: 150,
                bbar: ['->'],
                listeners: {
                    'beforeedit': function(e) {
                        if (e.column == 1) {
                            var data = this.attributes[e.record.data.property];
                            if (!data) {
                                data = [];
                            }
                            valueEditor.store.loadData(data);
                        }
                    },
                    scope: tool
                }
            });
            grid.on('afteredit', function(e) {
                if (e.field == 'property' && e.originalValue !== '') {
                    delete f.attributes[e.originalValue]
                }
                else if (e.field == 'value' && e.record.data.value == '') {
                    delete f.attributes[e.record.data.property]
                }
                if (e.record.data.property != '' && e.record.data.value != '') {
                    f.attributes[e.record.data.property] = e.record.data.value;
                }
                f.selectStyle = f.layer.staticStyleMap.createSymbolizer(f, "select");
                f.defaultStyle = f.layer.staticStyleMap.createSymbolizer(f);
            }, tool);
            grid.getBottomToolbar().add({
                text: OpenLayers.i18n("Delete"),
                handler: function() {
                    delete f.attributes[grid.getSelectionModel().getSelected().data.property]
                    store.remove(grid.getSelectionModel().getSelected());
                    grid.getView().refresh();
                    f.selectStyle = f.layer.staticStyleMap.createSymbolizer(f, "select");
                    f.defaultStyle = f.layer.staticStyleMap.createSymbolizer(f);
                    mapPanel.osm.drawFeature(feature);
                }
            });
            grid.getBottomToolbar().add({
                text: OpenLayers.i18n("Add"),
                handler: function() {
                    var index = store.getCount();
                    store.insert(index, new Property({property: '', value: ''}));
                    grid.getView().refresh();
                    grid.getSelectionModel().selectRow(index);
                    grid.startEditing(index, 0);
                }
            });
            var postFix = "";
            if (f.attributes.name) {
                postFix = " - " + f.attributes.name;
            }
            tool.popup = new GeoExt.Popup({
                title: OpenLayers.i18n("Properties") + postFix,
                location: f.geometry.getCentroid(),
                width: 300,
                layout: 'fit',
                collapsible: false,
                map: mapPanel.map,
                items: [grid]
            });
            tool.popup.on('close', function() {
                grid.stopEditing();

                var properties = this.oldProperties;
                var feature = f;

                if (!this.equals(properties, feature.attributes)) {
                    feature.action = 'modified';
                    mapPanel.undoList.push({
                        undo: function(mapPanel) {
                            feature.attributes = properties;
                            feature.selectStyle = feature.layer.staticStyleMap.createSymbolizer(f, "select");
                            feature.defaultStyle = feature.layer.staticStyleMap.createSymbolizer(f);
                            mapPanel.osm.drawFeature(feature);
                        }
                    });
                }
                this.popup.destroy();
                this.popup = null;

                control.unselectAll();
                grid.destroy();
                grid = null;
                store = null;
            }, tool);
            tool.popup.show();
        };

        this.map = mapPanel.map;

        var actions = [new GeoExt.Action(this)];
        return App.EditFeature.superclass.addActions.apply(this, [actions]);
    },

    equals: function(attributes1, attributes2) {
        for (var a in attributes1) {
            if (attributes1[a] !== attributes2[a]) {
                return false;
            }
        }
        for (var a in attributes2) {
            if (attributes1[a] !== attributes2[a]) {
                return false;
            }
        }
        return true;
    }
});

Ext.preg(App.EditFeature.prototype.ptype, App.EditFeature);
