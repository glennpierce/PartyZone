import {inject, Lazy, autoinject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {Router} from 'aurelia-router';
import {AllPlay, Speaker} from './allplay';
//import {MdRange} from 'aurelia-materialize-bridge';

@inject(AllPlay, Router)
export class Speakers {
  heading: string = 'Speakers';
  speakers: Array<Speaker> = [];

  constructor(private allplay: AllPlay, private router: Router) {
  }

  async activate(): Promise<void> {
    this.speakers = await this.allplay.getSpeakers();
    console.log(this.speakers);
  }

  speakerSelected(event: any, speaker: Speaker) {
    //speaker.selected = true;
    console.log('here');
    //this.router.navigateToRoute('track-edit', { id: track.id });
    //event.preventDefault();
    return true;
  }

  volumeChanged(event: any, speaker: Speaker) {
    console.log(speaker.volume);
    alert(speaker.volume);
  }
}
