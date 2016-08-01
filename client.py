#!/usr/bin/env python3

# This is the code that visits the warehouse.
import sys
import time
import Pyro4
import Pyro4.util
from play_master import MasterPlayer

sys.excepthook = Pyro4.util.excepthook

player = Pyro4.Proxy("PYRONAME:partyzone.masterplayer")
player.play()

time.sleep(10)

player.stop()