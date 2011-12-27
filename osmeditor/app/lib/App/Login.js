
/*
 * @requires plugins/Tool.js
 */

Ext.namespace("App");

App.Login = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_login",

    text: OpenLayers.i18n("Login"),

    handler: function() {
        var win = new Ext.Window({
            title: OpenLayers.i18n("Login"),
            width: '90%',
            height: this.target.mapPanel.getHeight() * 0.9,
            layout: 'fit',
            html: '<iframe width="100%" height="100%" style="border: none;" src="http://stephane-brunner.ch/cgi-bin/osm.py?login=1"></iframe>',
            defaultButtons: [new Ext.Action({
                text: OpenLayers.i18n("Close"),
                handler: function() {
                    win.close();
                    win.destroy();
                }
            })],
            bbar: ['->', new Ext.Action({
                text: OpenLayers.i18n("Close"),
                handler: function() {
                    win.close();
                    win.destroy();
                }
            })]
        });
        win.show();
    },

    /** api: method[addActions]
     */
    addActions: function() {
        var actions = [new Ext.Action(this)];
        return App.Login.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.Login.prototype.ptype, App.Login);
