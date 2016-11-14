import {inject, Lazy, autoinject} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {HttpClient} from 'aurelia-fetch-client';
import {Router} from 'aurelia-router';
import {AllPlay, ITrack, QueueContainer} from './allplay';
import {Tracks} from './tracks';
import {Playlist} from './playlist';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);


@inject(AllPlay, QueueContainer, DialogService, Router)
export class Queue {
  heading: string = 'Queue';

  constructor(private allplay: AllPlay, private queueContainer : QueueContainer, private dialogService: DialogService, private router: Router) {
  }

  async loadPlaylist(event: any) {

    let state = {'queue' : this, 'choosePlaylist' : true};

    this.dialogService.open({ viewModel: Playlist, model : state }).then(response => {

        if (!response.wasCancelled) {
 	  //console.log("here");
        }
      });

    return true;
  }

  async savePlaylist(event: any) {

    let state = {'queue' : this, 'choosePlaylist' : false};

    this.dialogService.open({ viewModel: Playlist, model : state }).then(response => {
      });

    return true;
  }

  get queuedTracks() : Array<ITrack> {
      return this.queueContainer.queued_tracks;
  }

  resetQueue() {
    this.queueContainer.resetQueue();
    this.allplay.empty_queue();
    return true;
  }

  async reset(event: any) {
    this.resetQueue();
    return true;
  }

  addToQueue(track: ITrack) {
    this.queueContainer.addToQueue(track);
    //this.allplay.addToQueue(track);
  }

  play(event: any) {
    this.allplay.play_queue(this.queueContainer);
    return true;
  }

  stop(event: any) {
    this.allplay.setupQueueMode(false);
    this.allplay.stop();
    this.allplay.reset_queue();
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

  // gotoTrackEdit(event: any, track: ITrack) {
  //   this.tracks.gotoTrackEdit(event, track);
  // 	return true;
  // }
}
