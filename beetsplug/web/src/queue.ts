import {inject, Lazy, autoinject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {Router} from 'aurelia-router';
import {AllPlay, ITrack} from './allplay';
import {Tracks} from './tracks';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);


@inject(AllPlay, Router, Tracks)
//@singleton
export class Queue {
  heading: string = 'Queue';
  queued_tracks: Map<number, ITrack> = new Map<number, ITrack>();
 
  constructor(private allplay: AllPlay, private router: Router, private tracks : Tracks) {

  }

  async activate(): Promise<void> {
    this.queued_tracks = await this.allplay.getQueuedItems();
    console.log(this.queued_tracks);
  }

  get queuedTracks() : {} {
      return this.queued_tracks;
  }

  async reset(event: any) {
    this.allplay.reset_queue();
    this.queued_tracks.clear();
  	return true;
  }

  play(event: any) {
    this.allplay.play();
  	return true;
  }

  stop(event: any) {
    this.allplay.stop();
  	return true;
  }

  pause(event: any) {
    this.allplay.pause();
  	return true;
  }

  playTrack(event: any, track: ITrack) {
    this.allplay.playTrack(track);
  	return true;
  }

  gotoTrackEdit(event: any, track: ITrack) {
    this.tracks.gotoTrackEdit(event, track);
  	return true;
  }
}
