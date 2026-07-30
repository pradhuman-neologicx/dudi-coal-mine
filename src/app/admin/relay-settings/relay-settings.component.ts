import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

@Component({
  selector: 'app-relay-settings',
  templateUrl: './relay-settings.component.html',
  styleUrls: ['./relay-settings.component.scss']
})
export class RelaySettingsComponent implements OnInit {
  relayForm!: FormGroup;
  
  // These shifts would typically come from an API master table in a real scenario
  availableShifts = ['Shift A', 'Shift B', 'Shift C', 'General Shift'];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.relayForm = this.fb.group({
      baseDate: ['', Validators.required], // Rotation Start Date
      relays: this.fb.array([
        // Pre-fill with some dummy data for demonstration
        this.createRelayGroup('Relay 1', ['Shift A', 'Shift C', 'Shift B']),
        this.createRelayGroup('Relay 2', ['Shift B', 'Shift A', 'Shift C'])
      ])
    });
  }

  // Getter for easy access to the form array in HTML
  get relays(): FormArray {
    return this.relayForm.get('relays') as FormArray;
  }

  // Creates a FormGroup for a single Relay
  createRelayGroup(name: string = '', sequence: string[] = ['Shift A']): FormGroup {
    return this.fb.group({
      relayName: [name, Validators.required],
      // Create a FormArray for the sequence of shifts
      sequence: this.fb.array(sequence.map(shift => this.fb.control(shift, Validators.required)))
    });
  }

  // Getter for the sequence FormArray of a specific Relay
  getSequence(relayIndex: number): FormArray {
    return this.relays.at(relayIndex).get('sequence') as FormArray;
  }

  // Adds a new blank Relay
  addRelay() {
    this.relays.push(this.createRelayGroup(`Relay ${this.relays.length + 1}`));
  }

  // Removes a Relay
  removeRelay(index: number) {
    this.relays.removeAt(index);
  }

  // Adds a new shift step to a specific Relay's sequence
  addStep(relayIndex: number) {
    this.getSequence(relayIndex).push(this.fb.control('Shift A', Validators.required));
  }

  // Removes a specific step from a Relay's sequence
  removeStep(relayIndex: number, stepIndex: number) {
    this.getSequence(relayIndex).removeAt(stepIndex);
  }

  // Submit Handler
  saveSettings() {
    if (this.relayForm.valid) {
      console.log('Saved Configuration:', this.relayForm.value);
      alert('Master Configuration Saved Successfully! Check console for JSON payload.');
      
      // TODO: Call backend API to save this JSON
      // this.apiService.saveRelayConfig(this.relayForm.value).subscribe(...)
      
    } else {
      // Trigger validation messages if form is invalid
      this.relayForm.markAllAsTouched();
      alert('Please fill all required fields (Date and Relay Names).');
    }
  }
}
