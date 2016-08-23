namespace cpp partyzone

enum Status {
  STOPPED = 1,
  PLAYING = 2,
  PAUSED  = 3
}

exception InvalidOperation {
  1: string why
}

service Player {

   void play(),

   void stop(),

   void setVolume(1:double volume);

   double getVolume();
}
