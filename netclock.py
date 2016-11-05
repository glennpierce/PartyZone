#!/usr/bin/env python

from __future__ import print_function

import sys
import gi
gi.require_version('Gst', '1.0')
gi.require_version('GstNet', '1.0')
import time
import signal
import select
import argparse
import os
import os.path
import socket
from gi.repository import GObject, Gst, GstNet

if __name__ == '__main__':

    # default host name
    default_host = '127.0.0.1'

    parser = argparse.ArgumentParser(description='Sets up a network clock.')

    parser.add_argument('--port', type=int, dest='port', default='5342', help='port used for the network clock')

    parser.add_argument('--host', type=str, default=default_host, help="Host ip you wish to bind to")

    args = parser.parse_args()
   
    print("host: " + str(args.host))
    print("port: " + str(args.port))

    Gst.init(sys.argv)

    system_clock = Gst.SystemClock.obtain()
    time.sleep(1) # Wait for the clock to stabilise
    clock_provider = GstNet.NetTimeProvider.new(system_clock, args.host, args.port)
    if not clock_provider:
        print("No clock_provider set ?")

    loop = GObject.MainLoop()
    loop.run()