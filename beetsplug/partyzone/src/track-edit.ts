//import {computedFrom} from 'aurelia-framework';
import {inject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {Tracks} from './tracks';
import {AllPlay, ITrack} from './allplay';

@inject(AllPlay)
export class TrackEdit {
  track: ITrack;
  //http: HttpClient;

  //heading: string = 'Welcome to the Aurelia Navigation App';
  //firstName: string = 'John';
  //lastName: string = 'Doe';
  //previousValue: string = this.fullName;

  //Getters can't be directly observed, so they must be dirty checked.
  //However, if you tell Aurelia the dependencies, it no longer needs to dirty check the property.
  //To optimize by declaring the properties that this getter is computed from, uncomment the line below
  //as well as the corresponding import above.
  //@computedFrom('firstName', 'lastName')
  //get fullName(): string {
  //  return `${this.firstName} ${this.lastName}`;
  //}

  //constructor(private getHttpClient: () => HttpClient, private tracks: Array<ITrack>[]) {
  constructor(private allplay: AllPlay) {
    //console.log(tracks.getTracks());
  }

  async activate(idObject) {
    //alert(idObject.id);
    this.track = this.allplay.getTrack(idObject.id);
    //console.log(this.tracks);
    /*
    await fetch;
    const http = this.http = this.getHttpClient();

    http.configure(config => {
      config
        .useStandardConfiguration()
        .withBaseUrl('http://0.0.0.0:8337/');
    });

    const response = await http.fetch('tracks');
    let result = await response.json();
    this.tracks = result['items'];
    */


 //   getTrack(id: number) {
  
 //   return this.getTracks().toPromise()             
 //              .then(tracks => tracks.filter(track => track.id === id)[0])
 //              .catch(this.handleError);
 // }


  }

  submit() {
    //this.previousValue = this.fullName;
    alert(`TrackEdit, ${this.track.id}!`);
  }

  canDeactivate(): boolean {
    return true;
    //if (this.fullName !== this.previousValue) {
    //  return confirm('Are you sure you want to leave?');
    //}
  }
}
