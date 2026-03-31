import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChariotService, MarqueConstructeur, Chariot } from '../../services/chariot.service';

@Component({
  selector: 'app-marque-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './marque-detail.component.html',
  styleUrl: './marque-detail.component.scss'
})
export class MarqueDetailComponent implements OnInit {
  marque: MarqueConstructeur | null = null;
  chariots: Chariot[] = [];
  currentLang: 'fr' | 'en' = 'fr';

  constructor(
    private route: ActivatedRoute,
    private chariotService: ChariotService
  ) {}

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    this.chariotService.getMarqueBySlug(slug).subscribe(res => {
      this.marque = res.marque;
      this.chariots = res.chariots;
    });
  }

  get chariotsByType(): { type: string; items: Chariot[] }[] {
    const groups: { [key: string]: Chariot[] } = {};
    this.chariots.forEach(c => {
      const type = c.type_nom || 'Autre';
      if (!groups[type]) groups[type] = [];
      groups[type].push(c);
    });
    return Object.entries(groups).map(([type, items]) => ({ type, items }));
  }
}
