#!/usr/bin/env python

import sys

from gi.repository import Gst
from gi.repository import GstNet

def main(args):
    _, uri, port = args
    port = int(port)

    Gst.init()

    # make the pipeline
    pipeline = Gst.parse_launch('playbin')
    pipeline.set_property('uri', uri) # uri interface

    # make sure some other clock isn't autoselected
    clock = pipeline.get_clock()
    print 'Using clock: ', clock
    pipeline.use_clock(clock)

    # this will start a server listening on a UDP port
    clock_provider = GstNet.NetTimeProvider.new(clock, None, port)

    # we explicitly manage our base time
    base_time = clock.get_time()
    print ('Start slave as: python ./play-slave.py %s [IP] %d %d'
           % (uri, port, base_time))

    # disable the pipeline's management of base_time -- we're going
    # to set it ourselves.
    pipeline.set_start_time(Gst.CLOCK_TIME_NONE)
    pipeline.set_base_time(base_time)

    # now we go :)
    pipeline.set_state(Gst.State.PLAYING)

    # wait until things stop
    pipeline.get_bus().poll(Gst.MessageType.EOS | Gst.MessageType.ERROR, Gst.CLOCK_TIME_NONE)
    pipeline.set_state(Gst.State.NULL)

if __name__ == '__main__':
    main(sys.argv)
