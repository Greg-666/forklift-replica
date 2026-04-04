import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';
import { environment } from '../../environments/environment';
import { AuthService } from '../../services/auth.service';

interface Article {
  id?: number;
  title: string;
  title_en: string;
  category: string;
  date: string;
  author: string;
  summary: string;
  summary_en: string;
  content: string;
  content_en: string;
  image: string;
  tags: string[];
  photos: string[];
  video_url: string;
}

@Component({
  selector: 'app-article-form',
  standalone: true,
  imports: [FormsModule, SafeUrlPipe],
  templateUrl: './article-form.component.html',
  styleUrl: './article-form.component.scss'
})
export class ArticleFormComponent implements OnInit {
  isEditMode = false;
  articleId: number | null = null;
  tagInput = '';
  photoInput = '';
  private apiUrl = environment.apiUrl;

  article: Article = {
    title: '',
    title_en: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    author: '',
    summary: '',
    summary_en: '',
    content: '',
    content_en: '',
    image: '',
    tags: [],
    photos: [],
    video_url: ''
  };

  categories = [
    'Actualités',
    'Collection',
    'Histoire',
    'Marques',
    'Miniatures',
    'Événements',
    'Guides',
    'Autre'
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) this.article.author = user.username;

    this.articleId = Number(this.route.snapshot.paramMap.get('id')) || null;
    if (this.articleId) {
      this.isEditMode = true;
      this.http.get<Article>(`${this.apiUrl}/articles/${this.articleId}`).subscribe(article => {
        this.article = article;
        this.tagInput = article.tags ? article.tags.join(', ') : '';
        this.photoInput = article.photos ? article.photos.join('\n') : '';
      });
    }
  }

  addTag(): void {
    this.article.tags = this.tagInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }

  addPhotos(): void {
    this.article.photos = this.photoInput
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  getYoutubeEmbedUrl(url: string): string {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  }

  onSubmit(): void {
    this.addTag();
    this.addPhotos();

    if (this.article.video_url) {
      this.article.video_url = this.getYoutubeEmbedUrl(this.article.video_url);
    }

    if (!this.article.title || !this.article.category || !this.article.content) {
      alert('Titre, catégorie et contenu sont obligatoires !');
      return;
    }

    const route = this.authService.isAdmin() ? '/admin' : '/moderator';

    if (this.isEditMode) {
      this.http.put(`${this.apiUrl}/articles/${this.articleId}`, this.article).subscribe(() => {
        this.router.navigate([route]);
      });
    } else {
      this.article.date = new Date().toISOString().split('T')[0];
      this.http.post(`${this.apiUrl}/articles`, this.article).subscribe(() => {
        this.router.navigate([route]);
      });
    }
  }

  cancel(): void {
    const route = this.authService.isAdmin() ? '/admin' : '/moderator';
    this.router.navigate([route]);
  }
}
