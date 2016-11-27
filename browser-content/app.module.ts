// NG2 internals
import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {RouterModule, Routes} from "@angular/router";
import {FormsModule} from "@angular/forms";
// App internals
import {AppComponent} from "./app/app.component";
import {AboutComponent} from "./about/about.component";
import {SettingsComponent} from "./settings/settings.component";


const appRoutes: Routes = [
	{path: 'about', component: AboutComponent},
	{path: 'settings', component: SettingsComponent},
	{path: '', component: AppComponent},
];

@NgModule({
	imports: [
		BrowserModule,
		FormsModule,
		RouterModule.forRoot(appRoutes),
		NgbModule.forRoot()
	],
	declarations: [
		AppComponent,
		AboutComponent,
		SettingsComponent,
	],
	bootstrap: [AppComponent]
})
export class AppModule {
}
