import {bootstrap} from '@angular/platform-browser-dynamic';
import {Component, Pipe, PipeTransform} from '@angular/core';
import {NgFor} from '@angular/common';

@Component({
	selector: 'app',
	pipes: [],
	template: `<h1>NG2 App</h1>`
})

export class App {

	constructor() {}

}

bootstrap(App);
