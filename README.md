Installation
============

Partyzone allows one to syncronise music across a number of devices.

It consists of a player which is installed on a device with a amplifier / speaker.
You can have a number of players on one device. For example I have a netbook with four 
usb soundcards plugged into a usb hub. The output of these then each go to a cheap ebay
amplifier and then speaker.

There are systemd files in the source that start all the parts but here I will describe running manually.

 First as the system is built on pyro4 so we first run the pyro4 nameserver.

 /usr/bin/python /usr/local/bin/pyro4-ns -n 0.0.0.0

the -n 0.0.0.0 makes the nameserver availiable over the network.


All the players have to sync their audio with a network clock. To start that clock we need to run

/opt/PartyZone/netclock.py --host 192.168.1.6

--host is the ip of the system you run the clock from.

Now we can start the player (one of many)

/opt/PartyZone/partyzone --player --name "Kitchen" --host 192.168.1.9 --card hw:2,0

This would start a player on a device with ip 192.168.1.9.
--card hw:2,0 tells the player which alsa device to use.
the --name parameter is used by the web frontend.


Web Frontend Installation
============

the webfrontend uses a Beets music library to play to the players. 


Beets plugin ::

    Within the beetsplug directory is a beets plugin and web frontend written in Aurelia.
    http://beets.io/ is a Python music indexer / metadata system. 
    I created a beets plugin called partyzone that helps send the music to the players.
    
    To run this plugin
    Add the plugin directory to the Python path
    ie  export PYTHONPATH="${PYTHONPATH}:/opt/PartyZone"

    Edit the beets config file

    vim ~/.config/beets/config.yaml

    Add the following

    directory: /home/media/music
    library: ~/musiclibrary.blb

    plugins: partyzone

    partyzone:
        host: 192.168.1.6
        port: 5000


    Once the config is save you have to index your music
   
    For importing read https://beets.readthedocs.org/en/v1.3.17/guides/main.html

    I used
    beet import -A /media/External/Music

    Once index simply run my plugin

    beet partyzone --debug

    This will start a webserver you can access on port 5000


You must then build the Aurelia web frontend.

Ie 

cd beetsplug/web/; webpack

You must serve the files created in beetsplug/web/dist

The webpages look like below.

.. image:: https://github.com/glennpierce/PartyZone/speakers.png?raw=true

.. image:: https://github.com/glennpierce/PartyZone/queue.png?raw=true
