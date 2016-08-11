import {inject, Lazy, autoinject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {Router} from 'aurelia-router';
import {AllPlay, ITrack} from './allplay';

// polyfill fetch client conditionally
//const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

@inject(AllPlay, Router)
export class Tracks {
  heading: string = 'Tracks';
  tracks: Array<ITrack> = [];

  //constructor(private getHttpClient: () => HttpClient, private router: Router) {
  constructor(private allplay: AllPlay, private router: Router) {

  }

  async activate(): Promise<void> {
    this.tracks = await this.allplay.getTracks();
  }

  addToQueue(event: any, track: ITrack) {
    this.allplay.addToQueue(track);
  }

  gotoTrackEdit(event: any, track: ITrack) {
    this.router.navigateToRoute('track-edit', { id: track.id });
    event.preventDefault();
  }
}
