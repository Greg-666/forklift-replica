import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChariotService, MarqueConstructeur } from '../../services/chariot.service';

@Component({
  selector: 'app-marques',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './marques.component.html',
  styleUrl: './marques.component.scss'
})
export class MarquesComponent implements OnInit {
  marques: MarqueConstructeur[] = [];
  filteredMarques: MarqueConstructeur[] = [];
  selectedPays = '';
  pays: string[] = [];

  constructor(private chariotService: ChariotService) {}

  ngOnInit(): void {
    this.chariotService.getMarques().subscribe(marques => {
      this.marques = marques;
      this.filteredMarques = marques;
      this.pays = [...new Set(marques.map(m => m.pays).filter(p => p))] as string[];
    });
  }

  filterByPays(pays: string): void {
    this.selectedPays = pays;
    this.filteredMarques = pays
      ? this.marques.filter(m => m.pays === pays)
      : this.marques;
  }

  resetFilter(): void {
    this.selectedPays = '';
    this.filteredMarques = this.marques;
  }
}
