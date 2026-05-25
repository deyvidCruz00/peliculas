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
  private readonly titleMinLength = 2;
  private readonly titleMaxLength = 80;
  private readonly noteMaxLength = 200;
  private readonly allowedTypes = new Set(['', 'movie', 'series', 'episode']);

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

    const originalType = this.search.type;
    const cleanedTitle = this.sanitizeTitle(this.search.title);
    const cleanedYear = this.sanitizeYear(this.search.year);
    const cleanedType = this.sanitizeType(this.search.type);

    this.search.title = cleanedTitle;
    this.search.year = cleanedYear;
    this.search.type = cleanedType;

    if (!cleanedTitle || cleanedTitle.length < this.titleMinLength) {
      this.error = 'Ingresa un titulo para buscar.';
      this.cdr.detectChanges();
      return;
    }

    if (cleanedTitle.length > this.titleMaxLength) {
      this.error = `El titulo no puede superar ${this.titleMaxLength} caracteres.`;
      this.cdr.detectChanges();
      return;
    }

    if (cleanedYear && !this.isValidYear(cleanedYear)) {
      this.error = 'El ano debe tener 4 digitos.';
      this.cdr.detectChanges();
      return;
    }

    if (originalType.trim() && !this.allowedTypes.has(cleanedType)) {
      this.error = 'Selecciona un tipo valido.';
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
    const updated: PeliculaLocal = {
      ...item,
      note: this.sanitizeNote(item.note),
      rating: this.clampRating(item.rating)
    };
    await this.peliculasLocal.upsert(updated);
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

  private sanitizeTitle(value: string): string {
    return value
      .replace(/[^a-zA-Z0-9\s:'\-&,\.]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private sanitizeYear(value: string): string {
    return value.replace(/\D/g, '').slice(0, 4);
  }

  private isValidYear(value: string): boolean {
    return /^\d{4}$/.test(value);
  }

  private sanitizeType(value: string): string {
    const cleaned = value.trim().toLowerCase();
    return this.allowedTypes.has(cleaned) ? cleaned : '';
  }

  private sanitizeNote(value: string): string {
    return value
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, this.noteMaxLength);
  }

  private clampRating(value: number): number {
    if (Number.isNaN(value)) return 3;
    return Math.min(5, Math.max(1, Math.round(value)));
  }
}
