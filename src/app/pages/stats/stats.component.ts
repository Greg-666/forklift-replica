import { Component, OnInit } from '@angular/core';
import { ChariotService, Stats } from '../../services/chariot.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class StatsComponent implements OnInit {
  stats: Stats | null = null;

  constructor(private chariotService: ChariotService) {}

  ngOnInit(): void {
    this.chariotService.getStats().subscribe(stats => {
      this.stats = stats;
    });
  }

  getBarWidth(value: number, max: number): number {
    return max > 0 ? Math.round((value / max) * 100) : 0;
  }

  get maxMarque(): number {
    if (!this.stats) return 1;
    return Math.max(...this.stats.top_marques.map(m => m.total));
  }

  get maxType(): number {
    if (!this.stats) return 1;
    return Math.max(...this.stats.par_type.map(t => t.total));
  }
}
