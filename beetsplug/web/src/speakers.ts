import {inject, Lazy, autoinject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {Router} from 'aurelia-router';
import {AllPlay, Speaker} from './allplay';
//import {MdRange} from 'aurelia-materialize-bridge';

@inject(AllPlay, Router)
export class Speakers {
  heading: string = 'Speakers';
  speakers: Array<Speaker> = [];
  savedSpeakers = {};

  constructor(private allplay: AllPlay, private router: Router) {
      this.setup();    
  }

  async setup() {
      let speakersJson : string = localStorage.getItem("speakers");

      if(speakersJson !== null && speakersJson != "") {
        this.savedSpeakers = JSON.parse(speakersJson);
      }

      let speakers = await this.allplay.getSpeakers();

      for (let i in this.speakers) {
          let s = this.speakers[i];
          if (s.id in this.savedSpeakers) {
            s.selected = true;
          }
      }

      this.allplay.selectSpeakers(speakers);
  }

  async activate(): Promise<void> {
  }

  speakerSelected(event: any, speaker: Speaker) {
    
    if(speaker.selected) {
        this.savedSpeakers[speaker.id] = speaker.name;
    }
    else {
        if(speaker.id in this.savedSpeakers) {
          delete this.savedSpeakers[speaker.id];
        }
    }
    localStorage.setItem("speakers", JSON.stringify(this.savedSpeakers));
    //this.allplay.selectSpeakers(Object.keys(this.savedSpeakers));
    this.allplay.selectSpeakers();
    return true;
  }

  volumeChanged(event: any, speaker: Speaker) {
    //this.allplay.adjustVolume(speaker);
    //alert(speaker.volume);
  }
}
