import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JouetsComponent } from './jouets.component';

describe('JouetsComponent', () => {
  let component: JouetsComponent;
  let fixture: ComponentFixture<JouetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JouetsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JouetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
