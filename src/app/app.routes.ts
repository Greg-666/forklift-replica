import { Routes } from '@angular/router';
import { HomeComponent }          from './pages/home/home.component';
import { LoginComponent }         from './pages/login/login.component';
import { AboutComponent }         from './pages/about/about.component';
import { ProfileComponent }       from './pages/profile/profile.component';
import { AdminComponent }         from './pages/admin/admin.component';
import { SearchComponent }        from './pages/search/search.component';
import { CatalogueComponent }     from './pages/catalogue/catalogue.component';
import { ArticleDetailComponent } from './pages/article-detail/article-detail.component';

import { authGuard }              from './guards/auth.guard';
import { adminGuard }             from './guards/admin.guard';
import { moderatorGuard }         from './guards/moderator.guard';

export const routes: Routes = [

  { path: 'login', component: LoginComponent },

  { path: '',           component: HomeComponent,          canActivate: [authGuard] },
  { path: 'about',      component: AboutComponent,         canActivate: [authGuard] },
  { path: 'profile',    component: ProfileComponent,       canActivate: [authGuard] },
  { path: 'search',     component: SearchComponent,        canActivate: [authGuard] },
  { path: 'catalogue',  component: CatalogueComponent,     canActivate: [authGuard] },
  { path: 'article/:id', component: ArticleDetailComponent, canActivate: [authGuard] },

  { path: 'admin',                        component: AdminComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/article/new',            component: AdminComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/article/edit/:id',       component: AdminComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/chariot/new',            component: AdminComponent, canActivate: [authGuard, adminGuard] },
  { path: 'admin/chariot/edit/:id',       component: AdminComponent, canActivate: [authGuard, adminGuard] },

  { path: 'moderator',                    component: AdminComponent, canActivate: [authGuard, moderatorGuard] },
  { path: 'moderator/article/new',        component: AdminComponent, canActivate: [authGuard, moderatorGuard] },
  { path: 'moderator/article/edit/:id',   component: AdminComponent, canActivate: [authGuard, moderatorGuard] },
  { path: 'moderator/chariot/new',        component: AdminComponent, canActivate: [authGuard, moderatorGuard] },
  { path: 'moderator/chariot/edit/:id',   component: AdminComponent, canActivate: [authGuard, moderatorGuard] },

  { path: '**', redirectTo: 'login' },
];
