#!/usr/bin/env python

from __future__ import (division, absolute_import, print_function,
                        unicode_literals)

import sys
import gi
import time
import signal
from socket import gethostname
import select
import argparse
import os
import os.path
import ujson as json

os.environ["PYRO_LOGFILE"] = "pyro.log"
os.environ["PYRO_LOGLEVEL"] = "DEBUG"

import Pyro4
from beets.plugins import BeetsPlugin
from beets.ui import Subcommand
from beets import ui
from beets import util

import tornado.ioloop
import tornado.web


class BaseHandler(tornado.web.RequestHandler):

    def set_default_headers(self):
        print("set_default_headers")
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        self.set_header("Access-Control-Allow-Headers", "Content-Type,Authorization")
        self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')

    def post(self):
        pass

    def get(self):
        pass

    def options(self):
        # no body
        self.set_status(204)
        self.finish()

    def prepare(self):
        if self.request.headers.get("Content-type", "").startswith("application/json"):
            self.json_args = json.loads(self.request.body)
        else:
            self.json_args = None

# class MainHandler(BaseHandler):
#     def get(self):
#         print(self.application)
#         #self.application.controller.play()
#         self.write("Hello, world")
        

class TrackFileHandler(BaseHandler):
    def get(self, param1):
        item_id = param1
        item = self.application.lib.get_item(item_id)
        #print(vars(item))
        #'format': u'MP3',
        self.set_header('Content-type', 'audio/mpeg')
        with open(item.path, 'rb') as f:
            data = f.read()
            self.write(data)
        self.finish()


class PlayFileHandler(BaseHandler):
    def get(self):
        data = self.json_args
        print(data)
        track_id = data['track_id']
        uri = 'http://' + unicode(g.host) + ':' + unicode(g.port) + '/trackfile/' + unicode(track_id)
        self.application.controller.play(uri)
        self.write({'return': 'ok'})
        self.finish()

class StopPlayHandler(BaseHandler):
    def get(self):
        self.application.controller.stop()
        self.write({'return': 'ok'})
        self.finish()

class VolumeHandler(BaseHandler):
    def get(self):
        self.application.controller.set_volume()  # TODO
        self.write({'return': 'ok'})
        self.finish()


class GetTracksHandler(BaseHandler):
    def get(self):
        tracks = []
        for item in self.application.lib.items():
            tracks.append(
                    {
                    'id': item.id,
                    'title': item.title,
                    'path': item.path,
                    'artist': item.artist,
                    'album': item.album
                    }
                )

        self.write({'items': tracks})
        self.finish()


class GetDevicesHandler(BaseHandler):
    def get(self):
        print("here")
        self.write({'devices': self.application.controller.get_devices()})
        self.finish()


class UpdateTrackHandler(BaseHandler):
    def get(self):
        data = request.get_json()
        item = data['item']
        db_item = self.application.lib.get_item(item['id'])
        db_item.update(item)
        db_item.try_sync(True, False)
        self.write({'return': 'ok'})
        self.finish()


@Pyro4.expose
class PlayerCallback(object):

    #@Pyro4.callback
    def play_started(self):
        print("callback: play started")

    #@Pyro4.callback
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
                            s = Pyro4.Proxy(uri)
                            if s.name is not None:
                                self.slaves.append(s)
                        except:
                            pass

                print("master: " + str(self.master))
                print("slaves: " + str(self.slaves))

            #files = self.get_files()
            #print(files)

        def get_devices(self):
            devices = [self.master]
            devices.extend(self.slaves)
            return devices

        def get_files(self):
            for root, dirs, files in os.walk(self._directory):
                return [ file for file in files if file.endswith( ('.mp3', '.wav', '.ogg') ) ]

        def set_volume(self):   # TODO
            pass

        def play_done(self):
            print("callback: play done")

        def play(self, uri):
            self.master.track = uri
            self.master.play()

            self.master.play()

            for slave in self.slaves:
                slave.play(master_basetime=master.get_basetime())

        def stop(self):
            self.master.stop()

            for slave in self.slaves:
                slave.stop()


    def __init__(self):
        super(PartyZoneWebPlugin, self).__init__()
        self.config.add({
            'host': u'127.0.0.1',
            'port': "5000",
        })

    def pyro_event(self):
        while True:
            #print(self.daemon.sockets)
            # for as long as the pyro socket triggers, dispatch events
            s, _, _ = select.select(self.daemon.sockets, [], [], 0.01)
            if s:
                print(s)
                print("event")
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
                self.config['pyro_host'] = args.pop(0)
                self.config['port'] = args.pop(0)

            print(self.config['host'])

            root = os.path.dirname(__file__)

            app = tornado.web.Application([
                    #(r"/", MainHandler),
                    (r"/playtrack$", PlayFileHandler),
                    (r"/tracks$", GetTracksHandler),      
                    (r"/stop$", StopPlayHandler),
                    (r"/adjust_volume$", VolumeHandler),
                    (r"/get_devices$", GetDevicesHandler),
                    (r"/update$", UpdateTrackHandler),
                    (r"/trackfile/([0-9]+)", TrackFileHandler),
                    (r"/(.*)", tornado.web.StaticFileHandler, {"path": root, "default_filename": "index.html"}),
                    
                ], debug=True)

            app.lib = lib
            app.host = str(self.config['host'])
            app.pyro_host = str(self.config['pyro_host'])
            app.port = int(str(self.config['port'])) # Need to convert Subview to str before casting to int

            app.listen(app.port, address=app.host)
            app.controller = PartyZoneWebPlugin.Controller()
            
            app.player_callback = PlayerCallback()
            
            with Pyro4.core.Daemon(str(self.config['host']), port=8888) as daemon:
                self.daemon = daemon
                uri = daemon.register(app.player_callback)
                app.controller.master.set_callback_uri(uri)
                print(uri)

                tornado.ioloop.PeriodicCallback(self.pyro_event, 20).start()
                tornado.ioloop.IOLoop.instance().start()

        cmd.func = func
        return [cmd]






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