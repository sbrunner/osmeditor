
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

    /** api: method[addActions]
     */
    addActions: function() {
        var mapPanel = this.target.mapPanel;
        var control = new App.SelectFeature(mapPanel.map.getLayersByName("OSM")[0], {});
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
            var grid = new Ext.grid.EditorGridPanel({
                store: store,
                colModel: new Ext.grid.ColumnModel({
                    defaults: {
                        width: 120,
                        editor: new Ext.form.TextField()
                    },
                    columns: [
                        {header: OpenLayers.i18n('Property'), dataIndex: 'property'},
                        {header: OpenLayers.i18n('Value'), dataIndex: 'value'}
                    ]
                }),
                viewConfig: {
                    forceFit: true
                },
                sm: new Ext.grid.RowSelectionModel({singleSelect:true}),
                hideHeaders: true,
                boxMinHeight: 150,
                bbar: ['->']
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
                    store.remove(grid.getSelectionModel().getSelected());
                    grid.getView().refresh();
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
