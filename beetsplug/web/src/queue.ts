import {inject, Lazy, autoinject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {Router} from 'aurelia-router';
import {AllPlay, ITrack, QueueContainer} from './allplay';
import {Tracks} from './tracks';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);


@inject(AllPlay, Router, Tracks)
//@singleton
export class Queue {
  heading: string = 'Queue';
  //queued_tracks: Array<ITrack> = [];
  //queued_tracks: { [id: number] : ITrack; } = {};
  queued_tracks: QueueContainer; // = new Map<number, ITrack>();
 
  constructor(private allplay: AllPlay, private router: Router, private tracks : Tracks) {

  }

  async activate(): Promise<void> {
    this.queued_tracks = await this.allplay.getQueuedItems();
    console.log(this.queued_tracks);
  }

  get queuedTracks() : QueueContainer {
      return this.queued_tracks;
  }

  play(event: any, track: ITrack) {
    alert('play');
  	return true;
  }

  gotoTrackEdit(event: any, track: ITrack) {
    this.tracks.gotoTrackEdit(event, track);
  	return true;
  }
}
