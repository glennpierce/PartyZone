#!/usr/bin/env python3

from __future__ import (division, absolute_import, print_function,
                        unicode_literals)

import sys
import gi
import time
import signal
import select
import Pyro4
import argparse
import os
import os.path
import flask
from beets.plugins import BeetsPlugin
from beets.ui import Subcommand
from beets import ui
from beets import util
from flask import Flask, g, jsonify, request
from werkzeug.routing import BaseConverter, PathConverter
from socket import gethostname

app = Flask(__name__)
app.config.from_object(__name__)


with Pyro4.locateNS() as ns:
    players = ns.list(prefix="partyzone")
    master = None
    slaves = []
    for name, uri in players.items():
        if "partyzone.masterplayer" in name:
            master = Pyro4.Proxy(uri)
        else:
            slaves.append(Pyro4.Proxy(uri))
    print("master: " + str(master))
    print("slaves: " + str(slaves))


# Load default config and override config from an environment variable
app.config.update(dict(
    DATABASE=os.path.join(app.root_path, 'flaskr.db'),
    SECRET_KEY='development key',
    USERNAME='admin',
    PASSWORD='default'
))
app.config.from_envvar('FLASKR_SETTINGS', silent=True)

@app.before_request
def before_request():
   g.lib = app.config['lib']

@app.after_request
def after_request(response):
  response.headers.add('Access-Control-Allow-Origin', '*')
  response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  return response

@app.route('/')
def index():
    return flask.render_template('index.html')

@app.route('/trackfile/<int:item_id>')
def trackfile(item_id):
    item = g.lib.get_item(item_id)
    response = flask.send_file(item.path, as_attachment=False)
    response.headers['Content-Length'] = os.path.getsize(item.path)
    return response

@app.route('/play', methods= ['POST'])
def play():
    #http://127.0.0.1:5000/
    uri = request.url_root + '/test.mp3'
    master.track = "http://127.0.0.1:5000/trackfile"
    master.play()

    slaves[0].track = "http://127.0.0.1:5000/trackfile"
    slaves[0].play(master_basetime=master.get_basetime())
             #   time.sleep(10)
             #   slaves[0].stop()

#                 #master_player = Pyro4.Proxy("PYRONAME:partyzone.masterplayer")
#                 # Set the file uri to play
#                 #master_player.set_track(args.filepath)
    return flask.render_template('showmetadata.html')


@app.route('/get_devices', methods=['GET'])
def get_devices():
    players = ns.list(prefix="partyzone").items()
    return jsonify({'devices': players})


# @app.route('/create_zone', methods= ['POST'])
# def create_zone():
#     data = request.get_json()
#     devices = data.get('selected_devices', [])
#     allplayerController.CreateZone(devices)
#     return jsonify({'return': 'ok'})


# @app.route('/play', methods= ['POST'])
# def play():
#     data = request.get_json()
#     allplayerController.SetQueue(data['queue'])
#     player = allplayerController.GetPlayer()
#     state, position = player.GetPlayingState()
#     if state == "paused":
#         player.Resume()
#     else:
#         allplayerController.PlayQueue()
#     return jsonify({'return': 'ok'})


# @app.route('/playtrack', methods= ['POST'])
# def playtrack():
#     data = request.get_json()
#     player = allplayerController.GetPlayer()
#     state, position = player.GetPlayingState()
#     if state == "paused":
#         player.Resume()
#     else:
#         allplayerController.PlayTrack(data['track_id'])
#     return jsonify({'return': 'ok'})


# @app.route('/adjust_volume', methods=['POST'])
# def adjust_volume():
#     data = request.get_json()
#     device_id = data.get('device_id', None)
#     volume = data.get('volume')
#     allplayerController.SetVolume(device_id, volume)
#     return jsonify({'return': 'ok'})


# @app.route('/stop')
# def stop():
#     player = allplayerController.GetPlayer()
#     player.Stop()
#     return jsonify({'return': 'ok'})


# @app.route('/pause')
# def pause():
#     player = allplayerController.GetPlayer()
#     state, position = player.GetPlayingState()
#     if state.lower() == "paused":
#         player.Resume()
#     else:
#         player.Pause()
#     return jsonify({'return': 'ok'})


# @app.route('/update', methods= ['POST'])
# def update():
#     data = request.get_json()
#     item = data['item']
#     db_item = g.lib.get_item(item['id'])
#     db_item.update(item)
#     db_item.try_sync(True, False)

#     return jsonify({'return': 'ok'})


# @app.route('/tracks/')
# def tracks():
#     tracks = []
#     for item in g.lib.items():
#         tracks.append(
#                 {
#                    'id': item.id,
#                    'title': item.title,
#                    'path': item.path,
#                    'artist': item.artist,
#                    'album': item.album
#                 }
#             )

#     return jsonify({'items': tracks})  # g.lib.items()


# @app.route('/showtracks.html')
# def showtracks():
#     return flask.render_template('showtracks.html')


# @app.route('/showqueue.html')
# def showqueue():
#     return flask.render_template('showqueue.html')


# @app.route('/trackfile/<int:item_id>')
# def trackfile(item_id):
#     item = g.lib.get_item(item_id)
#     response = flask.send_file(item.path, as_attachment=False)
#     response.headers['Content-Length'] = os.path.getsize(item.path)
#     return response


# @app.route('/track.html')
# def track():
#     return flask.render_template('track.html')


# @app.route('/queuetrack.html')
# def queuetrack():
#     return flask.render_template('queuetrack.html')


# @app.route('/')
# def home():
#     return flask.render_template('index.html')


# @app.route('/showmetadata.html')
# def showmetadata():
#     return flask.render_template('showmetadata.html')


# Plugin hook.
class PartyZoneWebPlugin(BeetsPlugin):
    def __init__(self):
        super(PartyZoneWebPlugin, self).__init__()
        self.config.add({
            'host': u'127.0.0.1',
            'port': 8337,
            'cors': '',
        })

    def commands(self):
        cmd = ui.Subcommand('partyzone', help=u'start the partyzone Web interface')
        cmd.parser.add_option(u'-d', u'--debug', action='store_true',
                              default=False, help=u'debug mode')

        def func(lib, opts, args):
            args = ui.decargs(args)
            if args:
                self.config['host'] = args.pop(0)
            if args:
                self.config['port'] = int(args.pop(0))

            app.config['lib'] = lib
            # Enable CORS if required.
            if self.config['cors']:
                self._log.info(u'Enabling CORS with origin: {0}',
                               self.config['cors'])
                from flask.ext.cors import CORS
                app.config['CORS_ALLOW_HEADERS'] = "Content-Type"
                app.config['CORS_RESOURCES'] = {
                    r"/*": {"origins": self.config['cors'].get(str)}
                }
                CORS(app)
            # Start the web application.
            app.run(host=self.config['host'].get(unicode),
                    port=self.config['port'].get(int),
                    debug=opts.debug, threaded=True)
        cmd.func = func
        return [cmd]
