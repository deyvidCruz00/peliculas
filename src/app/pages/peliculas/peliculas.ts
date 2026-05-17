import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeliculasService } from '../../services/peliculas';
import { PeliculasLocalService } from '../../services/peliculas-local';
import { PeliculaBusqueda, PeliculaLocal } from '../../interfaces/pelicula.interface';

@Component({
  selector: 'app-peliculas',
  imports: [CommonModule, FormsModule],
  templateUrl: './peliculas.html',
  styleUrl: './peliculas.css'
})
export class Peliculas implements OnInit {
  search = {
    title: '',
    year: '',
    type: ''
  };

  resultados: PeliculaBusqueda[] = [];
  guardadas: PeliculaLocal[] = [];
  isLoading = false;
  error = '';
  editingId: string | null = null;

  constructor(
    private peliculasService: PeliculasService,
    private peliculasLocal: PeliculasLocalService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarGuardadas();
  }

  async buscar(): Promise<void> {
    this.error = '';

    if (!this.search.title.trim()) {
      this.error = 'Ingresa un titulo para buscar.';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();
    try {
      const resultados = await this.peliculasService.buscarPeliculas(
        this.search.title,
        this.search.year,
        this.search.type
      );

      this.resultados = resultados;
      if (this.resultados.length === 0) {
        this.error = 'No se encontraron resultados.';
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Ocurrio un error consultando la API.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async guardar(resultado: PeliculaBusqueda): Promise<void> {
    const nueva: PeliculaLocal = {
      imdbID: resultado.imdbID,
      title: resultado.Title,
      year: resultado.Year,
      type: resultado.Type,
      poster: resultado.Poster,
      note: '',
      rating: 3,
      savedAt: new Date().toISOString()
    };

    await this.peliculasLocal.upsert(nueva);
    await this.cargarGuardadas();
  }

  estaGuardada(imdbID: string): boolean {
    return this.guardadas.some((item) => item.imdbID === imdbID);
  }

  iniciarEdicion(imdbID: string): void {
    this.editingId = imdbID;
  }

  cancelarEdicion(): void {
    this.editingId = null;
  }

  async actualizar(item: PeliculaLocal): Promise<void> {
    await this.peliculasLocal.upsert(item);
    this.editingId = null;
    await this.cargarGuardadas();
  }

  async eliminar(imdbID: string): Promise<void> {
    await this.peliculasLocal.remove(imdbID);
    await this.cargarGuardadas();
  }

  private async cargarGuardadas(): Promise<void> {
    this.guardadas = await this.peliculasLocal.getAll();
    this.guardadas.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  }
}
