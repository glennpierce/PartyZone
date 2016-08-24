#!/usr/bin/env python

import sys

from gi.repository import Gst
from gi.repository import GstNet

def main(args):
    _, uri, ip, port, base_time = args
    port, base_time = int(port), int(base_time)

    Gst.init(sys.argv)

    # make the pipeline
    pipeline = Gst.parse_launch('playbin')
    pipeline.set_property('uri', uri) # uri interface

    # disable the pipeline's management of base_time -- we're going
    # to set it ourselves.
    pipeline.set_start_time(Gst.CLOCK_TIME_NONE)

    # make a clock slaving to the network
    clock = GstNet.NetClientClock.new('clock0', ip, port, base_time)

    # use it in the pipeline
    pipeline.set_base_time(base_time)
    pipeline.use_clock(clock)

    # now we go :)
    pipeline.set_state(Gst.State.PLAYING)

    # wait until things stop
    pipeline.get_bus().poll(Gst.MessageType.EOS | Gst.MessageType.ERROR, Gst.CLOCK_TIME_NONE)
    pipeline.set_state(Gst.State.NULL)

if __name__ == '__main__':
    main(sys.argv)
