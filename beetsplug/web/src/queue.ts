import {inject, Lazy, autoinject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {Router} from 'aurelia-router';
import {AllPlay, ITrack} from './allplay';
import {Tracks} from './tracks';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

function mapToJson(map) : string {
    return JSON.stringify(Array.from(map.entries()));
    //return "";
}

function jsonToMap(jsonStr : string) {
    let json = JSON.parse(jsonStr);
    return new Map<number, ITrack>(json);
    //return new Map();
}

export type QueueContainer = Map<number, ITrack>;

@inject(AllPlay, Router, Tracks)
export class Queue {
  heading: string = 'Queue';
  queued_tracks: QueueContainer = new Map<number, ITrack>();

  constructor(private allplay: AllPlay, private router: Router, private tracks : Tracks) {

  }

  activate(): Promise<void> {
    this.queued_tracks = jsonToMap(localStorage.getItem("queue"));

    // Set queue items on python partyzone controller
    for (let track of this.queued_tracks.values()) {
        this.allplay.addToQueue(track);
    }

    console.log(this.queued_tracks);

    return;
  }

  get queuedTracks() : {} {
      return this.queued_tracks;
  }

  async reset(event: any) {
    this.queued_tracks = new Map<number, ITrack>();
    localStorage.setItem("queue", "[]");
    this.queued_tracks.clear();
    this.allplay.reset_queue();
  	return true;
  }

  addToQueue(track: ITrack) {
    this.queued_tracks.set(+track.id, track);
    localStorage.setItem("queue", mapToJson(this.queued_tracks));
    this.allplay.addToQueue(track);
  }

  play(event: any) {
    //this.allplay.setupAutoMode(true);
    this.allplay.play_queue();
  	return true;
  }

  stop(event: any) {
    //this.allplay.setupAutoMode(false);
    this.allplay.stop();
  	return true;
  }

  pause(event: any) {
    this.allplay.pause();
  	return true;
  }

  playTrack(event: any, track: ITrack) {
    //this.allplay.setupAutoMode(false);
    this.allplay.playTrack(track);
  	return true;
  }

  gotoTrackEdit(event: any, track: ITrack) {
    this.tracks.gotoTrackEdit(event, track);
  	return true;
  }
}
