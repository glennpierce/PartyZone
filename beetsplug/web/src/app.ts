import {Aurelia} from 'aurelia-framework';
import {Router, RouterConfiguration} from 'aurelia-router';
import {inject} from 'aurelia-framework';
import {AllPlay, QueueContainer} from './allplay';
import {Speakers} from './speakers';
//import {MdRange} from 'aurelia-materialize-bridge';

@inject(AllPlay, QueueContainer, Speakers)
export class App {
  router: Router;

  constructor(private allplay: AllPlay, private queueContainer: QueueContainer, private speakers: Speakers) {
      //speakers.setup();
  }

  configureRouter(config: RouterConfiguration, router: Router) {
    config.title = 'Partyzone';
    config.map([
      { route: ['', 'tracks'],  name: 'tracks',   moduleId: './tracks',   nav: true, title: 'Tracks' },
      { route: 'albums',  name: 'albums',   moduleId: './albums',   nav: true, title: 'Albums' },
      { route: 'speakers',  name: 'speakers',   moduleId: './speakers',   nav: true, title: 'Speakers' },
      { route: 'queue',  name: 'queue',   moduleId: './queue',   nav: true, title: 'Queue' },
      { route: 'track-edit/:id', name: 'track-edit',   moduleId: './track-edit',   nav: false, title: 'Track Edit' },
      //{ route: 'partyzone_event/:event_type', name: 'partyzone_event',   moduleId: './partyzone_event',   nav: false, title: 'Partyzone Event' },
    ]);

    this.router = router;
  }

  // getBaseUrl() {
  //   var re = new RegExp(/^.*\//);
  //   return re.exec(window.location.href).toString();
  // }

  activate() {

    //let base : string = this.getBaseUrl();
    //this.allplay.setupAutoMode(false);
  }
}
