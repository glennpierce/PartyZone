#!/usr/bin/env python

from __future__ import (division, absolute_import, print_function,
                        unicode_literals)

import sys
import socket
import gi
import time
import signal
from socket import gethostname
import select
import argparse
import os
import os.path
import requests
import glob
import traceback
import codecs
import ujson as json

#os.environ["PYRO_LOGFILE"] = "pyro.log"
#os.environ["PYRO_LOGLEVEL"] = "DEBUG"

import Pyro4
from beets.plugins import BeetsPlugin
from beets.ui import Subcommand
from beets import ui
from beets import util

import tornado.ioloop
import tornado.web

from os.path import expanduser
home = expanduser("~")
playlist_dir = os.path.join(home, '.config', 'partyzone', 'playlists')

if not os.path.exists(playlist_dir):
    os.makedirs(playlist_dir)

class BaseHandler(tornado.web.RequestHandler):

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header("Access-Control-Allow-Headers", "x-requested-with")
        self.set_header("Access-Control-Allow-Headers", "Accept,Content-Type,Authorization")
        self.set_header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT, OPTIONS")
        self.set_header("Content-Type", "application/json") 

    def send_error(self, status_code=500, **kwargs):
        if 'exc_info' in kwargs:
            exception = kwargs['exc_info'][1]
            print(exception)
            print(traceback.format_exc())
        return super(BaseHandler, self).send_error(status_code=status_code, **kwargs)

    def write_error(self, status_code, **kwargs):
        print ('In get_error_html. status_code: %s' % (status_code,))
        if status_code in [403, 404, 500, 503]:
            self.write('Error %s' % status_code)
        else:
            self.write('BOOM!')

    def post(self):
        pass

    def get(self):
        pass

    def options(self, *args, **kwargs):
    #def options(self):
        # no body
        self.set_status(204)
        self.finish()

    def prepare(self):
        self.json_args = None
        if self.request.headers.get("Content-Type", "").startswith("application/json"):
            try:
                self.json_args = json.loads(self.request.body)
            except Exception as ex:
                print(str(ex))


# class MainHandler(BaseHandler):
#     def get(self):
#         print(self.application)
#         #self.application.controller.play()
#         self.write("Hello, world")
        

class TrackFileHandler(BaseHandler):
    "Returns an audio file as a stream for gstreamer"
    def get(self, param1):
        track_id = param1
        item = self.application.lib.get_item(int(track_id))
        uri = item['path']
        print("TrackFileHandler: track_id %s  uri %s" % (track_id, uri))
        #'format': u'MP3',
        self.set_header('Content-type', 'audio/mpeg')
        with open(uri, 'rb') as f:
            data = f.read()
            self.write(data)
        self.finish()

class SetQueueModeHandler(BaseHandler):
    def post(self):
        data = self.json_args
        if not data:
            return
        self.application.controller.queue_mode = data['mode']
        print("setting queue mode to %s" % (self.application.controller.queue_mode,))
        self.write({'return': 'ok'})
        self.finish()

class ResetQueueHandler(BaseHandler):
    def post(self):
        self.application.controller.reset_queue()
        print("resetting queue")
        self.write({'return': 'ok'})
        self.finish()

class EmptyQueueHandler(BaseHandler):
    def post(self):
        self.application.controller.empty_queue()
        print("emptying queue")
        self.write({'return': 'ok'})
        self.finish()

class AddToQueueHandler(BaseHandler):
    def post(self):
        data = self.json_args
        if not data or data.get('track_id', None) == None:
            self.write({'return': 'error', 'message': 'No track_id'})
            self.finish()
            return
        self.application.controller.add_to_queue(data['track_id'])
        info = "adding track_id %s (%s) to queue" % (data['track_id'],data['path'])
        print(info.encode('ascii', 'ignore'))
        self.write({'return': 'ok'})
        self.finish()

class SetPlayersActiveHandler(BaseHandler):
    def post(self):
        print("SetPlayersActiveHandler")
        data = self.json_args
        #print(data)
        #print(data)
        #{u'devices': [{u'selected': True, u'id': u'PYRO:obj_9028e59851cf4af5b4206363e3c8a2b4@192.168.1.6:39946'}, 
        #              {u'selected': True, u'id': u'PYRO:obj_524ad7477ca74bd8a5bdeac0c3f6e989@192.168.1.128:36172'}]}
        #{u'devices': [{u'selected': True, u'id': u'PYRO:obj_e650cbd7dfd34570ad2c12134c5b2d2f@192.168.1.6:50994'}]}
        for device in data['devices']:
            print("set_device_active %s to %s" % (device['id'], device['selected']))
            self.application.controller.set_device_active(device['id'], device['selected'])

        self.write({'return': 'ok'})
        self.finish()

class PlayFileHandler(BaseHandler):
    def post(self):
        data = self.json_args
        track_id = data['track_id']
        uri = self.application.controller.track_id_to_uri(track_id)
        print(uri)
        self.application.controller.play(uri)
        self.write({'return': 'ok'})
        self.finish()

class PlayQueueFileHandler(BaseHandler):
    def post(self):
        next_track = self.application.controller.next_track()
        print(next_track)
        if next_track:
            uri = self.application.controller.track_id_to_uri(next_track)
            self.application.controller.play(uri)
            self.write({'return': 'ok'})
            self.finish()

class StopPlayHandler(BaseHandler):
    def post(self):
        try:
            self.application.controller.stop()
            self.write({'return': 'ok'})
            print("finish stop")
            self.finish()
        except Exception as ex:
            print(str(ex))

class VolumeHandler(BaseHandler):
    def get(self):
        self.application.controller.set_volume()  # TODO
        self.write({'return': 'ok'})
        self.finish()

class GetTracksHandler(BaseHandler):
    def get(self):
        self.content_type = 'application/json'
        tracks = []
        for item in self.application.lib.items():
            tracks.append(
                    {
                    'id': item.id,
                    'title': item.title,
                    'path': item.path,
                    'artist': item.artist,
                    'album': item.album,
                    'album_id': item.album_id,
                    'year': item.year,
                    }
                )

        self.write({'items': tracks})
        self.finish()


class GetAlbumsHandler(BaseHandler):
    def get(self):
        self.content_type = 'application/json'
        albums = []
        for album in self.application.lib.albums():
            #print(vars(album))
            albums.append(
                     {
                      'id': italbumem.id,
                      'album': album.album,
                      'albumartist': album.albumartist,
                      'albumtype': album.albumtype,
                      'artpath': album.artpath
                     }
                 )

        self.write({'albums': albums})
        self.finish()

class GetPlaylistsHandler(BaseHandler):
    def get(self):
        #self.content_type = 'application/json'
	playlist_names = glob.glob(playlist_dir + '/*')
        playlist_names = [{'value' : p, 'name' : os.path.split(p)[1]} for p in playlist_names]
        print(playlist_names)
        self.write({'items': playlist_names})
        self.finish()

class GetPlaylistHandler(BaseHandler):
    def get(self, name):
        #if not entry: raise tornado.web.HTTPError(404)
        playlist = os.path.join(playlist_dir, name)
        self.content_type = 'application/json'
        lines = codecs.open(playlist, 'r', encoding='utf-8').readlines()
        tracks = []
        for l in lines:
            fields = [f.strip() for f in l.split(',')]
            tracks.append(
                          {
                              'id': fields[0],
                              'title': fields[1],
                              'artist': fields[2],
                              'album': fields[3],
                              'path': fields[4],
                          }
                      )
        self.write({'items': tracks})
        self.finish()

class SavePlaylistHandler(BaseHandler):
    def post(self):
        data = self.json_args
        name = data['name']
        tracks = data.get('tracks', None)
        playlist = os.path.join(playlist_dir, name)
        self.content_type = 'application/json'
        with codecs.open(playlist, 'w', encoding='utf-8') as f:
            for t in tracks:
                f.write("%s,%s,%s,%s,%s\n" % (t['id'], t['title'], t['artist'], t['album'], t['path']))
        self.write({'return': 'ok'})
        self.finish()


class GetDevicesHandler(BaseHandler):
    def get(self):
        print("GetDevicesHandler")
        self.application.controller.rediscover()
        self.content_type = 'application/json'
        self.write({'devices': [(i.uri, i.proxy.name) for i in self.application.controller.get_devices()]})
        self.finish()

class RediscoverDevicesHandler(BaseHandler):
    def post(self):
        print("RediscoverDevicesHandler")
        self.content_type = 'application/json'
        self.application.controller.rediscover()
        self.write({'return': 'ok'})
        self.finish()

class UpdateTrackHandler(BaseHandler):
    def post(self):
        data = self.json_args
        item = data['item']
        db_item = self.application.lib.get_item(item['id'])
        db_item.update(item)
        db_item.try_sync(True, False)
        self.write({'return': 'ok'})
        self.finish()


class Device(object):
    def __init__(self, uri, proxy=None):
        self.active = True
        self.uri = uri
        self.active = False
        if proxy:
            self.proxy = proxy
        else:
            self.proxy = Pyro4.Proxy(self.uri)

    def __repr__(self):
        return self.proxy.name

@Pyro4.expose
class PlayerCallback(object):

    def __init__(self, app):
        self.application = app

    @Pyro4.callback
    @Pyro4.oneway
    def play_started(self, name):
        pass
        #print("callback: play started")

    @Pyro4.callback
    @Pyro4.oneway
    def play_done(self, name):

        active_devices = self.application.controller.active_devices()

        print("play_done: name : %s active_devices: %s" % (name, str(active_devices)))

        if not active_devices:
            return

        first_active_device = active_devices[0]

        if first_active_device.proxy.name != name:
            # Just respond to one play done signal for one device
            return

        print("callback: play done from %s" % (name,))
        if self.application.controller.queue_mode:
            next_track = self.application.controller.next_track()
            if next_track:
                uri = self.application.controller.track_id_to_uri(next_track)
                print("playing next track " + uri)
                self.application.controller.play(uri)
	    else:
                self.application.controller.reset_queue()
        else:
            print("not in queue mode. stopping")


# Plugin hook.
class PartyZoneWebPlugin(BeetsPlugin):

    class Controller(object):
 
        def __discover(self, base_url=None, callback_uri=None, directory=None):
            self.queue_mode = False
            self.__queue = []
            self.__queue_iter = iter(self.__queue)
            self.base_url = base_url
            self.directory = directory
            self.callback_uri = callback_uri
            self.players = []

            self.stop()

            with Pyro4.locateNS() as ns:
                players = ns.list(prefix="partyzone.players")
                for name, uri in players.items():
                    try:
                        # If we can't call name slave is not there
                        s = Pyro4.Proxy(uri)
                        #s.set_callback_uri(uri)
                        if s.name is not None:
                            self.players.append(Device(uri, s))
                    except:
                        pass

                print("players: " + str(self.players))
             
                for p in self.players:
                    p.proxy.test()
                    p.proxy.set_callback_uri(callback_uri)

        def rediscover(self):
            return self.__discover(self.base_url, self.callback_uri, self.directory)

        def __init__(self, base_url=None, callback_uri=None, directory=None):
            return self.__discover(base_url, callback_uri=callback_uri, directory=directory)

        def set_device_active(self, uri, active):
            try:
                device = next((x for x in self.players if x.uri == uri), None)

                if active == device.active:
                    return

                device.active = active
                
                print("setting player device %s active to %s\n" % (device.proxy.name, device.active))
                if not device.active:
                    print("device set to active false. stopping play")
                    device.proxy.stop()
                else:
                    # Check whether other devices are playing if so play the newly activated one
                    playing_devices = self.playing_devices()
                    print("playing devices " + str(playing_devices))
                    if self.any_playing_devices():
                        if not device.proxy.is_playing():
                            other_device = playing_devices[0].proxy
                            print("other device playing " + other_device.name)
                            device.proxy.stop() 
		 	    print("setting track playing to other playing track %s" % (other_device.track,))
                            device.proxy.track = other_device.track 
                            basetime = other_device.get_basetime()
                            print("got basetime %s from other playing player" % (basetime,))
                            device.proxy.play(basetime)
                        else:
                            print("no other devices playing")

                #print("setting player device %s active to %s\n" % (device.proxy.name, device.active))
                #if not device.active:
                #    print("device set to active false. pausing play")
                #    device.proxy.pause(True)
                #else:

                #    if device.proxy.is_paused():
                #        device.proxy.pause(False)
                #        return 

		#    # Ok player has not been previously paused we need to try to play the stream but 
                #    # at the same point as any other playing devices
                #    # Check whether other devices are playing if so play the newly activated one
                #    playing_devices = self.playing_devices()
                #    print("playing devices " + str(playing_devices))
                #    if self.any_playing_devices():
                #        if not device.proxy.is_playing():
                #            other_device = playing_devices[0].proxy
                #            print("other device playing " + other_device.name)
                #            print("setting track playing to other playing track %s" % (other_device.track,))
                #            device.proxy.track = other_device.track
                #            basetime = other_device.get_basetime()
                #            print("got basetime %s from other playing player" % (basetime,))
                #            device.proxy.play(basetime)
                #        else:
                #            print("no other devices playing")

            except Exception as ex:
                print(str(ex))
                print(traceback.format_exc())
                pass  

        def get_devices(self):
            return self.players

        def active_devices(self):
            print("players: %s" % (self.players,))
            return [p for p in self.players if p.active]

        def playing_devices(self):
            return [p for p in self.active_devices() if p.proxy.is_playing()]

        def any_playing_devices(self):
            return any([p.proxy.is_playing() for p in self.active_devices()])

        def get_files(self):
            for root, dirs, files in os.walk(self._directory):
                return [ file for file in files if file.endswith( ('.mp3', '.wav', '.ogg') ) ]

        def set_volume(self):   # TODO
            pass

        def track_id_to_uri(self, track_id):
            return self.base_url + '/trackfile/' + unicode(track_id)

        def play(self, uri):
            p = self.players[0]
            p.proxy.track = uri
            print("setting basetime for %s to None" % (p.proxy.name,))
            basetime = p.proxy.play(None)

            for p in self.players[1:]:
                if not p.active:
                    continue
                p.proxy.track = uri
                print("setting basetime for %s to %s" % (p.proxy.name, str(basetime)))
                #p.proxy.play(basetime)
                p.proxy.play_no_wait(basetime)

        def pause(self):
            "Pause all players"
            pass

        def stop(self):
            for p in self.players:
                p.proxy.stop()

        def add_to_queue(self, url):
            print("adding to queue:" + url)
            self.__queue.append(url)

        def next_track(self):
            try:
                return self.__queue_iter.next()
            except StopIteration as ex:
                self.reset_queue()
                return None

        def reset_queue(self):
            self.__queue_iter = iter(self.__queue)

        def empty_queue(self):
            self.__queue = []
            self.__queue_iter = iter(self.__queue)

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

    def get_host(self):
        while True:  # Debian at least fails dns at startup with systemd. Even specifying after network
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.connect(('google.com', 0))
                default_host = s.getsockname()[0]
                return default_host
            except Exception as ex:
                print(str(ex))
                time.sleep(5)


    def commands(self):

        cmd = ui.Subcommand('partyzone', help=u'start the partyzone Web interface')
        cmd.parser.add_option(u'-d', u'--debug', action='store_true',
                              default=False, help=u'debug mode')

        def func(lib, opts, args):
            args = ui.decargs(args)
            if args:
                self.config['host'] = args.pop(0)
                self.config['port'] = args.pop(0)

            print(self.config['host'])

            root = os.path.dirname(__file__)

            app = tornado.web.Application([
                    #(r"/", MainHandler),     
                    #(r"/rediscover_devices$", RediscoverDevicesHandler),
                    (r"/set_active_players$", SetPlayersActiveHandler),
                    (r"/set_queue_mode$", SetQueueModeHandler),
                    (r"/add_to_queue$", AddToQueueHandler),
                    (r"/reset_queue$", ResetQueueHandler),
                    (r"/empty_queue$", EmptyQueueHandler),
                    (r"/playtrack$", PlayFileHandler),
                    (r"/playqueue$", PlayQueueFileHandler),         
                    (r"/tracks$", GetTracksHandler),     
                    (r"/albums$", GetAlbumsHandler), 
                    (r"/stop$", StopPlayHandler),
                    (r"/adjust_volume$", VolumeHandler),
                    (r"/get_devices$", GetDevicesHandler),
                    (r"/update$", UpdateTrackHandler),
                    (r"/trackfile/([0-9]+)", TrackFileHandler),
                    (r"/playlists$", GetPlaylistsHandler),
                    (r"/playlist/([^/]*)", GetPlaylistHandler),
                    (r"/save_playlist$", SavePlaylistHandler),
                    (r"/(.*)", tornado.web.StaticFileHandler, {"path": root, "default_filename": "index.html"}),
                    
                ], debug=False)

            app.lib = lib
            app.host = str(self.config['host'])
            app.port = int(str(self.config['port'])) # Need to convert Subview to str before casting to int
            app.local_ip = self.get_host()

            app.listen(app.port, address="0.0.0.0")
            
            app.player_callback = PlayerCallback(app)
           
            with Pyro4.core.Daemon(app.local_ip, port=8888) as daemon:
                self.daemon = daemon
                uri = daemon.register(app.player_callback)
                app.controller = PartyZoneWebPlugin.Controller(base_url='http://' + unicode(app.local_ip) + ':' + unicode(app.port),
                                                               callback_uri = uri)
                tornado.ioloop.PeriodicCallback(self.pyro_event, 20).start()
                tornado.ioloop.IOLoop.instance().start()

        cmd.func = func
        return [cmd]


if __name__ == "__main__":
    app = tornado.web.Application([
                    (r"/save_playlist$", SavePlaylistHandler),
                ], debug=True)

    app.listen(5000, address="0.0.0.0")
    tornado.ioloop.IOLoop.instance().start()

