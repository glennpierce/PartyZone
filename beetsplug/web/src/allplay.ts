import {inject, Lazy, autoinject, singleton} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';

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

export interface ITrack {
  id: number;
  title: string;
  path: string;
  album: string;
  artist: string;
}

export class Speaker {
 
  private _selected: boolean;
  id: string;
  name: string;

  constructor(private http: HttpClient, id: string, name: string) {
    this._selected = false;
    this.id = id;
    this.name = name;
  };

  get selected(): boolean {
    return this._selected;
  }
 
  set selected(value: boolean) {
    this._selected = value;
  }
}

export type QueueContainer = Map<number, ITrack>;

@inject(Lazy.of(HttpClient))
export class AllPlay {
  debug : boolean = false;
  tracks: Array<ITrack> = [];
  speakers: Array<Speaker> = [];
  queue: QueueContainer = new Map<number, ITrack>();
  http: HttpClient;

  constructor(private getHttpClient: () => HttpClient) {
    this.queue = jsonToMap(localStorage.getItem("queue"));

    this.http = this.getHttpClient();

    let self = this;

    this.http.configure(config => {
      config
        .useStandardConfiguration()
        .withBaseUrl('http://127.0.0.1:5000/')
        .withInterceptor({
            request(request) {
                if(self.debug) {
                  //console.log(`Requesting ${request.method} ${request.url}`);
                  let jsonTracks = require("./json/tracks.json");
                  return new Response(JSON.stringify(jsonTracks));   // Fake Data
                }

                return request; // you c = an return a modified Request, or you can short-circuit the request by returning a Response
            },
            response(response) {

                return response;
            }
        })
    });
  }

  async fetchTracks(): Promise<void> {

    // ensure fetch is polyfilled before we create the http client
    await fetch;

    const response = await this.http.fetch('tracks');
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

  addToQueue(track: ITrack) {
    //this.queue.push(track)
    this.queue.set(+track.id, track);
    localStorage.setItem("queue", mapToJson(this.queue));
    console.log(track);
    event.preventDefault();
  }

  isTrackInQueue(track: ITrack) : boolean {

    return false;
  }

  getQueuedItems() : QueueContainer {
      return this.queue;
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
        method: 'get'
    });
  }

  async play(): Promise<void> {
    // ensure fetch is polyfilled before we create the http client
    await fetch;

    let entries = Array.from(this.queue.keys());
    let parameters = { 'queue': entries };
    this.http.fetch('play', {
        method: 'post',
        body: JSON.stringify(parameters)
    });
  }

  async reset_queue() {
    // ensure fetch is polyfilled before we create the http client
    this.queue = new Map<number, ITrack>();
    localStorage.setItem("queue", "[]");
  }

  async playTrack(track : ITrack): Promise<void> {
    // ensure fetch is polyfilled before we create the http client
    await fetch;

    let parameters = { 'track_id': track.id };
    this.http.fetch('playtrack', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(parameters)
    });
  }
  
  async adjustVolume(speaker: Speaker): Promise<void> {
    // ensure fetch is polyfilled before we create the http client
    await fetch;

    let parameters = { 'device_id' : speaker.id,  'volume': speaker.volume};
    this.http.fetch('adjust_volume', {
        method: 'post',
        body: JSON.stringify(parameters)
    });
  }

  async fetchSpeakers(): Promise<void> {
    // ensure fetch is polyfilled before we create the http client
    await fetch;

    const response = await this.http.fetch('get_devices');
    let result = await response.json();
    let devices = result['devices'];
    
    this.speakers = [];

    for (let i in devices) {
        let v = devices[i];
        let speaker : Speaker = new Speaker(this.http, v[0], v[1]);
        this.speakers.push(speaker);
    }

    console.log(this);
  }

  async getSpeakers() {
      if (this.speakers.length <= 0) {
          await this.fetchSpeakers();
      }

      return this.speakers;
  }

  async selectSpeakers() {

      let speakerIds = Array<any>();

      for (let i in this.speakers) {
        let s = this.speakers[i];
        speakerIds.push({'id': s.id, 'selected': s.selected});
      }

      //localStorage.setItem("speakers", JSON.stringify(speakerIds));

      let parameters = {'devices': speakerIds};

      this.http.fetch('set_active_players', {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(parameters)
      });

      //this.queue = jsonToMap(localStorage.getItem("queue"));

      //$cookies.putObject('selected_devices', $scope.selected_devices);
  }
}
