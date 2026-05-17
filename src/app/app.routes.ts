import { Routes } from '@angular/router';
import { Peliculas } from './pages/peliculas/peliculas';

export const routes: Routes = [
	{ path: '', redirectTo: 'peliculas', pathMatch: 'full' },
	{ path: 'peliculas', component: Peliculas },
	{ path: '**', redirectTo: 'peliculas' }
];
