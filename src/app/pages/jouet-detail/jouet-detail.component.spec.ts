import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JouetDetailComponent } from './jouet-detail.component';

describe('JouetDetailComponent', () => {
  let component: JouetDetailComponent;
  let fixture: ComponentFixture<JouetDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JouetDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JouetDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
