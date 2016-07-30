#!/usr/bin/env python3

import sys
import gi
import time
gi.require_version('Gst', '1.0')
gi.require_version('GstNet', '1.0')
from gi.repository import Gst, GstNet


def on_message(bus, message):
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


def main(args):
    _, uri, ip, port, base_time = args
    port, base_time = int(port), int(base_time)

    Gst.init(args)

    #pipeline = Gst.parse_launch('playbin')
    #pipeline.set_property('uri', uri) # uri interface

    # disable the pipeline's management of base_time -- we're going
    # to set it ourselves.
    # clock_provider = GstNet.NetTimeProvider(clock=clock, address=None, port=port)
    # pipeline.set_new_stream_time(GstNet.CLOCK_TIME_NONE)
    #pipeline.set_start_time(Gst.CLOCK_TIME_NONE)
    #pipeline.set_base_time(Gst.CLOCK_TIME_NONE)

    # make a clock slaving to the network
    #clock = GstNet.NetClientClock,new(None, ip, port, base_time)

    print ("ip", ip)
    print ("port", port)
    print ("base_time", base_time)
    clock = GstNet.NetClientClock.new("clock", ip, port, 0)

    time.sleep(0.5) # Wait 0.5 seconds for the clock to stabilise

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
    bus.connect("message", on_message)
 
    # wait until things stop
    bus.poll(Gst.MessageType.EOS | Gst.MessageType.ERROR, Gst.CLOCK_TIME_NONE)
    playbin.set_state(Gst.State.NULL)


if __name__ == '__main__':
    main(sys.argv)
