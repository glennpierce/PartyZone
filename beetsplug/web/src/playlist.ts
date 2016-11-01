import {Aurelia, inject} from 'aurelia-framework';
import {DialogController} from 'aurelia-dialog';
import {AllPlay, ITrack} from './allplay';


@inject(AllPlay, DialogController)
export class Playlist {
  static inject = [DialogController];
  private playlists : string[];

  constructor(private allplay: AllPlay, private controller : DialogController){

    this.controller = controller;
  }

  async activate(){
    this.playlists = await this.allplay.getPlaylists();
    console.log(this.playlists);
  }

  selectPlaylist (selectedPlaylist) {

    let self = this;

    console.log(selectedPlaylist);

/*
    this.bcp.loginUsername(auth.username, auth.password)
      .catch(response => {
        this.auth.error = "Invalid username or password";
      })
      .then(response => {
          if(response.hasOwnProperty('token')) {
            this.auth.error = "";
            self.controller.ok(auth);
          }
      });
*/

  }
}
