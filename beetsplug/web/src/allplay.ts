import {inject, Lazy, autoinject, singleton} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';

// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);


export interface ITrack {
  id: number;
  title: string;
  path: string;
  album: string;
  artist: string;
  album_id: number,
  year: number
}

export interface ISpeaker {
  id: string;
  name: string;
  selected: boolean;
}

export interface IAlbum {
  id: number;
  album: string;
  albumartist: string;
  albumtype: string;
}

// export class Speaker {
 
//   private _selected: boolean;
//   id: string;
//   name: string;

//   constructor(id: string, name: string) {
//     this._selected = false;
//     this.id = id;
//     this.name = name;
//   };

//   get selected(): boolean {
//     return this._selected;
//   }
 
//   set selected(value: boolean) {
//     this._selected = value;
//   }
// }

export class QueueContainer {
    queued_tracks : Array<ITrack>;

    constructor() {
        this.resetQueue();
    }

    resetQueue() {
        this.queued_tracks = new Array<ITrack>();
    }

    addToQueue(track : ITrack) {
        this.queued_tracks.push(track);
    }
}

@inject(Lazy.of(HttpClient))
export class AllPlay {
  debug : boolean = false;
  tracks: Array<ITrack> = [];
  //speakers: Array<Speaker> = [];
  
  http: HttpClient;

  constructor(private getHttpClient: () => HttpClient) {
    this.http = this.getHttpClient();

    let self = this;

    this.http.configure(config => {
      config
        .useStandardConfiguration()
        .withBaseUrl('http://192.168.1.6:5000/')
        .withDefaults({
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    }
                })
        .withInterceptor({
            request(request) {
                // if(self.debug) {
                //   //console.log(`Requesting ${request.method} ${request.url}`);
                //   let jsonTracks = require("./json/tracks.json");
                //   return new Response(JSON.stringify(jsonTracks));   // Fake Data
                // }

                return request; // you c = an return a modified Request, or you can short-circuit the request by returning a Response
            },
            response(response) {

                return response;
            }
        })
    });
  }

  handleErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
  }

  async fetchTracks(): Promise<void> {

    // ensure fetch is polyfilled before we create the http client
    await fetch;

    const response = await this.http.fetch('tracks', {
        method: 'get',
        //dataType : 'json'
    });

    let result = await response.json();
    this.tracks = result['items'];
    console.log(this);
  }

  async getTracks() {
      if (this.tracks.length <= 0) {
          await this.fetchTracks();
      }

      return this.tracks;
  }

  getTrack(id: number) {
      this.getTracks();
      return this.tracks.filter(track => track.id === +id)[0];
  }

  async getAlbums(): Promise<Array<IAlbum>> {

    // ensure fetch is polyfilled before we create the http client
    await fetch;

    const response = await this.http.fetch('albums', {
        method: 'get',
    });

    let result = await response.json();
    return result['albums'];
  }

  async getTracksForAlbum(album_id : number): Promise<Array<ITrack>> {

    // ensure fetch is polyfilled before we create the http client
    await fetch;

    const response = await this.http.fetch('albumtracks/' + album_id, {
        method: 'get',
    });

    let result = await response.json();
    return result['items'];
  }

  private async addToQueue(track: ITrack) {
    let parameters = { 'track_id': track.id, 'path': track.path };
    await this.http.fetch('add_to_queue', {
        method: 'post',
        body: JSON.stringify(parameters)
    });
    console.log("adding to queue " + track.path);
  }

  async setupQueueMode(mode : boolean) {
    await fetch;

    let parameters = {'mode': mode };
    this.http.fetch('set_queue_mode', {
        method: 'post',
        body: JSON.stringify(parameters)
    });
  }

  async saveQueue(name : string, tracks : Array<ITrack>) {
    await fetch;

    let parameters = {'name' : name, 'tracks' : tracks}

    this.http.fetch('save_playlist', {
        method: 'post',
        body: JSON.stringify(parameters)
    });
  }

  async getPlaylists() {
    await fetch;

    let response = await this.http.fetch('playlists');
    let result = await response.json();
    let playlists = result['items'];
    return playlists;
  }

  async getPlaylist(name : string) : Promise<ITrack[]> {
    await fetch;

    let response = await this.http.fetch('playlist/' + name);
    let result = await response.json();
    let tracks = result['items'];
    return tracks;
  }

  async updateTrackMetadata(track: ITrack): Promise<void> {
    // ensure fetch is polyfilled before we create the http client
    await fetch;

    let parameters = { 'item': track };
    this.http.fetch('update', {
        method: 'post',
        body: JSON.stringify(parameters)
    });
  }

  async pause(): Promise<void> {
    // ensure fetch is polyfilled before we create the http client
    await fetch;

    this.http.fetch('pause', {
        method: 'get'
    });
  }

  async stop(): Promise<void> {
    // ensure fetch is polyfilled before we create the http client
    await fetch;

    this.http.fetch('stop', {
        method: 'post'
    })
    .catch(this.handleErrors) 
    {
    };
  }

  async play_queue(queueContainer : QueueContainer): Promise<void> {
    // ensure fetch is polyfilled before we create the http client
    await fetch;

    this.setupQueueMode(true);

    // Send queued items
    for (let i = 0; i < queueContainer.queued_tracks.length; i++) {
        await this.addToQueue(queueContainer.queued_tracks[i]);
    } 

    this.http.fetch('playqueue', {
        method: 'post'
    });
  }

  async reset_queue() {
    await this.http.fetch('reset_queue', {
        method: 'post'
    });
  }

  async empty_queue() {
    await this.http.fetch('empty_queue', {
        method: 'post'
    });
  }

  async playTrack(track : ITrack): Promise<void> {
    // ensure fetch is polyfilled before we create the http client
    await fetch;

    this.setupQueueMode(false);  // play individual song stops playing queue

    let parameters = { 'track_id': track.id };
    this.http.fetch('playtrack', {
        method: 'post',
        // headers: {
        //     'Content-Type': 'application/json'
        // },
        body: JSON.stringify(parameters)
    });
  }
  
  async adjustVolume(speaker: ISpeaker): Promise<void> {
    // ensure fetch is polyfilled before we create the http client
    await fetch;

    let parameters = { 'device_id' : speaker.id,  'volume': speaker.volume};
    this.http.fetch('adjust_volume', {
        method: 'post',
        body: JSON.stringify(parameters)
    });
  }

  async getSpeakers(): Promise<Array<ISpeaker>> {

    await fetch;

    const response = await this.http.fetch('get_devices', {
        method: 'get',
    });

    let result = await response.json();
    console.log(result);
    return result['devices'];


    // // ensure fetch is polyfilled before we create the http client
    // await fetch;

    // const response = await this.http.fetch('get_devices');
    // let result = await response.json();
    // let devices = result['devices'];
    
    // let speakers : Array<Speaker> = [];

    // for (let i in devices) {
    //     let v = devices[i];
    //     let speaker : Speaker = new Speaker(this.http, v[0], v[1]);
    //     speakers.push(speaker);
    // }

    // console.log(this);
    // return speakers;
  }

  async selectSpeakers(speakers : Array<ISpeaker>) {

      let speakerIds = Array<any>();

      for (let i = 0; i < speakers.length; i++) {
        let s = speakers[i];
        speakerIds.push({'id': s.id, 'selected': s.selected});
      }

      let parameters = {'devices': speakerIds};

      await this.http.fetch('set_active_players', {
        method: 'post',
        body: JSON.stringify(parameters)
      });
  }

//   loadSpeakersFromLocalStorage() {
//       let speakersJson : string = localStorage.getItem("speakers");
//       let savedSpeakers = null;

//       if(speakersJson !== null && speakersJson != "") {
//         savedSpeakers = JSON.parse(speakersJson);
//       }

//       let allSpeakers = await this.allplay.getSpeakers();

//       for (let i in allSpeakers) {
//           let s = allSpeakers[i];
//           if (s.id in savedSpeakers) {
//             s.selected = true;
//           }
//       }

//       this.allplay.selectSpeakers(allSpeakers);
//   }

//   saveSpeakersToLocalStorage(speakers: Array<Speaker>) {
    
//     let tmp = {};

//     for (let speaker of speakers) {
//         if(speaker.selected) {
//             tmp[speaker.id] = speaker.name;
//         }
//         localStorage.setItem("speakers", JSON.stringify(tmp);
//     }

//     return true;
//   }
}
