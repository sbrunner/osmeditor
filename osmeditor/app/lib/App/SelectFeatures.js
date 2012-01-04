
/*
 * @requires plugins/Tool.js
 * @include App/SelectFeature.js
 * @include GeoExt/widgets/Action.js
 */

Ext.namespace("App");

App.SelectFeatures = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_selectfeatures",

    text: OpenLayers.i18n("Select"),

    /** api: method[addActions]
     */
    addActions: function() {

        this.map = this.target.mapPanel.map;
        this.control = new App.SelectFeature(this.target.mapPanel.osm, {
            multipleKey: 'ctrlKey',
            toggleKey: 'ctrlKey',
            clickout: true,
            box: true,
            scope: this
        });

        var actions = [new GeoExt.Action(this)];
        return App.EditFeature.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.SelectFeatures.prototype.ptype, App.SelectFeatures);
