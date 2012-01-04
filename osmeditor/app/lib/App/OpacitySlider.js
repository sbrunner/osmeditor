
/*
 * @requires plugins/Tool.js
 * @include GeoExt/widgets/LayerOpacitySlider.js
 */

Ext.namespace("App");

App.OpacitySlider = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_opacityslider",

    /** api: config[layerRef]
     * ``String``
     * Referance of the layer.
     */
    layerRef: 'ortho',

    /** api: config[complementaryLayerRef]
     * ``String``
     * Referance of the oposite layer.
     */
    complementaryLayerRef: 'plan',

    init: function() {
        App.OpacitySlider.superclass.init.apply(this, arguments);
        this.target.on('ready', function() {
            var mapPanel = this.target.mapPanel;
            var map = mapPanel.map;

            var slider = new GeoExt.LayerOpacitySlider({
                width: 200,
                layer:  map.getLayersBy('ref', this.layerRef)[0],
                aggressive: true,
                changeVisibility: true,
                complementaryLayer: map.getLayersBy('ref', this.complementaryLayerRef),
                maxvalue: 100,
                value: 10
            });
            slider.layer.setOpacity(0.1);

            var container = Ext.DomHelper.append(mapPanel.map.viewPortDiv, {
                tag: 'div',
                cls: 'baseLayersOpacitySlider'
            }, true);
            slider.render(container);

            var width = slider.getWidth() + 5;
            container.setStyle({'marginLeft': (-width / 2) + 'px'});
        }, this);
    }
});

Ext.preg(App.OpacitySlider.prototype.ptype, App.OpacitySlider);
