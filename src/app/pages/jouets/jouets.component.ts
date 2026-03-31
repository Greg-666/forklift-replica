import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChariotService, MarqueJouet } from '../../services/chariot.service';

@Component({
  selector: 'app-jouets',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './jouets.component.html',
  styleUrl: './jouets.component.scss'
})
export class JouetsComponent implements OnInit {
  marques: MarqueJouet[] = [];
  filteredMarques: MarqueJouet[] = [];
  selectedPays = '';
  pays: string[] = [];

  constructor(private chariotService: ChariotService) {}

  ngOnInit(): void {
    this.chariotService.getMarquesJouet().subscribe(marques => {
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
