/*
 * Sample code for: Synchronised multi-device media playback with GStreamer
 * This player also creates the master clock for others to follow
 *
 * Copyright (c) 2016 Luis de Bethencourt <luisbg@osg.samsung.com>
 *
 * This program is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation; either version 2 of the License, or (at your option)
 * any later version.
 */

#include <stdlib.h>
#include <stdio.h>
#include <gst/gst.h>
#include <gst/net/gstnetclientclock.h>
#include <gst/net/gstnettimeprovider.h>

//



static GstClockTime
share_base_time (guint16 clock_port, GstNetTimeProvider *prov_clock)
{
  FILE *fp;
  GstClock *clock;
  GstClockTime base_time;

  g_object_get (prov_clock, "clock", &clock, NULL);
  base_time = gst_clock_get_time (clock);

  fp = fopen ("/tmp/shared_time", "w+b");
  if (!fp)
    g_print ("problem writing to shared_time file");
  fwrite (&clock_port, sizeof (guint16), 1, fp);
  fwrite (&base_time, sizeof (GstClockTime), 1, fp);
  fclose (fp);

  return base_time;
}


/*
int main(int argc, char *argv[]) {


  gst_element_set_state (playbin, GST_STATE_PLAYING);

  // Create a GLib Main Loop and set it to run 
  main_loop = g_main_loop_new (NULL, FALSE);
  g_main_loop_run (main_loop);

  // Free resources 
  g_main_loop_unref (main_loop);
  gst_element_set_state (playbin, GST_STATE_NULL);
  gst_object_unref (playbin);
  return 0;
}
*/


#include <thrift/concurrency/PosixThreadFactory.h>
#include "Player.h"

//#include "TGlibServer.h"

#include <thrift/protocol/TBinaryProtocol.h>
#include <thrift/transport/TServerSocket.h>
#include <thrift/transport/TBufferTransports.h>
#include <thrift/server/TSimpleServer.h>

//#include "TNonblockingServer.h"

using namespace ::apache::thrift;
using namespace ::apache::thrift::protocol;
using namespace ::apache::thrift::transport;
using namespace ::apache::thrift::server;
using namespace ::apache::thrift::concurrency;

using boost::shared_ptr;

using namespace  ::partyzone;


#include <glib.h>
#include <gio/gio.h>

/* this function will get called everytime a client attempts to connect */
gboolean
incoming_callback  (GSocketService *service,
                    GSocketConnection *connection,
                    GObject *source_object,
                    gpointer user_data)
{
  g_print("Received Connection from client!\n");
  GInputStream * istream = g_io_stream_get_input_stream (G_IO_STREAM (connection));
  gchar message[1024];
  g_input_stream_read  (istream,
                        message,
                        1024,
                        NULL,
                        NULL);
  g_print("Message was: \"%s\"\n", message);
  return FALSE;
}



class PlayerHandler : virtual public PlayerIf {
 private:

  
  GstElement *playbin;

  GstNetTimeProvider* create_net_clock (guint16 *port)
  {
    GstClock *clock;
    GstNetTimeProvider *net_time;

    clock = gst_system_clock_obtain ();
    net_time = gst_net_time_provider_new (clock, NULL, 0);
    g_object_get (net_time, "port", port, NULL);
    gst_object_unref (clock);

    return net_time;
  }

 public:
  PlayerHandler() {
  
      GstClock *client_clock, *tmp_clock;
      GstNetTimeProvider *prov_clock;
      guint16 clock_port;
      GstClockTime base_time;

      prov_clock = create_net_clock (&clock_port);
      client_clock = gst_net_client_clock_new (NULL, "127.0.0.1", clock_port, 0);

      // Wait 0.5 seconds for the clock to stabilise 
      g_usleep (G_USEC_PER_SEC / 2);
      base_time = share_base_time (clock_port, prov_clock);
      printf("base_time %ld\n", base_time);

      // Create the elements 
      playbin = gst_element_factory_make ("playbin", "playbin");
      g_object_set (playbin, "uri", "file:///home/glenn/devel/PartyZone/test.mp3", NULL);

      gst_pipeline_use_clock (GST_PIPELINE (playbin), client_clock);
      gst_element_set_base_time (playbin, base_time);
      gst_element_set_start_time (playbin, GST_CLOCK_TIME_NONE);
 
  }

  void play() {
    // Your implementation goes here
    printf("play\n");
   gst_element_set_state (playbin, GST_STATE_PLAYING);

//  main_loop = g_main_loop_new (NULL, FALSE);
//  g_main_loop_run (main_loop);

  }

  void stop() {
    // Your implementation goes here
    printf("stop\n");
     gst_element_set_state (playbin, GST_STATE_NULL);
  }

  void setVolume(const double volume) {
    // Your implementation goes here
    printf("setVolume\n");
  }

  double getVolume() {
    // Your implementation goes here
    printf("getVolume\n");
  }

};



int main(int argc, char **argv) {
  int port = 9090;
  GMainLoop *main_loop;
  
  // Initialize GStreamer 
  gst_init (&argc, &argv);


  /* initialize glib */
  g_type_init();

  GError * error = NULL;

  /* create the new socketservice */
  GSocketService * service = g_socket_service_new ();

  /* connect to the port */
  g_socket_listener_add_inet_port ((GSocketListener*)service,
                                    port, /* your port goes here */
                                    NULL,
                                    &error);

  /* don't forget to check for errors */
  if (error != NULL)
  {
      g_error (error->message);
  }

  /* listen to the 'incoming' signal */
  g_signal_connect (service,
                    "incoming",
                    G_CALLBACK (incoming_callback),
                    NULL);

  /* start the socket service */
  g_socket_service_start (service);

  main_loop = g_main_loop_new (NULL, FALSE);
  g_main_loop_run (main_loop);

  /*
  shared_ptr<PlayerHandler> handler(new PlayerHandler());
  shared_ptr<TProcessor> processor(new PlayerProcessor(handler));
  shared_ptr<TServerTransport> serverTransport(new TServerSocket(port));
  shared_ptr<TTransportFactory> transportFactory(new TBufferedTransportFactory());
  shared_ptr<TProtocolFactory> protocolFactory(new TBinaryProtocolFactory());

  TSimpleServer server(processor, serverTransport, transportFactory, protocolFactory);
  server.serve();

*/



/*
    shared_ptr<PlayerHandler> handler(new PlayerHandler());
    shared_ptr<TProcessor> processor(new PlayerProcessor(handler));
    shared_ptr<TProtocolFactory> protocolFactory(new TBinaryProtocolFactory());

    // using thread pool with maximum 15 threads to handle incoming requests
    shared_ptr<ThreadManager> threadManager = ThreadManager::newSimpleThreadManager(15);
    shared_ptr<PosixThreadFactory> threadFactory = shared_ptr<PosixThreadFactory>(new PosixThreadFactory());
    threadManager->threadFactory(threadFactory);
    threadManager->start();
    TNonblockingServer server(processor, protocolFactory, port, threadManager);
    server.serve();
*/


  return 0;
}