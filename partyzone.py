#!/usr/bin/env python3

import sys
import gi
import time
import signal
import select
import Pyro4
import argparse
import os
import os.path
gi.require_version('Gst', '1.0')
gi.require_version('GstNet', '1.0')
from gi.repository import GObject, Gst, GstNet
from socket import gethostname


@Pyro4.expose
class Player(object):

    def __init__(self, port, is_master=False, ip_address="127.0.0.1", master_basetime=None):
        self.name = gethostname()
        self.port = int(port)
        self.is_master = is_master
        self._track_uri = None
        self.ip_address = ip_address
        self.master_basetime = master_basetime
        
    def set_track(self, track_uri):
        self._track_uri = track_uri

    def get_ip_address(self):
        print(Pyro4.current_context.client.sock.getpeername())
        return Pyro4.current_context.client.sock.getpeername()[0]

    def get_basetime(self):
        return self.base_time

    #def set_name(self, name):
    #    self._name = name

    @property
    def track(self):
        if not self._track_uri:
            raise Exception("No track set")

        return self._track_uri

    #@property
    #def name(self):
    #    if not self._name:
    #        raise Exception("No speaker name set")
    #
    #    return self._name

    def play(self):
        raise NotImplementedError()

    def stop(self):
        raise NotImplementedError()

    def on_message(self, bus, message):
        t = message.type
        if t == Gst.MessageType.EOS:
            #self.player.set_state(Gst.State.NULL)
            pass
        elif t == Gst.MessageType.ERROR:
            #self.player.set_state(Gst.State.NULL)
            err, debug = message.parse_error()
            print("Error: %s" % err, debug)

    def initialise(self):
        
        if self.is_master:
            system_clock = Gst.SystemClock.obtain()
            clock_provider = GstNet.NetTimeProvider.new(system_clock, None, self.port)
            self.base_time = clock_provider.get_property('clock').get_time()
        else:
            self.base_time = self.master_basetime

        print("connecting to net clock %s:%s" % (self.ip_address, self.port))
        client_clock = GstNet.NetClientClock.new('clock', self.ip_address, self.port, 0)
        
        time.sleep(1.0) # Wait for the clock to stabilise

        self.playbin = Gst.ElementFactory.make('playbin', 'playbin')
        #self.playbin.set_property('uri', self.track)

        self.playbin.use_clock(client_clock)
        self.playbin.set_base_time(self.base_time)
        self.playbin.set_start_time(Gst.CLOCK_TIME_NONE)
        self.playbin.set_latency (0.5);   

        # wait until things stop
        bus =  self.playbin.get_bus()
        bus.add_signal_watch()
        bus.connect("message", self.on_message) 


    def install_pyro_event_callback(self, daemon):
        """
        Add a callback to the tkinter event loop that is invoked every so often.
        The callback checks the Pyro sockets for activity and dispatches to the
        daemon's event process method if needed.
        """

        def pyro_event():
            while True:
                # for as long as the pyro socket triggers, dispatch events
                s, _, _ = select.select(daemon.sockets, [], [], 0.01)
                if s:
                    daemon.events(s)
                else:
                    # no more events, stop the loop, we'll get called again soon anyway
                    break
            GObject.timeout_add(20, pyro_event)

        GObject.timeout_add(20, pyro_event)

    def get_basetime(self):
        return self.base_time

    def state(self):
        return self.playbin.get_state()

    def play(self):
        # Go through each client or slave and start play
        print("play")
        self.playbin.set_property('uri', self.track)
        self.playbin.set_state(Gst.State.PLAYING)

    def stop(self):
        print("stop")
        self.playbin.set_state(Gst.State.NULL)



if __name__ == '__main__':

    parser = argparse.ArgumentParser(description='Syncronise music accross machines.')

    parser.add_argument('--playertype', type=str, dest='playertype', default='controller',
        help='player type. master or slave (default slave)')
    
    parser.add_argument('--port', type=int, dest='clock_port', default='5342',
        help='port used for the network clock')

    #parser.add_argument('name')

    args = parser.parse_args()
    #args.filepath = os.path.abspath(args.name)

    Gst.init(sys.argv)

    register_name = None

    try:

        if args.playertype == "master":
            player = Player(args.clock_port, is_master=True)
            #player.set_name(args.name)

            with Pyro4.Daemon() as daemon:
                player_uri = daemon.register(player)
                with Pyro4.locateNS() as ns:
                    register_name = "partyzone.masterplayer (%s)" % gethostname()
                    ns.register(register_name, player_uri)
                player.initialise()
                #print("player running.", player_uri)

                # add a Pyro event callback to the gui's mainloop
                player.install_pyro_event_callback(daemon)
                GObject.MainLoop().run()
        elif args.playertype == "slave":
            
            with Pyro4.Daemon() as daemon:
                with Pyro4.locateNS() as ns:
                    master_uri = list(ns.list(prefix="partyzone.masterplayer").values())[0]
                    #print(master_uri)
                    master = Pyro4.Proxy(master_uri)
                    player = Player(args.clock_port, ip_address=master.get_ip_address(), is_master=False, master_basetime=master.get_basetime())
                    slave_uri = daemon.register(player)

                    register_name = "partyzone.slave (%s)" % gethostname()
                    ns.register(register_name, slave_uri)
                    
                player.initialise()
                player.install_pyro_event_callback(daemon)
                GObject.MainLoop().run()
        
        else:  # Controller

            with Pyro4.locateNS() as ns:
                players = ns.list(prefix="partyzone")
                print(players)
                #master_player = Pyro4.Proxy("PYRONAME:partyzone.masterplayer")
                # Set the file uri to play
                #master_player.set_track(args.filepath)

    except KeyboardInterrupt:

        if register_name:
            with Pyro4.locateNS() as ns:
                ns.remove(name=register_name)

        sys.exit()
    

    
