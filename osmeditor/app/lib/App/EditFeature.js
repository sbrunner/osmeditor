
/*
 * @requires plugins/Tool.js
 * @include OpenLayers/Control/SelectFeature.js
 * @include GeoExt/widgets/Action.js
 * @include GeoExt/widgets/Popup.js
 */

Ext.namespace("App");

App.EditFeature = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_editfeature",

    text: OpenLayers.i18n("Edit"),

    /** api: method[addActions]
     */
    addActions: function() {
        var mapPanel = this.target.mapPanel
        this.control = new OpenLayers.Control.SelectFeature(
            mapPanel.map.getLayersByName("OSM")[0], {
                onUnSelect: function(f) {
                },
                onSelect: function(f) {
                    var Property = Ext.data.Record.create([
                        {name: 'property'},
                        {name: 'value'}
                    ]);
                    var data = [];
                    for (var property in f.attributes) {
                        data.push([property, f.attributes[property]]);
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
                    });
                    grid.getBottomToolbar().add({
                        text   : OpenLayers.i18n("Delete"),
                        handler: function() {
                            store.remove(grid.getSelectionModel().getSelected());
                            grid.getView().refresh();
                        }
                    });
                    grid.getBottomToolbar().add({
                        text   : OpenLayers.i18n("Add"),
                        handler: function() {
                            var index = store.getCount();
                            store.insert(index, new Property({property: '', value: ''}));
                            grid.getView().refresh();
                            grid.getSelectionModel().selectRow(index);
                        }
                    });
                    var postFix = "";
                    if (f.attributes.name) {
                        postFix = " - " + f.attributes.name;
                    }
                    var popup = new GeoExt.Popup({
                        title: OpenLayers.i18n("Properties") + postFix,
                        location: f.geometry.getCentroid(),
                        width: 300,
                        layout: 'fit',
                        collapsible: false,
                        map: mapPanel.map,
                        items: [grid]
                    });
                    popup.on('close', function() {
                        grid.stopEditing();
                        this.control.unselectAll();
                    });
                    popup.show();
                }
            }
        );

        this.map = mapPanel.map;

        var actions = [new GeoExt.Action(this)];
        return App.EditFeature.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.EditFeature.prototype.ptype, App.EditFeature);
