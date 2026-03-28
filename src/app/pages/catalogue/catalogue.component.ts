import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChariotService, Chariot, TypeChariot, MarqueConstructeur } from '../../services/chariot.service';

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [ FormsModule],
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.scss'
})
export class CatalogueComponent implements OnInit {
  chariots: Chariot[] = [];
  types: TypeChariot[] = [];
  marques: MarqueConstructeur[] = [];

  selectedType = '';
  selectedMarque = '';
  selectedPays = '';
  activeFilter = 'tous';

  pays: string[] = [];
  total = 0;
  page = 1;
  limit = 24;

  constructor(private chariotService: ChariotService) {}

  ngOnInit(): void {
    this.chariotService.getTypes().subscribe(types => {
      this.types = types;
    });
    this.chariotService.getMarques().subscribe(marques => {
      this.marques = marques;
      this.pays = [...new Set(marques.map(m => m.pays).filter(p => p))] as string[];
    });
    this.loadChariots();
  }

  loadChariots(): void {
    const filters: any = { page: this.page, limit: this.limit };
    if (this.selectedType)   filters.type   = this.selectedType;
    if (this.selectedMarque) filters.marque = this.selectedMarque;
    if (this.selectedPays)   filters.pays   = this.selectedPays;

    this.chariotService.getChariots(filters).subscribe(res => {
      this.chariots = res.data;
      this.total = res.total;
    });
  }

  selectType(typeId: string): void {
    this.selectedType   = typeId;
    this.selectedMarque = '';
    this.selectedPays   = '';
    this.activeFilter   = 'type';
    this.page = 1;
    this.loadChariots();
  }

  selectMarque(marqueId: string): void {
    this.selectedMarque = marqueId;
    this.selectedType   = '';
    this.selectedPays   = '';
    this.activeFilter   = 'marque';
    this.page = 1;
    this.loadChariots();
  }

  selectPays(pays: string): void {
    this.selectedPays   = pays;
    this.selectedType   = '';
    this.selectedMarque = '';
    this.activeFilter   = 'pays';
    this.page = 1;
    this.loadChariots();
  }

  resetFilters(): void {
    this.selectedType   = '';
    this.selectedMarque = '';
    this.selectedPays   = '';
    this.activeFilter   = 'tous';
    this.page = 1;
    this.loadChariots();
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }

  prevPage(): void {
    if (this.page > 1) { this.page--; this.loadChariots(); }
  }

  nextPage(): void {
    if (this.page < this.totalPages) { this.page++; this.loadChariots(); }
  }
}
