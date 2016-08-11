import {inject, Lazy, autoinject, singleton} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';


// polyfill fetch client conditionally
const fetch = !self.fetch ? System.import('isomorphic-fetch') : Promise.resolve(self.fetch);

function mapToJson(map) {
    return JSON.stringify([...map]);
}

function jsonToMap(jsonStr) {
    return new Map<number, ITrack>(JSON.parse(jsonStr));
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
  state: string;
  name: string;
  volume: number;

  constructor(private http: HttpClient, id: string, state: string, name: string, volume: number) {
    this._selected = false;
    this.id = id;
    this.state = state;
    this.name = name;
    this.volume = volume;
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
  tracks: Array<ITrack> = [];
  speakers: Array<Speaker> = [];
  queue: QueueContainer = new Map<number, ITrack>();
  http: HttpClient;

  constructor(private getHttpClient: () => HttpClient) {
    this.queue = jsonToMap(localStorage.getItem("queue"));

    this.http = this.getHttpClient();

    this.http.configure(config => {
      config
        .useStandardConfiguration()
        .withBaseUrl('http://0.0.0.0:8337/');
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

    this.http.fetch('play', {
        method: 'get'
    });
  }

  async playTrack(track : ITrack): Promise<void> {
    // ensure fetch is polyfilled before we create the http client
    await fetch;

    let parameters = { 'track_id': track };
    this.http.fetch('playtrack', {
        method: 'post',
        body: JSON.stringify(parameters)
    });
  }
  
  async adjustVolume(track : ITrack, volume : number): Promise<void> {
    // ensure fetch is polyfilled before we create the http client
    await fetch;

    let parameters = { 'device_id' : track.id,  'volume': volume};
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
 
    for (let i in devices) {
        let v = devices[i];
        this.speakers.push(new Speaker(this.http, v.id, v.state,
                                      v.name, v.volume));
    }

    console.log(this);
  }

  async getSpeakers() {
      if (this.speakers.length <= 0) {
          await this.fetchSpeakers();
      }

      return this.speakers;
  }

}