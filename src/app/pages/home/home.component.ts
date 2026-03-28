import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChariotService, Stats, MarqueConstructeur } from '../../services/chariot.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  stats: Stats | null = null;
  marques: MarqueConstructeur[] = [];

  constructor(private chariotService: ChariotService) {}

  ngOnInit(): void {
    this.chariotService.getStats().subscribe(stats => {
      this.stats = stats;
    });
    this.chariotService.getMarques().subscribe(marques => {
      this.marques = marques.slice(0, 8);
    });
  }
}
