import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ChariotService, MarqueConstructeur, MarqueJouet, TypeChariot, Thematique } from '../../services/chariot.service';

interface Chariot {
  id?: number;
  marque_constructeur_id: number | null;
  marque_jouet_id: number | null;
  type_chariot_id: number | null;
  thematique_id: number | null;
  modele: string;
  quantite: number;
  notes: string;
  image_url: string;
}

@Component({
  selector: 'app-chariot-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './chariot-form.component.html',
  styleUrl: './chariot-form.component.scss'
})
export class ChariotFormComponent implements OnInit {
  isEditMode = false;
  chariotId: number | null = null;
  private apiUrl = environment.apiUrl;

  chariot: Chariot = {
    marque_constructeur_id: null,
    marque_jouet_id: null,
    type_chariot_id: null,
    thematique_id: null,
    modele: '',
    quantite: 1,
    notes: '',
    image_url: ''
  };

  marques: MarqueConstructeur[] = [];
  marquesJouet: MarqueJouet[] = [];
  types: TypeChariot[] = [];
  thematiques: Thematique[] = [];

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private chariotService: ChariotService
  ) {}

  ngOnInit(): void {
    this.chariotService.getMarques().subscribe(m => this.marques = m);
    this.chariotService.getMarquesJouet().subscribe(m => this.marquesJouet = m);
    this.chariotService.getTypes().subscribe(t => this.types = t);
    this.chariotService.getThematiques().subscribe(t => this.thematiques = t);

    this.chariotId = Number(this.route.snapshot.paramMap.get('id')) || null;
    if (this.chariotId) {
      this.isEditMode = true;
      this.http.get<Chariot>(`${this.apiUrl}/chariots/${this.chariotId}`).subscribe(chariot => {
        this.chariot = chariot;
      });
    }
  }

  onSubmit(): void {
    if (!this.chariot.marque_constructeur_id || !this.chariot.type_chariot_id) {
      alert('La marque constructeur et le type sont obligatoires !');
      return;
    }

    if (this.chariot.quantite < 1) {
      alert('La quantité doit être au moins 1 !');
      return;
    }

    if (this.isEditMode) {
      this.http.put(`${this.apiUrl}/chariots/${this.chariotId}`, this.chariot).subscribe(() => {
        this.router.navigate(['/admin']);
      });
    } else {
      this.http.post(`${this.apiUrl}/chariots`, this.chariot).subscribe(() => {
        this.router.navigate(['/admin']);
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin']);
  }
}
