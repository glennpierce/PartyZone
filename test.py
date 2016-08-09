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

Gst.init(sys.argv)

playbin = Gst.ElementFactory.make('playbin', 'playbin')

playbin.set_latency (1.0);   

        # wait until things stop
#        bus =  self.playbin.get_bus()
#        bus.add_signal_watch()
#        bus.connect("message", self.on_message) 

#        print("setting uri to %s" % (self.track,))
#        self.playbin.set_property('uri', self.track)
#        self.playbin.set_state(Gst.State.PLAYING)
        

Gst.init(sys.argv)
