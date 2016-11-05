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
import Pyro4

@Pyro4.expose
class Clock(object):
    def __init__(self, host, port):
        self._host = host
        self._port = port
        self.system_clock = Gst.SystemClock.obtain()
        time.sleep(1) # Wait for the clock to stabilise
        self.clock_provider = GstNet.NetTimeProvider.new(self.system_clock, host, port)
        if not self.clock_provider:
            print("No clock_provider set ?")

    @property
    def time():
        return self.system_clock.get_time()

    @property
    def host():
        return self._host

    @property
    def port():
        return self._port

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

if __name__ == '__main__':

    # default host name
    default_host = '127.0.0.1'

    parser = argparse.ArgumentParser(description='Sets up a network clock.')

    parser.add_argument('--clock-port', type=int, dest='clockport', default='5342', help='port used for the network clock')

    parser.add_argument('--host', type=str, default=default_host, help="Host ip you wish to bind to")

    parser.add_argument('--pyro-port', dest='pyro_port', type=int, default=6562, help="Pyro port you wish to bind to")

    args = parser.parse_args()
   
    print("host: " + str(args.host))
    print("port: " + str(args.clockport))

    Gst.init(sys.argv)

    clock = Clock(args.host, args.clockport)

    register_name = "partyzone.clock.(%s)" % args.host

    ns = None

    while True:
        try:
            ns = Pyro4.naming.locateNS()
            break
        except Pyro4.errors.NamingError:
            print("Can't find Pyro nameserver!")
        except ex:
            print(str(ex))
            sys.exit(1)
        time.sleep(5)

    try:
        existing = ns.lookup(register_name)
        # start the daemon on the previous port
        daemon = Pyro4.core.Daemon(host=args.host, port=existing.port)
        # register the object in the daemon with the old objectId
        daemon.register(clock, objectId=existing.object)
    except Pyro4.errors.NamingError:
        # just start a new daemon on a random port
        daemon = Pyro4.core.Daemon(host=args.host, port=args.pyro_port)
        # register the object in the daemon and let it get a new objectId
        # also need to register in name server because it's not there yet.
        uri = daemon.register(clock)
        ns.register(register_name, uri)
        print("Network Clock started.")

    clock.install_pyro_event_callback(daemon)
    GObject.MainLoop().run()
