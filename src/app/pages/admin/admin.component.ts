import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../services/auth.service';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';

interface Article {
  id: number;
  title: string;
  category: string;
  date: string;
  author: string;
}

interface Chariot {
  id: number;
  modele: string;
  marque_nom: string;
  type_nom: string;
  quantite: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  activeTab = 'chariots';
  users: User[] = [];
  pendingUsers: User[] = [];
  articles: Article[] = [];
  chariots: Chariot[] = [];
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, public authService: AuthService) {}

  ngOnInit(): void {
    this.loadChariots();
    this.loadArticles();
    if (this.authService.isAdmin()) {
      this.loadUsers();
      this.activeTab = 'users';
    }
  }

  loadUsers(): void {
    this.http.get<User[]>(`${this.apiUrl}/users`).subscribe(users => {
      this.users = users.filter(u => u.status === 'approved' && u.role !== 'admin');
      this.pendingUsers = users.filter(u => u.status === 'pending');
    });
  }

  loadArticles(): void {
    this.http.get<Article[]>(`${this.apiUrl}/articles`).subscribe(articles => {
      this.articles = articles;
    });
  }

  loadChariots(): void {
    this.http.get<any>(`${this.apiUrl}/chariots?limit=100`).subscribe(res => {
      this.chariots = res.data;
    });
  }

  approveUser(user: User): void {
    this.http.patch(`${this.apiUrl}/users/${user.id}`, { role: user.role || 'member', status: 'approved' }).subscribe(() => {
      this.loadUsers();
    });
  }

  rejectUser(user: User): void {
    this.http.patch(`${this.apiUrl}/users/${user.id}`, { role: user.role || 'member', status: 'rejected' }).subscribe(() => {
      this.loadUsers();
    });
  }

  promoteToModerator(user: User): void {
    this.http.patch(`${this.apiUrl}/users/${user.id}`, { role: 'moderator', status: 'approved' }).subscribe(() => {
      this.loadUsers();
    });
  }

  demoteToMember(user: User): void {
    this.http.patch(`${this.apiUrl}/users/${user.id}`, { role: 'member', status: 'approved' }).subscribe(() => {
      this.loadUsers();
    });
  }

  deleteUser(user: User): void {
    if (confirm(`Supprimer l'utilisateur ${user.username} ?`)) {
      this.http.delete(`${this.apiUrl}/users/${user.id}`).subscribe(() => {
        this.loadUsers();
      });
    }
  }

  deleteArticle(article: Article): void {
    if (confirm(`Supprimer l'article "${article.title}" ?`)) {
      this.http.delete(`${this.apiUrl}/articles/${article.id}`).subscribe(() => {
        this.loadArticles();
      });
    }
  }

  deleteChariot(chariot: Chariot): void {
    if (confirm(`Supprimer "${chariot.marque_nom} – ${chariot.modele}" ?`)) {
      this.http.delete(`${this.apiUrl}/chariots/${chariot.id}`).subscribe(() => {
        this.loadChariots();
      });
    }
  }
}
