import {inject, Lazy, autoinject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {Router} from 'aurelia-router';
import {AllPlay, Speaker} from './allplay';
//import {MdRange} from 'aurelia-materialize-bridge';

@inject(AllPlay, Router)
export class Speakers {
  heading: string = 'Speakers';
  speakers: Array<Speaker> = [];
  savedSpeakers: Array<string> = [];

  constructor(private allplay: AllPlay, private router: Router) {
    this.setup();
  }

  async setup() {
    let speakersJson : string = localStorage.getItem("speakers");
      if(speakersJson !== null) {
        this.savedSpeakers = JSON.parse(speakersJson);
      }

      this.speakers = await this.allplay.getSpeakers();
      console.log(this.speakers);

      for (let i in this.speakers) {
          let s = this.speakers[i];
          if (this.savedSpeakers.indexOf(s.id) > -1) {
            s.selected = true;
          }
      }

      this.allplay.selectSpeakers();
  }

  async activate(): Promise<void> {
    //this.speakers = await this.allplay.getSpeakers();
    //console.log(this.speakers);
  }

  speakerSelected(event: any, speaker: Speaker) {
    this.allplay.selectSpeakers();
    return true;
  }

  volumeChanged(event: any, speaker: Speaker) {
    //this.allplay.adjustVolume(speaker);
    //alert(speaker.volume);
  }
}
