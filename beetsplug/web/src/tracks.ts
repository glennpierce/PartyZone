import {inject, Lazy, autoinject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {Router} from 'aurelia-router';
import {AllPlay, ITrack} from './allplay';
import {Queue} from './queue';


@inject(AllPlay, Router, Queue)
export class Tracks {
  heading : string = 'Tracks';
  tracks : Array<ITrack> = [];
  pageTracks : Array<ITrack> = [];
  activePage : number = 1;
  numberOfPages : number = 1;
  showFirstLastPages : boolean = false;
  tracksPerPage : number = 25;
  visiblePageLinks : number = 16;
  searchText : string = "";

  constructor(private allplay: AllPlay, private router: Router, private queue: Queue) {

  }

  async activate(params, navigationInstruction): Promise<void> {
    this.tracks = await this.allplay.getTracks();
    this.numberOfPages = Math.ceil(this.tracks.length / this.tracksPerPage);
    this.setPage(1);
  }

  private match(search : string, item: any) : boolean {
        let lcase_search = search.toLowerCase();
        if((item['title'].toLowerCase().indexOf(lcase_search) > -1) ||
        (item['artist'].toLowerCase().indexOf(lcase_search) > -1) ||
        (item['album'].toLowerCase().indexOf(lcase_search) > -1)) {
            return true;
        }
        return false;
  }

  setPage(pageNumber : number) {
    let filteredItems = this.tracks.slice();

    if (this.searchText !== undefined && this.searchText.length > 0)  {
        filteredItems = this.tracks.filter((item) => this.match(this.searchText, item)); 
    }

    this.numberOfPages = Math.ceil(filteredItems.length / this.tracksPerPage);

    let start : number = this.tracksPerPage * (pageNumber - 1);
    filteredItems = filteredItems.slice(start, start + this.tracksPerPage); 
    this.pageTracks = filteredItems;
  }

  onSearchText(event : any) {
      this.setPage(1);
  }
  
  onPageChanged(e) {
    this.setPage(e.detail);
  }

  addToQueue(event: any, track: ITrack) {
    this.queue.addToQueue(track);
  }

  gotoTrackEdit(event: any, track: ITrack) {
    this.router.navigateToRoute('track-edit', { id: track.id });
    event.preventDefault();
  }

  playTrack(event: any, track: ITrack) {
    this.allplay.playTrack(track);
  	return true;
  }
}
