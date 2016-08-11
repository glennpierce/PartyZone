import { bindingMode } from 'aurelia-binding';
import { bindable } from 'aurelia-templating';
import {LogManager, View, inject, computedFrom} from 'aurelia-framework';

let logger = LogManager.getLogger('pager');

@inject(Element)
export class Pager {
  @bindable({defaultBindingMode: bindingMode.twoWay})
  currentPage : number = 0;
  @bindable items;
  @bindable pageSize : number = 10;

  goToPage(page) {
    if (page > 0) {
      this.currentPage = page;
    }
  }

  @computedFrom('currentPage')
  get selectedItems() {
      let start : number = this.pageSize * this.currentPage;
      let end = start + +this.pageSize;
      end = Math.min(this.items.length - this.pageSize, end);
      return this.items.slice(start, end);
  }
}