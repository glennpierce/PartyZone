var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
define('allplay',["require", "exports", 'aurelia-framework', 'aurelia-fetch-client'], function (require, exports, aurelia_framework_1, aurelia_fetch_client_1) {
    "use strict";
    class Speaker {
        constructor(id, name, selected) {
            this.id = id;
            this.name = name;
            this.selected = selected;
        }
    }
    exports.Speaker = Speaker;
    class QueueContainer {
        constructor() {
            this.resetQueue();
        }
        resetQueue() {
            this.queued_tracks = new Array();
        }
        addToQueue(track) {
            this.queued_tracks.push(track);
        }
    }
    exports.QueueContainer = QueueContainer;
    let AllPlay = class AllPlay {
        constructor(getHttpClient) {
            this.getHttpClient = getHttpClient;
            this.debug = false;
            this.tracks = [];
            this.http = this.getHttpClient();
            let self = this;
            this.http.configure(config => {
                config
                    .useStandardConfiguration()
                    .withBaseUrl('http://192.168.1.6:5000/')
                    .withDefaults({
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    }
                })
                    .withInterceptor({
                    request(request) {
                        return request;
                    },
                    response(response) {
                        return response;
                    }
                });
            });
            this.getSpeakers();
        }
        handleErrors(response) {
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return response;
        }
        fetchTracks() {
            return __awaiter(this, void 0, void 0, function* () {
                yield fetch;
                const response = yield this.http.fetch('tracks', {
                    method: 'get',
                });
                let result = yield response.json();
                this.tracks = result['items'];
                console.log(this);
            });
        }
        getTracks() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.tracks.length <= 0) {
                    yield this.fetchTracks();
                }
                return this.tracks;
            });
        }
        getTrack(id) {
            this.getTracks();
            return this.tracks.filter(track => track.id === +id)[0];
        }
        getAlbums() {
            return __awaiter(this, void 0, void 0, function* () {
                yield fetch;
                const response = yield this.http.fetch('albums', {
                    method: 'get',
                });
                let result = yield response.json();
                return result['albums'];
            });
        }
        getTracksForAlbum(album_id) {
            return __awaiter(this, void 0, void 0, function* () {
                yield fetch;
                const response = yield this.http.fetch('albumtracks/' + album_id, {
                    method: 'get',
                });
                let result = yield response.json();
                return result['items'];
            });
        }
        addToQueue(track) {
            return __awaiter(this, void 0, void 0, function* () {
                let parameters = { 'track_id': track.id, 'path': track.path };
                yield this.http.fetch('add_to_queue', {
                    method: 'post',
                    body: JSON.stringify(parameters)
                });
                console.log("adding to queue " + track.path);
            });
        }
        setupQueueMode(mode) {
            return __awaiter(this, void 0, void 0, function* () {
                yield fetch;
                let parameters = { 'mode': mode };
                this.http.fetch('set_queue_mode', {
                    method: 'post',
                    body: JSON.stringify(parameters)
                });
            });
        }
        saveQueue(name, tracks) {
            return __awaiter(this, void 0, void 0, function* () {
                yield fetch;
                let parameters = { 'name': name, 'tracks': tracks };
                this.http.fetch('save_playlist', {
                    method: 'post',
                    body: JSON.stringify(parameters)
                });
            });
        }
        getPlaylists() {
            return __awaiter(this, void 0, void 0, function* () {
                yield fetch;
                let response = yield this.http.fetch('playlists');
                let result = yield response.json();
                let playlists = result['items'];
                return playlists;
            });
        }
        getPlaylist(name) {
            return __awaiter(this, void 0, void 0, function* () {
                yield fetch;
                let response = yield this.http.fetch('playlist/' + name);
                let result = yield response.json();
                let tracks = result['items'];
                return tracks;
            });
        }
        updateTrackMetadata(track) {
            return __awaiter(this, void 0, void 0, function* () {
                yield fetch;
                let parameters = { 'item': track };
                this.http.fetch('update', {
                    method: 'post',
                    body: JSON.stringify(parameters)
                });
            });
        }
        pause() {
            return __awaiter(this, void 0, void 0, function* () {
                yield fetch;
                this.http.fetch('pause', {
                    method: 'get'
                });
            });
        }
        stop() {
            return __awaiter(this, void 0, void 0, function* () {
                yield fetch;
                this.http.fetch('stop', {
                    method: 'post'
                })
                    .catch(this.handleErrors);
                {
                }
                ;
            });
        }
        play_queue(queueContainer) {
            return __awaiter(this, void 0, void 0, function* () {
                yield fetch;
                this.setupQueueMode(true);
                for (let i = 0; i < queueContainer.queued_tracks.length; i++) {
                    yield this.addToQueue(queueContainer.queued_tracks[i]);
                }
                this.http.fetch('playqueue', {
                    method: 'post'
                });
            });
        }
        reset_queue() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.http.fetch('reset_queue', {
                    method: 'post'
                });
            });
        }
        empty_queue() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.http.fetch('empty_queue', {
                    method: 'post'
                });
            });
        }
        playTrack(track) {
            return __awaiter(this, void 0, void 0, function* () {
                yield fetch;
                this.setupQueueMode(false);
                let parameters = { 'track_id': track.id };
                this.http.fetch('playtrack', {
                    method: 'post',
                    body: JSON.stringify(parameters)
                });
            });
        }
        adjustVolume(speaker) {
            return __awaiter(this, void 0, void 0, function* () {
                yield fetch;
                let parameters = { 'device_id': speaker.id, 'volume': speaker.volume };
                this.http.fetch('adjust_volume', {
                    method: 'post',
                    body: JSON.stringify(parameters)
                });
            });
        }
        getSpeakers() {
            return __awaiter(this, void 0, void 0, function* () {
                yield fetch;
                let tmp = new Array();
                const response = yield this.http.fetch('get_devices', {
                    method: 'get',
                });
                let result = yield response.json();
                let speakers = yield result['devices'];
                for (let s of speakers) {
                    tmp.push(new Speaker(s.id, s.name, s.selected));
                }
                return tmp;
            });
        }
        selectSpeakers(speakers) {
            return __awaiter(this, void 0, void 0, function* () {
                let speakerIds = Array();
                for (let i = 0; i < speakers.length; i++) {
                    let s = speakers[i];
                    speakerIds.push({ 'id': s.id, 'selected': s.selected });
                }
                let parameters = { 'devices': speakerIds };
                yield this.http.fetch('set_active_players', {
                    method: 'post',
                    body: JSON.stringify(parameters)
                });
            });
        }
    };
    AllPlay = __decorate([
        aurelia_framework_1.inject(aurelia_framework_1.Lazy.of(aurelia_fetch_client_1.HttpClient)), 
        __metadata('design:paramtypes', [Function])
    ], AllPlay);
    exports.AllPlay = AllPlay;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
define('tracks',["require", "exports", 'aurelia-framework', 'aurelia-router', './allplay', './queue'], function (require, exports, aurelia_framework_1, aurelia_router_1, allplay_1, queue_1) {
    "use strict";
    let Tracks = class Tracks {
        constructor(allplay, queue, router) {
            this.allplay = allplay;
            this.queue = queue;
            this.router = router;
            this.heading = 'Tracks';
            this.tracks = [];
            this.pageTracks = [];
            this.activePage = 1;
            this.numberOfPages = 1;
            this.showFirstLastPages = false;
            this.tracksPerPage = 25;
            this.visiblePageLinks = 16;
            this.searchText = "";
        }
        activate(params, navigationInstruction) {
            return __awaiter(this, void 0, void 0, function* () {
                this.tracks = yield this.allplay.getTracks();
                this.numberOfPages = Math.ceil(this.tracks.length / this.tracksPerPage);
                this.setPage(1);
            });
        }
        match(search, item) {
            let lcase_search = search.toLowerCase();
            if ((item['title'].toLowerCase().indexOf(lcase_search) > -1) ||
                (item['artist'].toLowerCase().indexOf(lcase_search) > -1) ||
                (item['album'].toLowerCase().indexOf(lcase_search) > -1)) {
                return true;
            }
            return false;
        }
        setPage(pageNumber) {
            let filteredItems = this.tracks.slice();
            if (this.searchText !== undefined && this.searchText.length > 0) {
                filteredItems = this.tracks.filter((item) => this.match(this.searchText, item));
            }
            this.numberOfPages = Math.ceil(filteredItems.length / this.tracksPerPage);
            let start = this.tracksPerPage * (pageNumber - 1);
            filteredItems = filteredItems.slice(start, start + this.tracksPerPage);
            this.pageTracks = filteredItems;
        }
        onSearchText(event) {
            this.setPage(1);
        }
        onPageChanged(e) {
            this.setPage(e.detail);
        }
        addToQueue(event, track) {
            this.queue.addToQueue(track);
        }
        playTrack(event, track) {
            this.allplay.stop();
            this.allplay.setupQueueMode(false);
            this.allplay.playTrack(track);
            return false;
        }
        gotoTrackEdit(event, track) {
            this.router.navigateToRoute('track-edit', { id: track.id });
            event.preventDefault();
        }
    };
    Tracks = __decorate([
        aurelia_framework_1.inject(allplay_1.AllPlay, queue_1.Queue, aurelia_router_1.Router), 
        __metadata('design:paramtypes', [allplay_1.AllPlay, queue_1.Queue, aurelia_router_1.Router])
    ], Tracks);
    exports.Tracks = Tracks;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
define('queue',["require", "exports", 'aurelia-framework', 'aurelia-router', './allplay'], function (require, exports, aurelia_framework_1, aurelia_router_1, allplay_1) {
    "use strict";
    let Queue = class Queue {
        constructor(allplay, queueContainer, router) {
            this.allplay = allplay;
            this.queueContainer = queueContainer;
            this.router = router;
            this.heading = 'Queue';
        }
        activate(params, navigationInstruction) {
            return __awaiter(this, void 0, void 0, function* () {
                this.playlists = yield this.allplay.getPlaylists();
            });
        }
        get queuedTracks() {
            return this.queueContainer.queued_tracks;
        }
        resetQueue() {
            this.queueContainer.resetQueue();
            this.allplay.empty_queue();
            return true;
        }
        reset(event) {
            return __awaiter(this, void 0, void 0, function* () {
                this.resetQueue();
                return true;
            });
        }
        addToQueue(track) {
            this.queueContainer.addToQueue(track);
        }
        play(event) {
            this.allplay.play_queue(this.queueContainer);
            return true;
        }
        stop(event) {
            this.allplay.setupQueueMode(false);
            this.allplay.stop();
            this.allplay.reset_queue();
            return true;
        }
        pause(event) {
            this.allplay.pause();
            return true;
        }
        playTrack(event, track) {
            this.allplay.playTrack(track);
            return true;
        }
        selectPlaylist(event, selectedPlaylist) {
            return __awaiter(this, void 0, void 0, function* () {
                let self = this;
                console.log(selectedPlaylist);
                let tracks = yield this.allplay.getPlaylist(selectedPlaylist.name);
                this.resetQueue();
                for (let track of tracks) {
                    console.log("in loop: " + track.path);
                    yield this.addToQueue(track);
                }
                this.loadDialog.close();
            });
        }
        savePlaylist(event, playListName) {
            return __awaiter(this, void 0, void 0, function* () {
                let self = this;
                this.allplay.saveQueue(playListName, this.queuedTracks);
                this.saveDialog.close();
            });
        }
    };
    Queue = __decorate([
        aurelia_framework_1.inject(allplay_1.AllPlay, allplay_1.QueueContainer, aurelia_router_1.Router), 
        __metadata('design:paramtypes', [allplay_1.AllPlay, allplay_1.QueueContainer, aurelia_router_1.Router])
    ], Queue);
    exports.Queue = Queue;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
define('albums',["require", "exports", 'aurelia-framework', 'aurelia-router', './allplay', './queue'], function (require, exports, aurelia_framework_1, aurelia_router_1, allplay_1, queue_1) {
    "use strict";
    let Albums = class Albums {
        constructor(allplay, queue, router) {
            this.allplay = allplay;
            this.queue = queue;
            this.router = router;
            this.heading = 'Albums';
            this.albums = [];
            this.pageAlbums = [];
            this.activePage = 1;
            this.numberOfPages = 1;
            this.showFirstLastPages = false;
            this.albumsPerPage = 25;
            this.visiblePageLinks = 16;
            this.searchText = "";
        }
        activate(params, navigationInstruction) {
            return __awaiter(this, void 0, void 0, function* () {
                this.albums = yield this.allplay.getAlbums();
                this.numberOfPages = Math.ceil(this.albums.length / this.albumsPerPage);
                this.setPage(1);
            });
        }
        match(search, item) {
            let lcase_search = search.toLowerCase();
            if ((item['album'].toLowerCase().indexOf(lcase_search) > -1) ||
                (item['albumartist'].toLowerCase().indexOf(lcase_search) > -1)) {
                return true;
            }
            return false;
        }
        setPage(pageNumber) {
            let filteredItems = this.albums.slice();
            if (this.searchText !== undefined && this.searchText.length > 0) {
                filteredItems = this.albums.filter((item) => this.match(this.searchText, item));
            }
            this.numberOfPages = Math.ceil(filteredItems.length / this.albumsPerPage);
            let start = this.albumsPerPage * (pageNumber - 1);
            filteredItems = filteredItems.slice(start, start + this.albumsPerPage);
            this.pageAlbums = filteredItems;
        }
        onSearchText(event) {
            this.setPage(1);
        }
        onPageChanged(e) {
            this.setPage(e.detail);
        }
        addToQueue(event, album_id) {
            return __awaiter(this, void 0, void 0, function* () {
                let tracks = yield this.allplay.getTracksForAlbum(album_id);
                for (let track of tracks) {
                    yield this.queue.addToQueue(track);
                }
            });
        }
    };
    Albums = __decorate([
        aurelia_framework_1.inject(allplay_1.AllPlay, queue_1.Queue, aurelia_router_1.Router), 
        __metadata('design:paramtypes', [allplay_1.AllPlay, queue_1.Queue, aurelia_router_1.Router])
    ], Albums);
    exports.Albums = Albums;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
define('speakers',["require", "exports", 'aurelia-framework', 'aurelia-router', './allplay'], function (require, exports, aurelia_framework_1, aurelia_router_1, allplay_1) {
    "use strict";
    let Speakers = class Speakers {
        constructor(allplay, router) {
            this.allplay = allplay;
            this.router = router;
            this.heading = 'Speakers';
            this.speakers = [];
        }
        discover() {
            return __awaiter(this, void 0, void 0, function* () {
                this.speakers = yield this.allplay.getSpeakers();
            });
        }
        activate() {
            return __awaiter(this, void 0, void 0, function* () {
                this.discover();
            });
        }
        speakerSelected(event, speaker) {
            this.allplay.selectSpeakers(this.speakers);
            return true;
        }
        volumeChanged(event, speaker) {
        }
    };
    Speakers = __decorate([
        aurelia_framework_1.inject(allplay_1.AllPlay, aurelia_router_1.Router), 
        __metadata('design:paramtypes', [allplay_1.AllPlay, aurelia_router_1.Router])
    ], Speakers);
    exports.Speakers = Speakers;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('app',["require", "exports", 'aurelia-framework', './allplay', './speakers'], function (require, exports, aurelia_framework_1, allplay_1, speakers_1) {
    "use strict";
    let App = class App {
        constructor(allplay, queueContainer, speakers) {
            this.allplay = allplay;
            this.queueContainer = queueContainer;
            this.speakers = speakers;
        }
        configureRouter(config, router) {
            config.title = 'Partyzone';
            config.map([
                { route: ['', 'tracks'], name: 'tracks', moduleId: './tracks', nav: true, title: 'Tracks' },
                { route: 'albums', name: 'albums', moduleId: './albums', nav: true, title: 'Albums' },
                { route: 'speakers', name: 'speakers', moduleId: './speakers', nav: true, title: 'Speakers' },
                { route: 'queue', name: 'queue', moduleId: './queue', nav: true, title: 'Queue' },
                { route: 'track-edit/:id', name: 'track-edit', moduleId: './track-edit', nav: false, title: 'Track Edit' },
            ]);
            this.router = router;
        }
        activate() {
        }
    };
    App = __decorate([
        aurelia_framework_1.inject(allplay_1.AllPlay, allplay_1.QueueContainer, speakers_1.Speakers), 
        __metadata('design:paramtypes', [allplay_1.AllPlay, allplay_1.QueueContainer, speakers_1.Speakers])
    ], App);
    exports.App = App;
});

define('environment',["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {
        debug: true,
        testing: true
    };
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('loading-indicator',["require", "exports", 'aurelia-templating', 'aurelia-dependency-injection', 'aurelia-event-aggregator'], function (require, exports, aurelia_templating_1, aurelia_dependency_injection_1, aurelia_event_aggregator_1) {
    "use strict";
    let LoadingIndicator = class LoadingIndicator {
        constructor(eventAggregator) {
            eventAggregator.subscribe('router:navigation:processing', this.start);
            eventAggregator.subscribe('router:navigation:complete', this.done);
        }
        start() {
        }
        done() {
        }
    };
    LoadingIndicator = __decorate([
        aurelia_templating_1.noView(),
        aurelia_dependency_injection_1.inject(aurelia_event_aggregator_1.EventAggregator), 
        __metadata('design:paramtypes', [Object])
    ], LoadingIndicator);
    exports.LoadingIndicator = LoadingIndicator;
});

define('main',["require", "exports", './environment'], function (require, exports, environment_1) {
    "use strict";
    Promise.config({
        longStackTraces: environment_1.default.debug,
        warnings: {
            wForgottenReturn: false
        }
    });
    function configure(aurelia) {
        aurelia.use
            .standardConfiguration()
            .developmentLogging()
            .plugin('aurelia-materialize-bridge', bridge => bridge.useAll())
            .feature('resources');
        if (environment_1.default.debug) {
            aurelia.use.developmentLogging();
        }
        if (environment_1.default.testing) {
            aurelia.use.plugin('aurelia-testing');
        }
        aurelia.start().then(() => aurelia.setRoot());
    }
    exports.configure = configure;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define('pager',["require", "exports", 'aurelia-binding', 'aurelia-templating', 'aurelia-framework'], function (require, exports, aurelia_binding_1, aurelia_templating_1, aurelia_framework_1) {
    "use strict";
    let logger = aurelia_framework_1.LogManager.getLogger('pager');
    let Pager = class Pager {
        constructor() {
            this.currentPage = 0;
            this.pageSize = 10;
        }
        goToPage(page) {
            if (page > 0) {
                this.currentPage = page;
            }
        }
        get selectedItems() {
            let start = this.pageSize * this.currentPage;
            let end = start + +this.pageSize;
            end = Math.min(this.items.length - this.pageSize, end);
            return this.items.slice(start, end);
        }
    };
    __decorate([
        aurelia_templating_1.bindable({ defaultBindingMode: aurelia_binding_1.bindingMode.twoWay }), 
        __metadata('design:type', Number)
    ], Pager.prototype, "currentPage", void 0);
    __decorate([
        aurelia_templating_1.bindable, 
        __metadata('design:type', Object)
    ], Pager.prototype, "items", void 0);
    __decorate([
        aurelia_templating_1.bindable, 
        __metadata('design:type', Number)
    ], Pager.prototype, "pageSize", void 0);
    __decorate([
        aurelia_framework_1.computedFrom('currentPage'), 
        __metadata('design:type', Object)
    ], Pager.prototype, "selectedItems", null);
    Pager = __decorate([
        aurelia_framework_1.inject(Element), 
        __metadata('design:paramtypes', [])
    ], Pager);
    exports.Pager = Pager;
});

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
define('track-edit',["require", "exports", 'aurelia-framework', './allplay'], function (require, exports, aurelia_framework_1, allplay_1) {
    "use strict";
    let TrackEdit = class TrackEdit {
        constructor(allplay) {
            this.allplay = allplay;
        }
        activate(idObject) {
            return __awaiter(this, void 0, void 0, function* () {
                this.track = this.allplay.getTrack(idObject.id);
            });
        }
        submit() {
            alert(`TrackEdit, ${this.track.id}!`);
        }
        canDeactivate() {
            return true;
        }
    };
    TrackEdit = __decorate([
        aurelia_framework_1.inject(allplay_1.AllPlay), 
        __metadata('design:paramtypes', [allplay_1.AllPlay])
    ], TrackEdit);
    exports.TrackEdit = TrackEdit;
});

define('resources/index',["require", "exports"], function (require, exports) {
    "use strict";
    function configure(config) {
    }
    exports.configure = configure;
});

define('text!albums.html', ['module'], function(module) { module.exports = "<template>\n\n  <require from=\"materialize-css/css/materialize.css\"></require>\n\n  <section>\n    <div class=\"container\">\n      <div class=\"section\">\n\n        <div class=\"col s12 m4\">\n\n              <md-input md-label=\"search albums\" md-value.bind=\"searchText\" change.delegate=\"onSearchText($event)\"></md-input>\n              <br><br>\n\n<!--\n              <md-collection view-model.ref=\"list\">\n                <md-collection-item repeat.for=\"album of pageAlbums\" class=\"avatar ${ selector.isSelected ? 'selected' : '' } ${ selector.mdDisabled ? 'disabled' : '' }\">\n                  \n                  <div class=\"row\">\n                    <div class=\"col s1\">\n                    <img width=\"72\" height=\"72\" src=\"http://192.168.1.6:5000/album_artwork/${album.id}\" />\n                    </div>\n\n                    <div class=\"col s11\">\n                      <div>${album.id}</div>\n                      <span class=\"accent-text title\">${album.album}</span>\n                      <p>Artist ${album.albumartist}</p>\n                      <div class=\"secondary-content\">\n                        <a href click.delegate=\"addToQueue($event, album.id)\"><i class=\"material-icons small\">playlist_add</i></a>\n                      </div>\n                    </div>\n                  </div>\n                </md-collection-item>\n              </md-collection>\n-->\n\n              <md-collection view-model.ref=\"list\">\n                <md-collection-item repeat.for=\"album of pageAlbums\" class=\"avatar ${ selector.isSelected ? 'selected' : '' } ${ selector.mdDisabled ? 'disabled' : '' }\">\n                  \n                  <img width=\"72\" height=\"72\"  src=\"http://192.168.1.6:5000/album_artwork/${album.id}\" alt=\"\" class=\"square\">\n                  <span class=\"title\">${album.album}</span>\n                  <p class=\"description\">Artist: ${album.albumartist}</p>\n                  <div class=\"secondary-content\">\n\n                    <a click.delegate=\"addToQueue($event, album.id)\" md-button=\"floating: true; large: true;\" md-waves=\"color: light; circle: true;\">\n                      <i class=\"material-icons small\">playlist_add</i>\n                    </a>\n\n<!--\n                    <a href click.delegate=\"addToQueue($event, album.id)\"><i class=\"material-icons small\">playlist_add</i></a>\n                    -->\n\n                  </div>\n                \n                </md-collection-item>\n              </md-collection>\n\n              <div class=\"center-align hide-on-large-only\">\n                  <md-pagination md-show-first-last.two-way=\"false\"\n                                md-on-page-changed.delegate=\"onPageChanged($event)\"\n                                md-pages.bind=\"numberOfPages\"\n                                md-visible-page-links=\"0\"\n                                md-active-page.bind=\"activePage\"></md-pagination>\n\n              </div>\n\n              <div class=\"center-align hide-on-med-and-down\">\n\n                <md-pagination md-show-first-last.two-way=\"showFirstLastPages\"\n                              md-visible-page-links.two-way=\"visiblePageLinks\"\n                              md-on-page-changed.delegate=\"onPageChanged($event)\"\n                              md-pages.bind=\"numberOfPages\"\n                              md-active-page.bind=\"activePage\"\n                              md-visible-page-links=\"10\"></md-pagination>\n\n              </div>\n\n        </div>\n      </div>\n    </div>\n</section>\n\n</template>"; });
define('text!queue.css', ['module'], function(module) { module.exports = ".center-btn { text-align: center }"; });
define('text!app-colors.html', ['module'], function(module) { module.exports = "<template bindable=\"primaryColor, accentColor\">\n  <style>\n    #nprogress .bar {\n      background: ${accentColor};\n    }\n    #nprogress .peg {\n      box-shadow: 0 0 10px ${accentColor}, 0 0 5px ${accentColor};\n    }\n    #nprogress .spinner-icon {\n      border-top-color: ${accentColor};\n      border-left-color: ${accentColor};\n    }\n  </style>\n</template>\n"; });
define('text!tracks.css', ['module'], function(module) { module.exports = ".pagination > li > a, .pagination > li > span {\n    position: relative;\n    float: none;\n    padding: 0 0;\n    margin-left: -1px;\n    line-height: 1.42857143;\n    color: black;\n    text-decoration: none;\n    background-color: #fff;\n    border: none;\n}"; });
define('text!app.html', ['module'], function(module) { module.exports = "<template>\n\n  <require from=\"materialize-css/css/materialize.css\"></require>\n\n  <require from=\"./loading-indicator\"></require>\n  <require from=\"./nav-bar.html\"></require>\n  <require from=\"./app-colors.html\"></require>\n\n  <md-colors md-primary-color.bind=\"primaryColor\" md-accent-color.bind=\"accentColor\"></md-colors>\n  <app-colors primary-color.bind=\"primaryColor\" accent-color.bind=\"accentColor\"></app-colors>\n  <loading-indicator></loading-indicator>\n\n  <header>\n  <nav-bar router.bind=\"router\"></nav-bar>\n  </header>\n\n  <main>\n    <div>\n      <router-view></router-view>\n    </div>\n  </man>\n</template>\n"; });
define('text!nav-bar.html', ['module'], function(module) { module.exports = "<template bindable=\"router\">\n  <require from=\"materialize-css/css/materialize.css\"></require>\n  \n    <md-navbar md-fixed=\"true\">\n        <a md-sidenav-collapse=\"ref.bind: sideNav;\" class=\"left hide-on-large-only\" style=\"cursor: pointer; padding: 0 10px;\"><i class=\"material-icons\">menu</i></a>\n        <ul class=\"hide-on-med-and-down left\">\n          <li md-waves repeat.for=\"row of router.navigation\" class=\"${row.isActive ? 'active' : ''}\">\n              <a href.bind=\"row.href\">${row.title}</a>\n          </li>\n        </ul>\n    </md-navbar>\n\n    <md-sidenav view-model.ref=\"sideNav\" md-close-on-click=\"true\">\n      <ul>\n        <li md-waves repeat.for=\"row of router.navigation\">\n            <a href.bind=\"row.href\">${row.title}</a>\n        </li>\n      </ul>\n    </md-sidenav>\n\n</template>\n"; });
define('text!queue.html', ['module'], function(module) { module.exports = "<template>\n  <require from=\"materialize-css/css/materialize.css\"></require>\n\n  <section>\n    <div class=\"container\">\n        <div class=\"section\">\n\n          <div id=\"loadPlaylistModal\"  md-modal=\"dismissible: true;\" md-modal.ref=\"loadDialog\">\n            <div class=\"modal-content\">\n              <div class=\"playlist-container\">\n                <div class=\"card-panel teal lighten-2\" repeat.for=\"playlist of playlists\" click.delegate=\"selectPlaylist($event, playlist)\">${playlist.name}</div>\n              </div>\n            </div>\n            <div class=\"modal-footer\">\n              <a click.delegate=\"cancelLoadPlaylist()\" md-button=\"flat: false;\" md-waves=\"color: accent;\" class=\"modal-action modal-close\">Cancel</a>\n            </div>\n          </div>\n\n          <div id=\"savePlaylistModal\"  md-modal=\"dismissible: true;\" md-modal.ref=\"saveDialog\">\n            <div class=\"modal-content\">\n              <input type=\"text\" value.bind=\"playListName\" attach-focus=\"true\" />\n            </div>\n            <div class=\"modal-footer\">\n              <a click.delegate=\"savePlaylist($event, playListName)\" md-button=\"flat: false;\" md-waves=\"color: accent;\" class=\"modal-action modal-close\">Save</a>\n              <a click.delegate=\"cancel()\" md-button=\"flat: false;\" md-waves=\"color: accent;\" style=\"margin-right:5px;\" class=\"modal-action modal-close\">Cancel</a>\n            </div>\n          </div>\n\n          <div class=\"col s12 m4\">\n\n            <div class=\"left hide-on-small-only\">\n\n              <div class=\"button-row\" class=\"left\">\n\n                <a md-waves md-button class=\"primary\" click.delegate=\"play($event)\"><i class=\"center-align partyzone-button material-icons\">play_arrow</i></a>\n                <a md-waves md-button class=\"primary\" click.delegate=\"pause($event)\"><i class=\"center-align partyzone-button material-icons\">pause</i></a>\n                <a md-waves md-button class=\"primary\" click.delegate=\"stop($event)\"><i class=\"center-align partyzone-button material-icons\">stop</i></a>\n                <a md-waves md-button class=\"primary\" click.delegate=\"reset($event)\"><i class=\"center-align partyzone-button material-icons\">clear_all</i></a>\n                <a md-waves md-button href=\"#loadPlaylistModal\"><i class=\"fa fa-upload center-align partyzone-button \" aria-hidden=\"true\"></i></a>\n                <a md-waves md-button href=\"#savePlaylistModal\"><i class=\"fa fa-floppy-o center-align partyzone-button \" aria-hidden=\"true\"></i></a>\n\n              </div>\n            </div>\n\n            <div class=\"left hide-on-med-and-up\">\n\n              <div class=\"fixed-action-btn horizontal\" style=\"display: inline-block; right: 24px; top: 65px;\">\n                    <a md-button=\"floating: true; large: true;\" md-tooltip=\"position: bottom; text: edit;\" md-waves=\"color: light; circle: true;\">\n                      <i class=\"large material-icons\">mode_edit</i>\n                    </a>\n                    <ul>\n                      <li><a click.delegate=\"play($event)\" md-button=\"floating: true;\" md-tooltip=\"position: bottom; text: play;\" md-waves=\"color: light; circle: true;\" class=\"red\"><i class=\"material-icons controller-button\">play_arrow</i></a></li>\n                      <li><a click.delegate=\"pause($event)\" md-button=\"floating: true;\" md-tooltip=\"position: bottom; text: pause;\" md-waves=\"color: light; circle: true;\" class=\"yellow darken-1\"><i class=\"material-icons controller-button\">pause</i></a></li>\n                      <li><a click.delegate=\"stop($event)\" md-button=\"floating: true;\" md-tooltip=\"position: bottom; text: stop;\" md-waves=\"color: light; circle: true;\" class=\"green\"><i class=\"material-icons controller-button\">stop</i></a></li>\n                      <li><a click.delegate=\"reset($event)\" md-button=\"floating: true;\" md-tooltip=\"position: bottom; text: empty que;\" md-waves=\"color: light; circle: true;\" class=\"green\"><i class=\"material-icons controller-button\">clear_all</i></a></li>\n                      <li><a click.delegate=\"loadPlaylist($event)\" md-button=\"floating: true;\" md-tooltip=\"position: bottom; text: load playlist;\" md-waves=\"color: light; circle: true;\" class=\"green\"><i class=\"fa fa-download controller-button\" aria-hidden=\"true\"></i></a></li>\n                      <li><a click.delegate=\"savePlaylist($event)\" md-button=\"floating: true;\" md-tooltip=\"position: bottom; text: save playlist;\" md-waves=\"color: light; circle: true;\" class=\"green\"><i class=\"fa fa-floppy-o controller-button\" aria-hidden=\"true\"></i></a></li>\n                    </ul>\n                  </div>\n\n            </div>\n\n            <br><br><br>\n\n            <md-collection view-model.ref=\"list\">\n                <md-collection-item repeat.for=\"track of queuedTracks\" class=\"avatar ${ selector.isSelected ? 'selected' : '' } ${ selector.mdDisabled ? 'disabled' : '' }\">      \n                  \n                  <img width=\"72\" height=\"72\"  src=\"http://192.168.1.6:5000/album_artwork/${track.album_id}\" alt=\"\" class=\"square\">\n                  <span class=\"title\">${track.title}</span>\n                  <p class=\"description\">Album: ${track.album}<br>Artist ${track.artist}</p>\n                 \n                </md-collection-item>\n            </md-collection>\n\n          </div>\n        </div>\n      </div>\n\n  </section>\n</template>\n"; });
define('text!speakers.html', ['module'], function(module) { module.exports = "<template>\n    <require from=\"materialize-css/css/materialize.css\"></require>\n\n    <section>\n        <div class=\"container\">\n            <ul>\n                <li class=\"speaker\" repeat.for=\"speaker of speakers\">\n                    <md-checkbox md-checked.bind=\"speaker.selected\" change.delegate=\"speakerSelected($event, speaker)\">${speaker.name}</md-checkbox>\n\n                    <md-range class=\"volume_control\" md-value.bind=\"speaker.volume\" md-min=\"0\" \n                            change.delegate=\"volumeChanged($event, speaker)\" md-max=\"100\" md-step=\"1\"></md-range>\n                </li>\n            </ul>\n        </div>\n    </section>\n</template>"; });
define('text!track-edit.html', ['module'], function(module) { module.exports = "<template>\n  <section class=\"au-animate\">\n    <h2>${heading}</h2>\n    <form role=\"form\" submit.delegate=\"submit()\">\n      <div class=\"form-group\">\n        <label for=\"fn\">Title</label>\n        <input type=\"text\" value.bind=\"track.title\" class=\"form-control\" id=\"title\" placeholder=\"title\">\n      </div>\n      <div class=\"form-group\">\n        <label for=\"ln\">Album</label>\n        <input type=\"text\" value.bind=\"track.album\" class=\"form-control\" id=\"album\" placeholder=\"album\">\n      </div>\n      <div class=\"form-group\">\n        <label>Artist</label>\n        <input type=\"text\" value.bind=\"track.artist\" class=\"form-control\" id=\"artist\" placeholder=\"artist\">\n      </div>\n      <button type=\"submit\" class=\"btn btn-default\">Submit</button>\n    </form>\n  </section>\n</template>"; });
define('text!tracks.html', ['module'], function(module) { module.exports = "<template>\n\n  <require from=\"materialize-css/css/materialize.css\"></require>\n\n  <section>\n    <div class=\"container\">\n      <div class=\"section\">\n\n        <div class=\"col s12 m4\">\n\n              <md-input md-label=\"search tracks\" md-value.bind=\"searchText\" change.delegate=\"onSearchText($event)\"></md-input>\n              <br><br>\n\n              <md-collection view-model.ref=\"list\">\n                <md-collection-item repeat.for=\"track of pageTracks\" class=\"partyzone-collection-item avatar ${ selector.isSelected ? 'selected' : '' } ${ selector.mdDisabled ? 'disabled' : '' }\">\n                  \n                  <img src=\"http://192.168.1.6:5000/album_artwork/${track.album_id}\" alt=\"\" class=\"square\">\n                  <span class=\"title\">${track.title}</span>\n                  <p class=\"description\">Album: ${track.album} <br>\n                     Artist: ${track.artist}\n                  </p>\n\n                  <div class=\"fixed-action-btn horizontal\" style=\"position: absolute; display: inline-block; right: 24px; top: 10px;\">\n                    <a md-button=\"floating: true; large: true;\" md-tooltip=\"position: bottom; text: edit;\" md-waves=\"color: light; circle: true;\">\n                      <i class=\"large material-icons\">mode_edit</i>\n                    </a>\n                    <ul>\n                      <li><a click.delegate=\"gotoTrackEdit($event, track)\" md-button=\"floating: true;\" md-tooltip=\"position: bottom; text: edit metadata;\" md-waves=\"color: light; circle: true;\" class=\"red\"><i class=\"material-icons small\">mode_edit</i></a></li>\n                      <li><a click.delegate=\"addToQueue($event, track)\" md-button=\"floating: true;\" md-tooltip=\"position: bottom; text: add to queue;\" md-waves=\"color: light; circle: true;\" class=\"yellow darken-1\"><i class=\"material-icons small\">playlist_add</i></a></li>\n                      <li><a click.delegate=\"playTrack($event, track)\" md-button=\"floating: true;\" md-tooltip=\"position: bottom; text: play;\" md-waves=\"color: light; circle: true;\" class=\"green\"><i class=\"material-icons small\">play_arrow</i></a></li>\n                    </ul>\n                  </div>\n\n                  <div class=\"secondary-content\">\n\n                  <!--\n                                <a href click.delegate=\"gotoTrackEdit($event, track)\"><i class=\"material-icons small\">mode_edit</i></a>\n                                <a href click.delegate=\"addToQueue($event, track)\"><i class=\"material-icons small\">playlist_add</i></a>\n                                <a href click.delegate=\"playTrack($event, track)\"><i class=\"material-icons small\">play_arrow</i></a>\n\n                  -->\n\n                  </div>\n                \n                </md-collection-item>\n              </md-collection>\n\n              <div class=\"center-align hide-on-large-only\">\n                  <md-pagination md-show-first-last.two-way=\"false\"\n                                md-on-page-changed.delegate=\"onPageChanged($event)\"\n                                md-pages.bind=\"numberOfPages\"\n                                md-visible-page-links=\"0\"\n                                md-active-page.bind=\"activePage\"></md-pagination>\n\n              </div>\n\n              <div class=\"center-align hide-on-med-and-down\">\n\n                <md-pagination md-show-first-last.two-way=\"showFirstLastPages\"\n                              md-visible-page-links.two-way=\"visiblePageLinks\"\n                              md-on-page-changed.delegate=\"onPageChanged($event)\"\n                              md-pages.bind=\"numberOfPages\"\n                              md-active-page.bind=\"activePage\"\n                              md-visible-page-links=\"10\"></md-pagination>\n\n              </div>\n\n        </div>\n      </div>\n    </div>\n</section>\n\n</template>"; });
//# sourceMappingURL=app-bundle.js.map