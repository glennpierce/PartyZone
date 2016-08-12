#!/usr/bin/env python

from distutils.core import setup

from distutils.core import setup, Extension

setup(name='PartyZone',
      version='1.0',
      description='Syncronise music across machines',
      author='Glenn Pierce',
      author_email='glennpierce@gmail.com',
      url='https://github.com/glennpierce/PartyZone',
      packages = ['', 'beetsplug'],
      #install_requires=['beets>=1.2.2,==dev'],
      scripts=["partyzone"],
     )
