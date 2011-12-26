
/*
 * @requires plugins/Tool.js
 * @include OpenLayers/Request.js
 */

Ext.namespace("App");

App.Save = Ext.extend(gxp.plugins.Tool, {
    ptype: "osm_save",

    text: OpenLayers.i18n("Save"),

    handler: function() {
        var newNodes = [];
        var newWays = [];
        var todoPos = -1; // -1 mean not started
        var todo = [];
        var changeset;
        var todoNext = function() {
            todoPos += 1;
            if (todoPos < todo.length) {
                todo[todoPos]();
            }
        }
        var finish = function() {
            OpenLayers.Request.issue({
                url: 'http://stephane-brunner.ch/cgi-bin/osm.py',
                params: {
                    'action': '/api/0.6/changeset/' + changeset + '/close',
                    'method': 'PUT'
                },
                failure: function(r) { alert(OpenLayer.i18n("Unable to create a node.") + "\n" + r.statusText + "\n" + r.responseText); update(); }
            });
            update();
        };
        todo.push(function() {
            OpenLayers.Request.GET({
                url: "http://stephane-brunner.ch/cgi-bin/osm.py",
                params: {
                    'new': 'TestHTMLEditor'
                },
                success: function(r) {
                    changeset = r.responseText.replace(/^\s+|\s+$/g, '');
                    todoNext();
                },
                failure: function(r) { alert(OpenLayer.i18n("Unable to open changeset.") + "\n" + r.statusText + "\n" + r.responseText); }
            });
        });

        this.target.mapPanel.map.getLayersByName("OSM")[0].getFeaturesBy('action', 'new').forEach(function(f) {
            if (f.type == 'node') {
                newNodes.push(f);
            }
            else {
                newWays.push(f);
            }
        });

        var tagTemplate = new Ext.Template('<tag k="{k}" v="{v}" />');
        tagTemplate.compile();
        var nodeTemplate = new Ext.Template('<osm><node lon="{lon}" lat="{lat}" changeset="{changeset}">{tags}</node></osm>');
        nodeTemplate.compile();
        var sendNode = function(f, action, method) {
            var nodes = '';
            var tags = '';
            for (p in f.properties) {
                tags += tagTemplate.apply({'k': p, 'v': f.properties[p]});
            }
            var g = f.geometry.clone().transform(epsg900913, epsg4326);
            OpenLayers.Request.issue({
                url: 'http://stephane-brunner.ch/cgi-bin/osm.py',
                params: {
                    'method': method,
                    'action': action,
                    'data': nodeTemplate.apply({
                        'lon': g.x,
                        'lat': g.y,
                        'changeset': changeset,
                        'tags': tags
                    })
                },
                success: function(r) {
                    f.osm_id = r.responseText.replace(/^\s+|\s+$/g, '');
                    f.geometry.osm_id = f.osm_id;
                    f.fid = f.type + "." + f.osm_id;
                    f.action = 'commited';
                    todoNext();
                },
                failure: function(r) { alert(OpenLayer.i18n("Unable to create a node.") + "\n" + r.statusText + "\n" + r.responseText); finish(); }
            });
        };
        newNodes.forEach(function(f) {
            todo.push(function() {
                sendNode(f, '/api/0.6/node/create', 'PUT')
            });
        });
        var wayTemplate = new Ext.Template('<osm><way changeset="{changeset}">{nodes}{tags}</way></osm>');
        wayTemplate.compile();
        var nodeLinkTemplate = new Ext.Template('<nd ref="{ref}" />');
        nodeLinkTemplate.compile();
        var sendWay = function(f, action, method) {
            var nodes = '';
            f.geometry.getVertices().forEach(function(p) {
                nodes += nodeLinkTemplate.apply({'ref': p.osm_id});
            });
            var tags = '';
            for (p in f.properties) {
                tags += tagTemplate.apply({'k': p, 'v': f.properties[p]});
            }
            OpenLayers.Request.issue({
                url: 'http://stephane-brunner.ch/cgi-bin/osm.py',
                params: {
                    'method': method,
                    'action': action,
                    'data': wayTemplate.apply({
                        'changeset': changeset,
                        'nodes': nodes,
                        'tags': tags
                    })
                },
                success: function(r) {
                    f.osm_id = r.responseText.replace(/^\s+|\s+$/g, '');
                    f.geometry.osm_id = f.osm_id;
                    f.fid = f.type + "." + f.osm_id;
                    f.action = 'commited';
                    todoNext();
                },
                failure: function(r) {
                    alert(OpenLayer.i18n("Unable to create a node.") + "\n" + r.statusText + "\n" + r.responseText);
                    finish();
                }
            });
        };
        newWays.forEach(function(f) {
            todo.push(function() {
                sendWay(f, '/api/0.6/way/create', 'PUT');
            });
        });
        this.target.mapPanel.map.getLayersByName("OSM")[0].getFeaturesBy('action', 'modified').forEach(function(f) {
            if (f.type == 'node') {
                todo.push(function() {
                    sendNode(f, '/api/0.6/node/#' + f.osm_id, 'PUT');
                });
            }
            else {
                todo.push(function() {
                    sendWay(f, '/api/0.6/way/#' + f.osm_id, 'PUT');
                });
            }
        });
        this.target.mapPanel.featuresDeleted.forEach(function(f) {
            todo.push(function() {
                OpenLayers.Request.issue({
                    url: 'http://stephane-brunner.ch/cgi-bin/osm.py',
                    params: {
                        'method': 'DELETE',
                        'action': '/api/0.6/' + f.type + '/#' + f.osm_id
                    },
                    success: function(r) {
                        this.target.mapPanel.featuresDeleted = this.target.mapPanel.featuresDeleted.splice(
                                this.target.mapPanel.featuresDeleted.indexOf(f), 1);
                        todoNext();
                    },
                    failure: function(r) { alert(OpenLayer.i18n("Unable to create a node.") + "\n" +
                            r.statusText + "\n" + r.responseText); finish(); }
                });
            });
        }, this);
        todo.push(finish);

        todoNext();
    },

    /** api: method[addActions]
     */
    addActions: function() {
        var actions = [new Ext.Action(this)];
        return App.Save.superclass.addActions.apply(this, [actions]);
    }
});

Ext.preg(App.Save.prototype.ptype, App.Save);
