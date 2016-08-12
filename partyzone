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

print(gi.__file__)

@Pyro4.expose
class Player(object):

    def __init__(self, port, is_master=False, master_ip_address="127.0.0.1"):
        self.name = gethostname()
        self.port = int(port)
        self.is_master = is_master
        self._track_uri = None
        self.master_ip_address = master_ip_address
        #self.master_basetime = master_basetime
        
        if self.is_master:
            print("init master port %s" % self.port)
            self.system_clock = Gst.SystemClock.obtain()
            self.clock_provider = GstNet.NetTimeProvider.new(self.system_clock, self.master_ip_address, self.port)
            print("setting clock provider")
      
    @property
    def track(self):
        if not self._track_uri:
            raise Exception("No track set")
        return self._track_uri

    @track.setter
    def track(self, value):
        self._track_uri = value

    def get_master_ip_address(self):
        return self.master_ip_address

    def on_message(self, bus, message):
        #print(str(message))
        t = message.type
        if t == Gst.MessageType.EOS:
            #self.player.set_state(Gst.State.NULL)
            pass
        elif t == Gst.MessageType.ERROR:
            #self.player.set_state(Gst.State.NULL)
            err, debug = message.parse_error()
            print("Error: %s" % err, debug)

    def play(self, master_basetime=None):
        if self.is_master:
            if not self.clock_provider:
                print("No clock_provider set ?")

            self.base_time = self.clock_provider.get_property('clock').get_time()
            print("setting clock provider")
        else:
            self.base_time = master_basetime

        print("setting basetime to %s" % (self.base_time,))

        print("connecting to net clock %s:%s" % (self.master_ip_address, self.port))
        client_clock = GstNet.NetClientClock.new('clock', self.master_ip_address, self.port, 0)
        
        time.sleep(1.0) # Wait for the clock to stabilise

        self.playbin = Gst.ElementFactory.make('playbin', 'playbin')

        self.playbin.use_clock(client_clock)
        self.playbin.set_base_time(self.base_time)
        self.playbin.set_latency (1.0);   
        self.playbin.set_start_time(Gst.CLOCK_TIME_NONE)

        # wait until things stop
        bus =  self.playbin.get_bus()
        bus.add_signal_watch()
        bus.connect("message", self.on_message) 

        print("setting uri to %s" % (self.track,))
        self.playbin.set_property('uri', self.track)
        self.playbin.set_state(Gst.State.PLAYING)
        

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

    def stop(self):
        print("stop")
        self.playbin.set_state(Gst.State.NULL)


if __name__ == '__main__':

    parser = argparse.ArgumentParser(description='Syncronise music accross machines.')

    parser.add_argument('--playertype', type=str, dest='playertype', default='controller',
        help='player type. master or slave (default slave)')
    
    parser.add_argument('--port', type=int, dest='clock_port', default='5342',
        help='port used for the network clock')

    parser.add_argument('--host', type=str, help="Host ip you wish to bind to")

    args = parser.parse_args()

    Gst.init(sys.argv)

    register_name = None

    try:

        if args.playertype == "master":

            if not args.host:   
                raise AttributeError("host parameter required")

            player = Player(args.clock_port, is_master=True, master_ip_address=args.host)
 
            with Pyro4.Daemon(args.host) as daemon:
                player_uri = daemon.register(player)
                with Pyro4.locateNS() as ns:
                    register_name = "partyzone.masterplayer (%s)" % gethostname()
                    ns.register(register_name, player_uri)

                # add a Pyro event callback to the gui's mainloop
                player.install_pyro_event_callback(daemon)
                GObject.MainLoop().run()
        elif args.playertype == "slave":
            
            with Pyro4.Daemon(args.host) as daemon:
                with Pyro4.locateNS() as ns:
                    master_uri = list(ns.list(prefix="partyzone.masterplayer").values())[0]
                    #print(master_uri)
                    master = Pyro4.Proxy(master_uri)
                    print ("master ip :")
                    print(master.get_master_ip_address())
                    player = Player(args.clock_port, master_ip_address=master.get_master_ip_address(), is_master=False)
                    slave_uri = daemon.register(player)

                    register_name = "partyzone.slave (%s)" % gethostname()
                    ns.register(register_name, slave_uri)

                player.install_pyro_event_callback(daemon)
                GObject.MainLoop().run()
        
        else:  # Controller

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

                if not master:
                    print("No master player found")
                    sys.exit(0)

                master.track = "file:///home/glenn/devel/PartyZone/test.mp3"
                master.play()

                slaves[0].track = "file:///home/glenn/devel/PartyZone/test.mp3"
                slaves[0].play(master_basetime=master.get_basetime())
                #time.sleep(10)
                #slaves[0].stop()

                #master.track = args.uri
                #master.play()
                #master_player = Pyro4.Proxy("PYRONAME:partyzone.masterplayer")
                # Set the file uri to play
                #master_player.set_track(args.filepath)

    except KeyboardInterrupt:

        if register_name:
            with Pyro4.locateNS() as ns:
                ns.remove(name=register_name)

        sys.exit()
    

    
