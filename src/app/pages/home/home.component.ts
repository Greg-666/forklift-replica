import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChariotService, Stats, MarqueConstructeur } from '../../services/chariot.service';
import { BlogService, Article } from '../../services/blog.service';
import { ArticleCardComponent } from '../article-card/article-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ArticleCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  stats: Stats | null = null;
  marques: MarqueConstructeur[] = [];
  articles: Article[] = [];

  constructor(
    private chariotService: ChariotService,
    private blogService: BlogService
  ) {}

  ngOnInit(): void {
    this.chariotService.getStats().subscribe(stats => {
      this.stats = stats;
    });
    this.chariotService.getMarques().subscribe(marques => {
      this.marques = marques.slice(0, 8);
    });
    this.blogService.getArticles().subscribe(articles => {
      this.articles = articles.slice(0, 6);
    });
  }
}
