import {Aurelia} from 'aurelia-framework';
import {Router, RouterConfiguration} from 'aurelia-router';
import {inject} from 'aurelia-framework';
import {Speakers} from './speakers';
//import {MdRange} from 'aurelia-materialize-bridge';

@inject(Speakers)
export class App {
  router: Router;

  constructor(private speakers: Speakers) {
      //speakers.setup();
  }

  configureRouter(config: RouterConfiguration, router: Router) {
    config.title = 'AllPlay';
    config.map([
      { route: ['', 'tracks'],  name: 'tracks',   moduleId: './tracks',   nav: true, title: 'Tracks' },
      { route: 'speakers',  name: 'speakers',   moduleId: './speakers',   nav: true, title: 'Speakers' },
      { route: 'queue',  name: 'queue',   moduleId: './queue',   nav: true, title: 'Queue' },
      { route: 'track-edit/:id', name: 'track-edit',   moduleId: './track-edit',   nav: false, title: 'Track Edit' }
    ]);

    this.router = router;
  }
}
