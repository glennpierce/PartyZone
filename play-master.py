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
    _, uri, port = args
    port = int(port)

    Gst.init(args)

    # make the pipeline
    pipeline = Gst.parse_launch('playbin')   

    # make sure some other clock isn't autoselected
    #system_clock = pipeline.get_pipeline_clock()
    system_clock = pipeline.get_pipeline_clock()
    
    #print('Using clock: ', clock)
    #pipeline.use_clock(clock)

    # this will start a server listening on a UDP port
    clock_provider = GstNet.NetTimeProvider(clock=system_clock, address=None, port=port)

    #base_time = system_clock.get_time()

    client_clock = GstNet.NetClientClock.new('clock', "127.0.0.1", port, 0)
    time.sleep(0.5) # Wait 0.5 seconds for the clock to stabilise
    base_time = clock_provider.get_property('clock').get_time()

 
    
    pipeline.set_property('uri', uri) # uri interface

    # use it in the pipeline
    
    pipeline.use_clock(client_clock)
    pipeline.set_base_time(base_time)
    # we explicitly manage our base time
    pipeline.set_start_time(Gst.CLOCK_TIME_NONE)
    #pipeline.set_base_time(base_time)
    pipeline.set_latency (0.5);   

    print ('Start slave as: python ./play-slave.py %s [IP] %d %d'
           % (uri, port, base_time))

    # pipeline.set_property('volume', 0.0)

    # now we go :)
    pipeline.set_state(Gst.State.PLAYING)

    # wait until things stop
    bus =  pipeline.get_bus()
    bus.add_signal_watch()
    bus.connect("message", on_message) 

    bus.poll(Gst.MessageType.EOS | Gst.MessageType.ERROR, Gst.CLOCK_TIME_NONE)
    pipeline.set_state(Gst.State.NULL)


if __name__ == '__main__':
    main(sys.argv)
