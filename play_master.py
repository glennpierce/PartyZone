#!/usr/bin/env python3

import sys
import gi
import time
import signal
import Pyro4
gi.require_version('Gst', '1.0')
gi.require_version('GstNet', '1.0')
from gi.repository import GObject, Gst, GstNet


def signal_handler(signal, frame):
    print('You pressed Ctrl+C!')
    sys.exit(0)

@Pyro4.expose
class MasterPlayer(object):

    def __init__(self):
        pass

    def initialise(self, args):
        _, uri, port = args
        port = int(port)

        Gst.init(args)

        system_clock = Gst.SystemClock.obtain()
        clock_provider = GstNet.NetTimeProvider.new(system_clock, None, port)
        client_clock = GstNet.NetClientClock.new('clock', "127.0.0.1", port, 0)
        
        time.sleep(0.5) # Wait 0.5 seconds for the clock to stabilise

        base_time = clock_provider.get_property('clock').get_time()
        print("base_time %s", base_time) 
    
        self.playbin = Gst.ElementFactory.make('playbin', 'playbin')
        print(uri)
        self.playbin.set_property('uri', uri) # uri interface

        self.playbin.use_clock(client_clock)
        self.playbin.set_base_time(base_time)
        self.playbin.set_start_time(Gst.CLOCK_TIME_NONE)
        self.playbin.set_latency (0.5);   

        print ('Start slave as: python ./play-slave.py %s 127.0.0.1 %d %d'
            % (uri, port, base_time))

        # playbin.set_state(Gst.State.PLAYING)

        # # wait until things stop
        # bus =  playbin.get_bus()
        # bus.add_signal_watch()
        # bus.connect("message", self.on_message) 

        # print("ffff")
        # GObject.MainLoop().run()

        #bus.poll(Gst.MessageType.EOS | Gst.MessageType.ERROR, Gst.CLOCK_TIME_NONE)
        
        #playbin.set_state(Gst.State.NULL)

    def play(self):
        print("play")
        self.playbin.set_state(Gst.State.PLAYING)

        # wait until things stop
        bus =  self.playbin.get_bus()
        bus.add_signal_watch()
        bus.connect("message", self.on_message) 

        print("ffff")
        GObject.MainLoop().run()

    def on_message(self, bus, message):
        t = message.type
        if t == Gst.MessageType.EOS:
            #self.player.set_state(Gst.State.NULL)
            pass
        elif t == Gst.MessageType.ERROR:
            #self.player.set_state(Gst.State.NULL)
            err, debug = message.parse_error()
            print("Error: %s" % err, debug)


if __name__ == '__main__':
    #signal.signal(signal.SIGINT, signal_handler)
    try:
        # Pyro4.Daemon.serveSimple(
        #     {
        #         MasterPlayer: "partyzone.masterplayer"
        #     },
        #     ns = False)
        # #player = MasterPlayer()
        # #player.initialise(sys.argv)

        nasdaq = StockMarket("NASDAQ", ["AAPL", "CSCO", "MSFT", "GOOG"])
        newyork = StockMarket("NYSE", ["IBM", "HPQ", "BP"])

        with Pyro4.Daemon() as daemon:
            nasdaq_uri = daemon.register(nasdaq)
            newyork_uri = daemon.register(newyork)
            with Pyro4.locateNS() as ns:
                ns.register("example.stockmarket.nasdaq", nasdaq_uri)
                ns.register("example.stockmarket.newyork", newyork_uri)
            nasdaq.run()
            newyork.run()
            print("Stockmarkets running.")
            daemon.requestLoop()

    except KeyboardInterrupt:
        print("Bye")
        sys.exit()
    