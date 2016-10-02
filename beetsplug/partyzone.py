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
# import flask
from beets.plugins import BeetsPlugin
from beets.ui import Subcommand
from beets import ui
from beets import util
# from flask import Flask, g, jsonify, request
# from werkzeug.routing import BaseConverter, PathConverter
# from socket import gethostname


import tornado.ioloop
import tornado.web

class BaseHandler(tornado.web.RequestHandler):

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')

    def post(self):
        pass

    def get(self):
        pass

    def options(self):
        # no body
        self.set_status(204)
        self.finish()

class MainHandler(BaseHandler):
    def get(self):
        print(self.application)
        self.write("Hello, world")


# def make_app():
#     return tornado.web.Application([
#         (r"/", MainHandler),
#     ])


class PlayerCallback(object):

    @Pyro4.callback
    def play_done(self):
        print("callback: play done")

# Plugin hook.
class PartyZoneWebPlugin(BeetsPlugin):

    

    class Controller(object):
        def __init__(self, directory = None):
            with Pyro4.locateNS() as ns:
                players = ns.list(prefix="partyzone")
                self.master = None
                self.slaves = []
                for name, uri in players.items():
                    if "partyzone.masterplayer" in name:
                        self.master = Pyro4.Proxy(uri)
                    else:
                        try:
                            # If we can't call name slave is not there
                            if slave.name is not None:
                                self.slaves.append(Pyro4.Proxy(uri))
                        except:
                            pass

                print("master: " + str(self.master))
                print("slaves: " + str(self.slaves))

            #files = self.get_files()
            #print(files)

        def get_files(self):
            for root, dirs, files in os.walk(self._directory):
                return [ file for file in files if file.endswith( ('.mp3', '.wav', '.ogg') ) ]

        def play_done(self):
            print("callback: play done")

        def play(self):
            self.master.play()

            for slave in self.slaves:
                slave.play(master_basetime=master.get_basetime())

    def __init__(self):
        super(PartyZoneWebPlugin, self).__init__()
        self.config.add({
            'host': u'127.0.0.1',
            'port': "5000",
        })

    def pyro_event(self):
        while True:
            # for as long as the pyro socket triggers, dispatch events
            s, _, _ = select.select(self.daemon.sockets, [], [], 0.01)
            if s:
                self.daemon.events(s)
            else:
                # no more events, stop the loop, we'll get called again soon anyway
                break

    def commands(self):
        cmd = ui.Subcommand('partyzone', help=u'start the partyzone Web interface')
        cmd.parser.add_option(u'-d', u'--debug', action='store_true',
                              default=False, help=u'debug mode')

        def func(lib, opts, args):
            args = ui.decargs(args)
            if args:
                self.config['host'] = args.pop(0)
                self.config['port'] = args.pop(0)

            #app = make_app()

            app = tornado.web.Application([
                    (r"/", MainHandler),
                  ])

            # Need to convert Subview to str before casting to int
            app.listen(int(str(self.config['port'])), address=str(self.config['host']))
            app.controller = PartyZoneWebPlugin.Controller()
            #app.player_callback = PartyZoneWebPlugin.PlayerCallback()
            app.player_callback = PlayerCallback()
            #app.controller.master.set_callback(app.player_callback)

                #daemon = Pyro4.core.Daemon(args.host)
                # register the object in the daemon and let it get a new objectId
                # also need to register in name server because it's not there yet.
                #uri = daemon.register(player)

            daemon=Pyro4.core.Daemon()
            self.daemon = daemon
            daemon.register(app.player_callback)

            # with Pyro4.core.Daemon() as daemon:
            #     app.daemon = daemon
            #     daemon.register(app.player_callback)

            tornado.ioloop.PeriodicCallback(self.pyro_event, 20).start()
            tornado.ioloop.IOLoop.instance().start()

        cmd.func = func
        return [cmd]























# Load default config and override config from an environment variable
# app.config.update(dict(
#     DATABASE=os.path.join(app.root_path, 'flaskr.db'),
#     SECRET_KEY='development key',
#     USERNAME='admin',
#     PASSWORD='default'
# ))
# app.config.from_envvar('FLASKR_SETTINGS', silent=True)

# @app.before_request
# def before_request():
#    g.lib = app.config['lib']
#    g.host = app.config['host']
#    g.port = app.config['port']

# @app.after_request
# def after_request(response):
#   response.headers.add('Access-Control-Allow-Origin', '*')
#   response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
#   response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
#   return response

# @app.route('/')
# def index():
#     return flask.render_template('index.html')

# @app.route('/trackfile/<int:item_id>')
# def trackfile(item_id):
#     item = g.lib.get_item(item_id)
#     response = flask.send_file(item.path, as_attachment=False)
#     response.headers['Content-Length'] = os.path.getsize(item.path)
#     return response

# @app.route('/playtrack', methods= ['POST'])
# def play():

#     data = request.get_json()

#     print(data)

#     track_id = data['track_id']
#     uri = 'http://' + unicode(g.host) + ':' + unicode(g.port) + '/trackfile/' + unicode(track_id)

#     print(uri)

#     #master.track = uri
#     #master.play()

#     print(slaves)

#     print(master.get_basetime())

#     slaves[0].track = uri
#     slaves[0].play(master_basetime=master.get_basetime())

#     slaves[1].track = uri
#     slaves[1].play(master_basetime=master.get_basetime())

#              #   time.sleep(10)
#              #   slaves[0].stop()

# #                 #master_player = Pyro4.Proxy("PYRONAME:partyzone.masterplayer")
# #                 # Set the file uri to play
# #                 #master_player.set_track(args.filepath)
#     return jsonify({'return': 'ok'})

# @app.route('/stop')
# def stop():
#     master.stop()
#     slaves[0].stop()
#     return jsonify({'return': 'ok'})

# @app.route('/get_devices', methods=['GET'])
# def get_devices():
#     players = ns.list(prefix="partyzone").items()
#     return jsonify({'devices': players})


# # @app.route('/create_zone', methods= ['POST'])
# # def create_zone():
# #     data = request.get_json()
# #     devices = data.get('selected_devices', [])
# #     allplayerController.CreateZone(devices)
# #     return jsonify({'return': 'ok'})


# # @app.route('/play', methods= ['POST'])
# # def play():
# #     data = request.get_json()
# #     allplayerController.SetQueue(data['queue'])
# #     player = allplayerController.GetPlayer()
# #     state, position = player.GetPlayingState()
# #     if state == "paused":
# #         player.Resume()
# #     else:
# #         allplayerController.PlayQueue()
# #     return jsonify({'return': 'ok'})


# # @app.route('/adjust_volume', methods=['POST'])
# # def adjust_volume():
# #     data = request.get_json()
# #     device_id = data.get('device_id', None)
# #     volume = data.get('volume')
# #     allplayerController.SetVolume(device_id, volume)
# #     return jsonify({'return': 'ok'})





# # @app.route('/pause')
# # def pause():
# #     player = allplayerController.GetPlayer()
# #     state, position = player.GetPlayingState()
# #     if state.lower() == "paused":
# #         player.Resume()
# #     else:
# #         player.Pause()
# #     return jsonify({'return': 'ok'})


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


# # @app.route('/showtracks.html')
# # def showtracks():
# #     return flask.render_template('showtracks.html')


# # @app.route('/showqueue.html')
# # def showqueue():
# #     return flask.render_template('showqueue.html')


# # @app.route('/trackfile/<int:item_id>')
# # def trackfile(item_id):
# #     item = g.lib.get_item(item_id)
# #     response = flask.send_file(item.path, as_attachment=False)
# #     response.headers['Content-Length'] = os.path.getsize(item.path)
# #     return response


# # @app.route('/track.html')
# # def track():
# #     return flask.render_template('track.html')


# # @app.route('/queuetrack.html')
# # def queuetrack():
# #     return flask.render_template('queuetrack.html')


# # @app.route('/')
# # def home():
# #     return flask.render_template('index.html')


# # @app.route('/showmetadata.html')
# # def showmetadata():
# #     return flask.render_template('showmetadata.html')


# # Plugin hook.
# class PartyZoneWebPlugin(BeetsPlugin):
#     def __init__(self):
#         super(PartyZoneWebPlugin, self).__init__()
#         self.config.add({
#             'host': u'127.0.0.1',
#             'port': 5000,
#         })

#     def commands(self):
#         cmd = ui.Subcommand('partyzone', help=u'start the partyzone Web interface')
#         cmd.parser.add_option(u'-d', u'--debug', action='store_true',
#                               default=False, help=u'debug mode')

#         def func(lib, opts, args):
#             args = ui.decargs(args)
#             if args:
#                 self.config['host'] = args.pop(0)
#             if args:
#                 self.config['port'] = int(args.pop(0))

#             app.config['lib'] = lib
#             app.config['host'] = self.config['host']
#             app.config['port'] = self.config['port']

#             # Start the web application.
#             app.run(host='0.0.0.0',
#                     port=self.config['port'].get(int),
#                     debug=opts.debug, threaded=True)
#         cmd.func = func
#         return [cmd]


# class readable_dir(argparse.Action):
#     def __call__(self,parser, namespace, values, option_string=None):
#         prospective_dir=values
#         if not os.path.isdir(prospective_dir):
#             raise argparse.ArgumentTypeError("readable_dir:{0} is not a valid path".format(prospective_dir))
#         if os.access(prospective_dir, os.R_OK):
#             setattr(namespace,self.dest,prospective_dir)
#         else:
#             raise argparse.ArgumentTypeError("readable_dir:{0} is not a readable dir".format(prospective_dir))


# if __name__ == '__main__':

#     # This plays music in a specified directory

#     parser = argparse.ArgumentParser(description='Syncronise music accross machines.')

#     parser.add_argument('-r', '--recursive-play', dest='recursive', action=readable_dir, default=None, help="Directory of items to recursively play")

#     args = parser.parse_args()

#     print("Playing dir: " + args.recursive)
#     print("host: " + str(args.host))

#     if args.recursive:

#         # Recursive directory player
#         with Pyro4.locateNS() as ns:
#             players = ns.list(prefix="partyzone")
#             master = None
#             slaves = []
#             for name, uri in players.items():
#                 if "partyzone.masterplayer" in name:
#                     master = Pyro4.Proxy(uri)
#                 else:
#                     slaves.append(Pyro4.Proxy(uri))

#             print("master: " + str(master))
#             print("slaves: " + str(slaves))

#             if not master:
#                 print("No master player found")
#                 sys.exit(0)

#         print("Playing dir: " + args.recursive)
        
#         controller = Controller(master, slaves, args.recursive)
        
#         with Pyro4.core.Daemon() as daemon:
#             daemon.register(controller)
        
#             # add a Pyro event callback to the gui's mainloop
#             #controller.install_pyro_event_callback(daemon)
#             #GObject.MainLoop().run()
#             daemon.requestLoop()