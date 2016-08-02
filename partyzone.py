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


@Pyro4.expose
class Player(object):

    def __init__(self):
        pass

    def set_track(self, track_path):
        raise NotImplementedError()

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


@Pyro4.expose
class MasterPlayer(Player):

    def __init__(self):
        self.clients = []

    def initialise(self, uri, port):
        port = int(port)

        system_clock = Gst.SystemClock.obtain()
        clock_provider = GstNet.NetTimeProvider.new(system_clock, None, port)
        client_clock = GstNet.NetClientClock.new('clock', "127.0.0.1", port, 0)
        
        time.sleep(0.5) # Wait 0.5 seconds for the clock to stabilise

        self.base_time = clock_provider.get_property('clock').get_time()
        print("base_time %s", self.base_time) 
    
        self.playbin = Gst.ElementFactory.make('playbin', 'playbin')
        print(uri)
        self.playbin.set_property('uri', uri) # uri interface

        self.playbin.use_clock(client_clock)
        self.playbin.set_base_time(self.base_time)
        self.playbin.set_start_time(Gst.CLOCK_TIME_NONE)
        self.playbin.set_latency (0.5);   

        print ('Start slave as: python ./play-slave.py %s 127.0.0.1 %d %d'
            % (uri, port, self.base_time))

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
        self.playbin.set_state(Gst.State.PLAYING)

    def stop(self):
        print("stop")
        self.playbin.set_state(Gst.State.NULL)

    def register(self):
        self.clients.append(Pyro4.current_context.client.sock.getpeername()[0])


@Pyro4.expose
class SlavePlayer(Player):

    def __init__(self, master_player):
        self.master_player = master_player

    def initialise(self, uri, port):
        port = int(port)

        print ("ip", ip)
        print ("port", port)
        print ("base_time", base_time)
        clock = GstNet.NetClientClock.new("clock", ip, port, 0)

        time.sleep(1.5) # Wait 0.5 seconds for the clock to stabilise

        playbin = Gst.ElementFactory.make('playbin', 'playbin')
        #pipeline = playbin.pipeline()
        playbin.set_property('uri', uri) # uri interface

        # use it in the pipeline
        #pipeline.set_base_time(base_time)
        playbin.use_clock(clock)
        playbin.set_base_time(base_time)
        playbin.set_start_time(Gst.CLOCK_TIME_NONE) 
        playbin.set_latency (0.5);

        # now we go :)
        playbin.set_state(Gst.State.PLAYING)

        bus =  playbin.get_bus()
        bus.add_signal_watch()
        bus.connect("message", self.on_message)
    
        # wait until things stop
        #bus.poll(Gst.MessageType.EOS | Gst.MessageType.ERROR, Gst.CLOCK_TIME_NONE)

    def play(self):
        print("play")
        self.playbin.set_state(Gst.State.PLAYING)

    def stop(self):
        print("stop")
        self.playbin.set_state(Gst.State.NULL)


if __name__ == '__main__':

    parser = argparse.ArgumentParser(description='Syncronise music accross machines.')

    parser.add_argument('--playertype', type=str, dest='playertype', default='slave',
        help='player type. master or slave (default slave)')
    
    parser.add_argument('--port', type=int, dest='clock_port', default='5342',
        help='port used for the network clock')

    parser.add_argument('filepath')

    args = parser.parse_args()
    args.filepath = os.path.abspath(args.filepath)

    Gst.init(sys.argv)

    try:

        if args.playertype == "master":
            player = MasterPlayer()
            
            with Pyro4.Daemon() as daemon:
                player_uri = daemon.register(player)
                with Pyro4.locateNS() as ns:
                    ns.register("partyzone.masterplayer", player_uri)
                player.initialise(args.filepath, args.clock_port)
                print("player running.", player_uri)

                # add a Pyro event callback to the gui's mainloop
                player.install_pyro_event_callback(daemon)
                GObject.MainLoop().run()
        else:
            master_player = Pyro4.Proxy("PYRONAME:partyzone.masterplayer")
            player = SlavePlayer(master_player)

    except KeyboardInterrupt:
        print("Bye")
        sys.exit()
    

    