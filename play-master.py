#!/usr/bin/env python3

import sys
import gi
import time
gi.require_version('Gst', '1.0')
gi.require_version('GstNet', '1.0')
from gi.repository import Gst, GstNet


def on_message(bus, message):
    #print(message)
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

    system_clock = Gst.SystemClock.obtain()
    clock_provider = GstNet.NetTimeProvider.new(system_clock, None, port)
    client_clock = GstNet.NetClientClock.new('clock', "127.0.0.1", port, 0)
    
    time.sleep(0.5) # Wait 0.5 seconds for the clock to stabilise

    base_time = clock_provider.get_property('clock').get_time()
    print("base_time %s", base_time) 
 
    playbin = Gst.ElementFactory.make('playbin', 'playbin')
    print(uri)
    playbin.set_property('uri', uri) # uri interface

    playbin.use_clock(client_clock)
    playbin.set_base_time(base_time)
    playbin.set_start_time(Gst.CLOCK_TIME_NONE)
    playbin.set_latency (0.5);   

    print ('Start slave as: python ./play-slave.py %s 127.0.0.1 %d %d'
           % (uri, port, base_time))

    playbin.set_state(Gst.State.PLAYING)

    # wait until things stop
    bus =  playbin.get_bus()
    bus.add_signal_watch()
    bus.connect("message", on_message) 

    bus.poll(Gst.MessageType.EOS | Gst.MessageType.ERROR, Gst.CLOCK_TIME_NONE)
    #playbin.set_state(Gst.State.NULL)


if __name__ == '__main__':
    main(sys.argv)
