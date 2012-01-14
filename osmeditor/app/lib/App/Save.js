
/*
 * @requires plugins/Tool.js
 * @include OpenLayers/Request.js
 */

Ext.namespace("App");

App.Save = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_save",

    text: OpenLayers.i18n("Save"),

    handler: function() {
        this.errorPanel = new Ext.Panel({
            border: false,
            bodyStyle: {
                backgroundColor: 'transparent',
                padding: '5px'
            }
        });
        this.progressbar = new Ext.ProgressBar({ width: 340 });
        var win = new Ext.Window({
            title: OpenLayers.i18n("Save"),
            width: 400,
            height: 180,
            layout: 'card',
            closable: false,
            activeItem: 'ask',
            items: [{
                id: 'ask',
                xtype: 'form',
                labelWidth: 150,
                style: {
                    width: '100%',
                    padding: '10px'
                },
                bodyStyle: {
                    backgroundColor: 'transparent',
                    padding: '10px'
                },
                items: [{
                    fieldLabel: OpenLayers.i18n('Change set comment'),
                    xtype: 'textfield',
                    name: 'comment',
                    allowBlank: false,
                    listeners: {
                        specialkey: function(field, e) {
                            if (e.getKey() == e.ENTER) {
                                win.getLayout().setActiveItem('progress');
                                this.progressbar.progressBar.setHeight(this.progressbar.el.dom.firstChild.offsetHeight);
                                this.save(Ext.getCmp('ask').getForm().getValues()['comment']);
                            }
                        },
                        scope: this
                    }
                }],
                buttons: [{
                    text: OpenLayers.i18n('Save'),
                    handler : function(e) {
                        win.getLayout().setActiveItem('progress');
                        this.progressbar.progressBar.setHeight(this.progressbar.el.dom.firstChild.offsetHeight);
                        this.save(Ext.getCmp('ask').getForm().getValues()['comment']);
                    },
                    scope: this
                }, {
                    text: OpenLayers.i18n('Cancel'),
                    handler : function(e) {
                        win.close();
                    },
                    scope: this
                }]
            }, {
                id: 'progress',
                layout: 'vbox',
                items: [{
                        html: OpenLayers.i18n('Saves'),
                        border: false,
                        bodyStyle: {
                            backgroundColor: 'transparent'
                        }
                    },
                    this.progressbar],
                style: {
                    width: '100%',
                    padding: '10px'
                },
                bodyStyle: {
                    backgroundColor: 'transparent',
                    padding: '10px'
                }
            }, {
                id: 'error',
                items: [this.errorPanel],
                bbar: ['->', {
                    text: OpenLayers.i18n('Close'),
                    handler : function(e) {
                        win.close();
                    },
                    scope: this
                }],
                style: {
                    width: '100%',
                    padding: '10px'
                },
                bodyStyle: {
                    backgroundColor: 'transparent',
                    padding: '10px'
                }
            }]
        });
        this.win = win;
        win.show();
    },

    createTemplates: function() {
        if (!this.tagTemplate) {
            this.tagTemplate = new Ext.Template('<tag k="{k}" v="{v}" />');
            this.tagTemplate.compile();
            this.nodeTemplate = new Ext.Template('<osm><node lon="{lon}" lat="{lat}" changeset="{changeset}" id="{id}" version="{version}">{tags}</node></osm>');
            this.nodeTemplate.compile();
            this.wayTemplate = new Ext.Template('<osm><way changeset="{changeset}" id="{id}" version="{version}">{nodes}{tags}</way></osm>');
            this.wayTemplate.compile();
            this.nodeLinkTemplate = new Ext.Template('<nd ref="{ref}" />');
            this.nodeLinkTemplate.compile();
        }
    },

    getNode: function(node) {
        this.createTemplates();
        var tags = '';
        for (p in node.attributes) {
            tags += this.tagTemplate.apply({'k': p, 'v': node.attributes[p]});
        }
        var g = node.geometry.clone().transform(epsg900913, epsg4326);
        return this.nodeTemplate.apply({
            'lon': g.x,
            'lat': g.y,
            'changeset': this.changeset,
            'tags': tags,
            'id': node.osm_id >= 0 ? node.osm_id : '',
            'version': node.osm_id >= 0 ? node.osm_version : ''
        })
    },

    getWay: function(way) {
        this.createTemplates();
        var geometry = way.geometry;
        if (geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon") {
            geometry = geometry.components[0];
        }
        var nodes = '';
        geometry.components.forEach(function(p) {
            nodes += this.nodeLinkTemplate.apply({'ref': p.osm_id});
        }, this);
        var tags = '';
        for (p in way.attributes) {
            tags += this.tagTemplate.apply({'k': p, 'v': way.attributes[p]});
        }
        return this.wayTemplate.apply({
            'changeset': this.changeset,
            'nodes': nodes,
            'tags': tags,
            'id': way.osm_id >= 0 ? way.osm_id : '',
            'version': way.osm_id >= 0 ? way.osm_version : ''
        })
    },

    getFeature: function(feature) {
        return feature.type == 'node' ? this.getNode(feature) : this.getWay(feature);
    },

    addAction: function(feature, action, method, errorMessage, success) {
        var save = this;
        this.todo.push(function() {
            OpenLayers.Request.issue({
                url: 'http://stephane-brunner.ch/cgi-bin/osm.py',
                params: {
                    'method': method,
                    'action': action,
                    'data': save.getFeature(feature)
                },
                success: success,
                failure: function(r) {
                    save.error(errorMessage, r);
                }
            });
        });
    },

    todoNext: function() {
        this.todoPos += 1;
        this.progressbar.updateProgress(this.todoPos / this.todo.length);

        if (this.todoPos < this.todo.length) {
            this.todo[this.todoPos]();
        }
    },

    error: function(message, response) {
        this.errorPanel.update("<p>" + message + "</p>" +
                "<p>" + response.statusText + "<br>" + response.responseText + "</p>");
        this.win.getLayout().setActiveItem('error');
        this.target.mapPanel.update();
    },

    save: function(comment) {
        var save = this;

        this.todoPos = -1; // -1 mean not started
        this.todo = [];
        var mapPanel = this.target.mapPanel;

        var finish = function() {
            OpenLayers.Request.issue({
                url: 'http://stephane-brunner.ch/cgi-bin/osm.py',
                params: {
                    'action': '/api/0.6/changeset/' + save.changeset + '/close',
                    'method': 'PUT'
                },
                failure: function(r) {
                    save.error(OpenLayers.i18n("Unable to close the changeset."), r);
                }
            });
            save.todoPos += 1;
            mapPanel.update();
            save.win.close();
        };
        save.todo.push(function() {
            OpenLayers.Request.GET({
                url: "http://stephane-brunner.ch/cgi-bin/osm.py",
                params: {
                    'new': comment
                },
                success: function(r) {
                    save.changeset = r.responseText.replace(/^\s+|\s+$/g, '');
                    save.todoNext();
                },
                failure: function(r) {
                    save.error(OpenLayers.i18n("Unable to open changeset."), r);
                }
            });
        });

        var nodes = [];
        var ways = [];
        mapPanel.osm.getFeaturesBy('action', 'new').forEach(function(f) {
            if (f.type == 'node') {
                nodes.push(f);
            }
            else {
                ways.push(f);
            }
        }, this);

        nodes.forEach(function(f) {
            this.addAction(f, '/api/0.6/' + f.type + '/create', 'PUT',
                    OpenLayers.i18n("Unable to create a " + f.type + "."),
                    function(r) {
                        f.osm_id = r.responseText.replace(/^\s+|\s+$/g, '');
                        f.geometry.osm_id = f.osm_id;
                        f.fid = f.type + "." + f.osm_id;
                        f.action = 'commited';
                        f.osm_version = 1;
                        save.todoNext();
                    });
        }, this);

        ways.forEach(function(f) {
            this.addAction(f, '/api/0.6/' + f.type + '/create', 'PUT',
                    OpenLayers.i18n("Unable to create a " + f.type + "."),
                    function(r) {
                        f.osm_id = r.responseText.replace(/^\s+|\s+$/g, '');
                        f.geometry.osm_id = f.osm_id;
                        f.fid = f.type + "." + f.osm_id;
                        f.action = 'commited';
                        f.osm_version = 1;
                        save.todoNext();
                    });
        }, this);

        mapPanel.osm.getFeaturesBy('action', 'modified').forEach(function(f) {
            this.addAction(f, '/api/0.6/' + f.type + '/' + f.osm_id, 'PUT',
                    OpenLayers.i18n("Unable to send a " + f.type + "."),
                    function(r) {
                        f.action = 'commited';
                        f.osm_version += 1;
                        save.todoNext();
                    });
        }, this);

        mapPanel.deletedFeatures.forEach(function(f) {
            this.addAction(f, '/api/0.6/' + f.type + '/' + f.osm_id, 'DELETE',
                    OpenLayers.i18n("Unable to delete a " + f.type + "."),
                    function(r) {
                        mapPanel.deletedFeatures = OpenLayers.Util.removeItem(mapPanel.deletedFeatures, f);
                        save.todoNext();
                    });
        }, this);

        save.todo.push(finish);

        save.todoNext();
    },

    /** api: method[addActions]
     */
    addActions: function() {
        this.scope = this;
        var actions = [new Ext.Action(this)];
        return App.Save.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.Save.prototype.ptype, App.Save);
