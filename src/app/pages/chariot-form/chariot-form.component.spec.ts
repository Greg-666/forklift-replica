import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChariotFormComponent } from './chariot-form.component';

describe('ChariotFormComponent', () => {
  let component: ChariotFormComponent;
  let fixture: ComponentFixture<ChariotFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChariotFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChariotFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
