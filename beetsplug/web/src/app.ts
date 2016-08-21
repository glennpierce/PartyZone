import {Aurelia} from 'aurelia-framework';
import {Router, RouterConfiguration} from 'aurelia-router';


export class App {
  router: Router;

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
