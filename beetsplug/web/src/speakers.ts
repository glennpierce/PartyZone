import {inject, Lazy, autoinject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {Router} from 'aurelia-router';
import {AllPlay, ISpeaker} from './allplay';

@inject(AllPlay, Router)
export class Speakers {
  heading: string = 'Speakers';
  speakers: Array<ISpeaker>;

  constructor(private allplay: AllPlay, private router: Router) {
  }

  async discover() {
    this.speakers = await this.allplay.getSpeakers();
    console.log("here");
  }

  async activate() {
      this.discover();
  }

  speakerSelected(event: any, speaker: ISpeaker) {
    
    //this.allplay.saveSpeakersToLocalStorage(this.speakers.values());
    this.allplay.selectSpeakers(this.speakers);
    return true;
  }

  volumeChanged(event: any, speaker: ISpeaker) {
    //this.allplay.adjustVolume(speaker);
    //alert(speaker.volume);
  }
}
