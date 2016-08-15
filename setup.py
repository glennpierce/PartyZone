#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from setuptools import setup, find_packages

from distutils.core import setup

from distutils.core import setup, Extension

setup(name='partyzone',
      version='1.0',
      description='Syncronise music across machines',
      author='Glenn Pierce',
      author_email='glennpierce@gmail.com',
      url='https://github.com/glennpierce/PartyZone',
      packages=find_packages(),
      package_data={'beetsplug': ['web/dist/*.*']},
      data_files=[('/etc/systemd/system', ['systemd/pyro4-nameserver.service',
                                           'systemd/partyzone-master.service'])],
      install_requires=[
        'beets>=1.3.7',
        'futures',
        'Pyro4'
      ],
      scripts=["partyzone"],
     )
