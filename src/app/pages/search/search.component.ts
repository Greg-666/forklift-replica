import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { BlogService, Article } from '../../services/blog.service';
import { ChariotService, Chariot } from '../../services/chariot.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit {
  query = '';
  articles: Article[] = [];
  chariots: Chariot[] = [];

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService,
    private chariotService: ChariotService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.query = params['q'] || '';
      if (this.query) {
        this.searchArticles();
        this.searchChariots();
      }
    });
  }

  searchArticles(): void {
    const q = this.query.toLowerCase();
    this.blogService.getArticles().subscribe(articles => {
      this.articles = articles.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.title_en?.toLowerCase().includes(q)) ||
        a.category.toLowerCase().includes(q) ||
        a.tags?.some(t => t.toLowerCase().includes(q)) ||
        a.author.toLowerCase().includes(q)
      );
    });
  }

  searchChariots(): void {
    const q = this.query.toLowerCase();
    this.chariotService.getChariots({ limit: 500 }).subscribe(res => {
      this.chariots = res.data.filter(c =>
        c.marque_nom?.toLowerCase().includes(q) ||
        c.modele?.toLowerCase().includes(q) ||
        c.type_nom?.toLowerCase().includes(q) ||
        c.jouet_nom?.toLowerCase().includes(q) ||
        c.marque_pays?.toLowerCase().includes(q)
      );
    });
  }

  get totalResults(): number {
    return this.articles.length + this.chariots.length;
  }
}
