import {Aurelia, inject} from 'aurelia-framework';
import {DialogController} from 'aurelia-dialog';
import {AllPlay, ITrack, QueueContainer} from './allplay';
import {Queue} from './queue';


@inject(AllPlay, QueueContainer, DialogController)
export class Playlist {
  private playlists : string[];
  private queue : Queue;
  private choosePlaylist : boolean = true;

  constructor(private allplay: AllPlay, private queueContainer: QueueContainer, private controller : DialogController){
  }

  async activate(state){
    this.queue = state['queue'];
    this.choosePlaylist = state['choosePlaylist'];
    this.playlists = await this.allplay.getPlaylists();
    console.log(this.playlists);
  }

  async selectPlaylist (event: any, selectedPlaylist) {

    let self = this;

    console.log(selectedPlaylist);

    let tracks = await this.allplay.getPlaylist(selectedPlaylist.name);

    this.queue.resetQueue();

    for (let track of tracks) {
        console.log("in loop: " + track.path);
        await this.queue.addToQueue(track);
    }

    self.controller.ok();
  }

  async savePlaylist (event: any, playListName : string) {

    let self = this;

    this.allplay.saveQueue(playListName, this.queue.queuedTracks);

    self.controller.ok();
  }
}
