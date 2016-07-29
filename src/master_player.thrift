include "player.thrift"

namespace cpp partyzone

service MasterPlayerService extends player.PlayerService {

   void registerSlave(string name),
}
