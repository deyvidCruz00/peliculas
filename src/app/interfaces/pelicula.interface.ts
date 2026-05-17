export interface PeliculaBusqueda {
  imdbID: string;
  Title: string;
  Year: string;
  Type: string;
  Poster: string;
}

export interface PeliculaRespuesta {
  Search?: PeliculaBusqueda[];
  totalResults?: string;
  Response: string;
  Error?: string;
}

export interface PeliculaLocal {
  imdbID: string;
  title: string;
  year: string;
  type: string;
  poster: string;
  note: string;
  rating: number;
  savedAt: string;
}
