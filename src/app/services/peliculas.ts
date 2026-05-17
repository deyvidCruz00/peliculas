import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PeliculaBusqueda, PeliculaRespuesta } from '../interfaces/pelicula.interface';

@Injectable({
  providedIn: 'root'
})
export class PeliculasService {
  private readonly apiUrl = 'https://www.omdbapi.com/';
  private readonly apiKey = '965f572d';

  constructor(private http: HttpClient) {}

  async buscarPeliculas(title: string, year: string, type: string): Promise<PeliculaBusqueda[]> {
    const params: Record<string, string> = {
      apikey: this.apiKey,
      s: title.trim()
    };

    if (year.trim()) params['y'] = year.trim();
    if (type.trim()) params['type'] = type.trim();

    try {
      const response = await firstValueFrom(
        this.http.get<PeliculaRespuesta>(this.apiUrl, { params })
      );

      if (response.Response === 'True' && response.Search) {
        return response.Search;
      }
      if (response.Error) {
        // Lanzamos el error de negocio directamente para que no lo atrape como error de red
        return Promise.reject(new Error(response.Error === 'Too many results.' 
          ? 'La búsqueda es muy extensa. Por favor, sé más específico con el título.' 
          : response.Error));
      }
      return [];
    } catch (err: any) {
      // Si el error ya viene rechazado por nuestra validación anterior, lo dejamos pasar
      if (err.message && (err.message.includes('búsqueda es muy extensa') || err.message !== '')) {
        throw err;
      }
      console.error('Error detallado de OMDB API:', err);
      throw new Error('No se pudo contactar con la API.');
    }
  }
}
