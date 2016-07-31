#!/usr/bin/env python3

import sys
import gi
import time
import Pyro4
gi.require_version('Gst', '1.0')
gi.require_version('GstNet', '1.0')
from gi.repository import Gst, GstNet

class SlavePlayer(object):

    def __init__(self, args):
        _, uri, ip, port, base_time = args
        port, base_time = int(port), int(base_time)

        Gst.init(args)

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
        bus.poll(Gst.MessageType.EOS | Gst.MessageType.ERROR, Gst.CLOCK_TIME_NONE)
        #playbin.set_state(Gst.State.NULL)

    def on_message(self, bus, message):
        t = message.type
        if t == Gst.MessageType.EOS:
            #self.player.set_state(Gst.State.NULL)
            #self.button.set_label("Start")
            pass
        elif t == Gst.MessageType.ERROR:
            #self.player.set_state(Gst.State.NULL)
            err, debug = message.parse_error()
            print("Error: %s" % err, debug)
            #self.button.set_label("Start")


if __name__ == '__main__':
    player = SlavePlayer(sys.argv)
