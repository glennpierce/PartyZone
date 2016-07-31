#!/usr/bin/env python3

# This is the code that visits the warehouse.
import sys
import Pyro4
from play_master import MasterPlayer

if sys.version_info<(3,0):
    input = raw_input

uri = input("Enter the uri of the warehouse: ").strip()
player = Pyro4.Proxy(uri)
player.play()
