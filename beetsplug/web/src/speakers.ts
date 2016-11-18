import {inject, Lazy, autoinject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {Router} from 'aurelia-router';
import {AllPlay, Speaker} from './allplay';

@inject(AllPlay, Router)
export class Speakers {
  heading: string = 'Speakers';
  speakers: Array<Speaker> = [];

  constructor(private allplay: AllPlay, private router: Router) {
  }

  async discover() {
    this.speakers = await this.allplay.getSpeakers();
  }

  async activate() {
      this.discover();
  }

  speakerSelected(event: any, speaker: Speaker) {
    this.allplay.selectSpeakers(this.speakers);
    return true;
  }

  volumeChanged(event: any, speaker: Speaker) {
    //this.allplay.adjustVolume(speaker);
    //alert(speaker.volume);
  }
}
