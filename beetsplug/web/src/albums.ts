import {inject, Lazy, autoinject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-fetch-client';
import {Router} from 'aurelia-router';
import {AllPlay, IAlbum} from './allplay';
import {Queue} from './queue';


@inject(AllPlay, Queue, Router)
export class Albums {
  heading : string = 'Albums';
  albums : Array<IAlbum> = [];
  pageAlbums : Array<IAlbum> = [];
  activePage : number = 1;
  numberOfPages : number = 1;
  showFirstLastPages : boolean = false;
  albumsPerPage : number = 25;
  visiblePageLinks : number = 16;
  searchText : string = "";

  constructor(private allplay: AllPlay, private queue: Queue, private router: Router) {

  }

  async activate(params, navigationInstruction): Promise<void> {
    this.albums = await this.allplay.getAlbums();
    this.numberOfPages = Math.ceil(this.albums.length / this.albumsPerPage);
    this.setPage(1);
  }

  private match(search : string, item: any) : boolean {
        let lcase_search = search.toLowerCase();
        if((item['album'].toLowerCase().indexOf(lcase_search) > -1) ||
        (item['albumartist'].toLowerCase().indexOf(lcase_search) > -1) {
            return true;
        }
        return false;
  }

  setPage(pageNumber : number) {
    let filteredItems = this.albums.slice();

    if (this.searchText !== undefined && this.searchText.length > 0)  {
        filteredItems = this.albums.filter((item) => this.match(this.searchText, item)); 
    }

    this.numberOfPages = Math.ceil(filteredItems.length / this.albumsPerPage);

    let start : number = this.albumsPerPage * (pageNumber - 1);
    filteredItems = filteredItems.slice(start, start + this.albumsPerPage); 
    this.pageAlbums = filteredItems;
  }

  onSearchText(event : any) {
      this.setPage(1);
  }
  
  onPageChanged(e) {
    this.setPage(e.detail);
  }

  async addToQueue(event: any, album_id: number) {

    let tracks = await this.allplay.getTracksForAlbum(album_id);
 
    this.queue.resetQueue();

    for (let track of tracks) {
        await this.queue.addToQueue(track);
    }
  }
}
