import {Aurelia} from 'aurelia-framework';
import {bootstrap} from 'aurelia-bootstrapper-webpack';
//import 'aurelia-materialize-bridge';
import 'materialize-css';
//import 'ghpages-materialize';
import 'bootstrap';

bootstrap(async (aurelia: Aurelia) => {
  aurelia.use
    .standardConfiguration()
    .plugin('aurelia-materialize-bridge', bridge => bridge.useAll())

    //.plugin('aurelia-materialize-bridge', bridge => { bridge.useCheckbox().
    //                                                         useSelect().
    //                                                         useInput().
    //                                                         usePagination().
    //                                                         useButton().
    //                                                         useRange(); })

    .developmentLogging()
    .plugin('aurelia-dialog', config => {
      config.useDefaults();
      config.settings.lock = true;
      config.settings.centerHorizontalOnly = false;
      config.settings.startingZIndex = 1005;
    });


  //Uncomment the line below to enable animation.
  // aurelia.use.plugin('aurelia-animator-css');
  //if the css animator is enabled, add swap-order="after" to all router-view elements

  //Anyone wanting to use HTMLImports to load views, will need to install the following plugin.
  // aurelia.use.plugin('aurelia-html-import-template-loader')

  const rootElement = document.body;
  rootElement.setAttribute('aurelia-app', '');

  await aurelia.start();
  aurelia.setRoot('app', rootElement);
  // if you would like your website to work offline (Service Worker), 
  // install and enable the @easy-webpack/config-offline package in webpack.config.js and uncomment the following code:
  /*
  const offline = await System.import('offline-plugin/runtime');
  offline.install();
  */
});
