import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChariotService, MarqueJouet, Chariot } from '../../services/chariot.service';

@Component({
  selector: 'app-jouet-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './jouet-detail.component.html',
  styleUrl: './jouet-detail.component.scss'
})
export class JouetDetailComponent implements OnInit {
  marque: MarqueJouet | null = null;
  chariots: Chariot[] = [];

  constructor(
    private route: ActivatedRoute,
    private chariotService: ChariotService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    this.chariotService.getMarqueJouetBySlug(slug).subscribe(res => {
      this.marque = res.marque;
      this.chariots = res.chariots;
    });
  }

  get chariotsByMarque(): { marque: string; items: Chariot[] }[] {
    const groups: { [key: string]: Chariot[] } = {};
    this.chariots.forEach(c => {
      const marque = c.marque_nom || 'Autre';
      if (!groups[marque]) groups[marque] = [];
      groups[marque].push(c);
    });
    return Object.entries(groups).map(([marque, items]) => ({ marque, items }));
  }
}
