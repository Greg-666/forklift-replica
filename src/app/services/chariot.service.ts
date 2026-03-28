import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Chariot {
  id: number;
  marque_constructeur_id: number;
  marque_jouet_id?: number;
  type_chariot_id: number;
  thematique_id?: number;
  modele?: string;
  quantite: number;
  notes?: string;
  image_url?: string;
  // Champs joints
  marque_nom?: string;
  marque_pays?: string;
  marque_annee?: number;
  marque_slug?: string;
  marque_description?: string;
  jouet_nom?: string;
  jouet_slug?: string;
  type_nom?: string;
  type_slug?: string;
  type_description?: string;
}

export interface MarqueConstructeur {
  id: number;
  nom: string;
  slug: string;
  pays?: string;
  annee_creation?: number;
  description?: string;
  description_en?: string;
  logo_url?: string;
  total_chariots?: number;
}

export interface MarqueJouet {
  id: number;
  nom: string;
  slug: string;
  pays?: string;
  annee_creation?: number;
  description?: string;
  description_en?: string;
  total_chariots?: number;
}

export interface TypeChariot {
  id: number;
  nom: string;
  slug: string;
  description?: string;
  description_en?: string;
  total?: number;
}

export interface Thematique {
  id: number;
  nom: string;
  slug: string;
}

export interface Stats {
  total_chariots: number;
  total_marques: number;
  total_types: number;
  total_jouets: number;
  top_marques: { nom: string; total: number }[];
  par_type: { nom: string; total: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class ChariotService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /* ── Chariots ─────────────────────────────── */

  getChariots(filters: {
    marque?: number;
    type?: number;
    pays?: string;
    marque_jouet?: number;
    page?: number;
    limit?: number;
  } = {}): Observable<{ data: Chariot[]; total: number; page: number; limit: number }> {
    let params = new HttpParams();
    if (filters.marque)       params = params.set('marque',       filters.marque);
    if (filters.type)         params = params.set('type',         filters.type);
    if (filters.pays)         params = params.set('pays',         filters.pays);
    if (filters.marque_jouet) params = params.set('marque_jouet', filters.marque_jouet);
    if (filters.page)         params = params.set('page',         filters.page);
    if (filters.limit)        params = params.set('limit',        filters.limit);
    return this.http.get<any>(`${this.apiUrl}/chariots`, { params });
  }

  getChariotById(id: number): Observable<Chariot> {
    return this.http.get<Chariot>(`${this.apiUrl}/chariots/${id}`);
  }

  createChariot(data: Partial<Chariot>): Observable<Chariot> {
    return this.http.post<Chariot>(`${this.apiUrl}/chariots`, data);
  }

  updateChariot(id: number, data: Partial<Chariot>): Observable<Chariot> {
    return this.http.put<Chariot>(`${this.apiUrl}/chariots/${id}`, data);
  }

  deleteChariot(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/chariots/${id}`);
  }

  /* ── Marques constructeur ─────────────────── */

  getMarques(): Observable<MarqueConstructeur[]> {
    return this.http.get<MarqueConstructeur[]>(`${this.apiUrl}/marques-constructeur`);
  }

  getMarqueBySlug(slug: string): Observable<{ marque: MarqueConstructeur; chariots: Chariot[] }> {
    return this.http.get<any>(`${this.apiUrl}/marques-constructeur/${slug}`);
  }

  /* ── Marques jouet ────────────────────────── */

  getMarquesJouet(): Observable<MarqueJouet[]> {
    return this.http.get<MarqueJouet[]>(`${this.apiUrl}/marques-jouet`);
  }

  getMarqueJouetBySlug(slug: string): Observable<{ marque: MarqueJouet; chariots: Chariot[] }> {
    return this.http.get<any>(`${this.apiUrl}/marques-jouet/${slug}`);
  }

  /* ── Types ────────────────────────────────── */

  getTypes(): Observable<TypeChariot[]> {
    return this.http.get<TypeChariot[]>(`${this.apiUrl}/types`);
  }

  /* ── Thématiques ──────────────────────────── */

  getThematiques(): Observable<Thematique[]> {
    return this.http.get<Thematique[]>(`${this.apiUrl}/thematiques`);
  }

  /* ── Stats ────────────────────────────────── */

  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.apiUrl}/stats`);
  }
}
