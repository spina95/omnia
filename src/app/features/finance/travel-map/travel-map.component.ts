import { Component, OnInit, OnDestroy, inject, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import * as L from 'leaflet';

// Import Leaflet CSS
// import 'leaflet/dist/leaflet.css';

import { VisitedPlacesService } from './visited-places.service';
import { GeocodingService, GeocodingResult } from './geocoding.service';
import {
  VisitedPlace,
  VisitedCountryStats,
  UserTravelStats,
  AddVisitedPlacePayload,
  Country,
} from './visited-place.interface';
import { COUNTRIES } from './countries';

import * as L from 'leaflet';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png',
});

@Component({
  selector: 'app-travel-map',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgApexchartsModule, ChartComponent],
  templateUrl: './travel-map.component.html',
  styleUrls: ['./travel-map.component.css'],
})
export class TravelMapComponent implements OnInit, OnDestroy {
  private visitedPlacesService = inject(VisitedPlacesService);
  private geocodingService = inject(GeocodingService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // State
  visitedPlaces = signal<VisitedPlace[]>([]);
  stats = signal<UserTravelStats | null>(null);
  countryStats = signal<VisitedCountryStats[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Map
  private map!: L.Map;
  private markers: L.Marker[] = [];

  // Add place form
  addPlaceForm: FormGroup;
  countries: Country[] = COUNTRIES;
  isDialogOpen = signal(false);
  selectedPosition: WritableSignal<{ lat: number; lng: number } | null> = signal(null);
  selectedPlace: WritableSignal<VisitedPlace | null> = signal(null);
  isSaving = false;
  isEditMode = signal(false);

  // Chart configuration - matching app styling
  chartConfig: any = {
    series: [],
    chart: {
      type: 'bar',
      height: 350,
      background: 'transparent', // Transparent background
      foreColor: '#e5e7eb',
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded',
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: [],
      labels: {
        style: {
          colors: '#e5e7eb',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Places',
        style: {
          color: '#e5e7eb',
        },
      },
      labels: {
        style: {
          colors: ['#e5e7eb'],
        },
      },
    },
    fill: {
      opacity: 1,
      colors: ['#22c55e'], // App's main green color
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} places`,
      },
      theme: 'dark',
    },
    // Removed title for cleaner look
  };

  private subscriptions: Subscription[] = [];

  constructor() {
    this.addPlaceForm = this.fb.group({
      country_code: ['', Validators.required],
      country_name: ['', Validators.required],
      city: [''],
      visit_date: [''],
      notes: [''],
      lat: ['', Validators.required],
      lng: ['', Validators.required],
    });

    // Auto-fill country name when country code changes
    this.addPlaceForm.get('country_code')?.valueChanges.subscribe((code) => {
      const country = this.countries.find((c) => c.code === code);
      if (country) {
        this.addPlaceForm.get('country_name')?.setValue(country.name);
        // Geocode the country to get coordinates
        this.geocodeCountry(code);
      }
    });

    // Geocode when city changes
    this.addPlaceForm.get('city')?.valueChanges.subscribe((city) => {
      const countryCode = this.addPlaceForm.get('country_code')?.value;
      if (countryCode) {
        this.geocodeCity(city, countryCode);
      }
    });
  }

  ngOnInit(): void {
    // Initialize selectedPosition to null to ensure dialog is closed on load
    this.selectedPosition.set(null);
    this.initMap();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    if (this.map) {
      this.map.remove();
    }
  }

  private loadInitialData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const sub = this.visitedPlacesService.getVisitedPlacesForCurrentUser().subscribe({
      next: (places) => {
        this.visitedPlaces.set(places);
        this.addMarkersToMap(places);
        this.loadStats();
      },
      error: (err) => {
        console.error('Error loading visited places:', err);
        this.error.set('Failed to load visited places. Please try again.');
        this.isLoading.set(false);
      },
    });

    this.subscriptions.push(sub);
  }

  private loadStats(): void {
    const statsSub = this.visitedPlacesService.getStatsForCurrentUser().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        this.error.set('Failed to load statistics.');
        this.isLoading.set(false);
      },
    });

    const countryStatsSub = this.visitedPlacesService.getCountryStatsForCurrentUser().subscribe({
      next: (countryStats) => {
        this.countryStats.set(countryStats);
        this.updateChart(countryStats);
      },
      error: (err) => {
        console.error('Error loading country stats:', err);
      },
    });

    this.subscriptions.push(statsSub, countryStatsSub);
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      scrollWheelZoom: false, // Disable scroll wheel zoom to prevent conflicts with page scrolling
      touchZoom: false, // Disable touch zoom on mobile
      doubleClickZoom: false, // Disable double click zoom
      boxZoom: false, // Disable box zoom
      dragging: true, // Keep dragging enabled
      worldCopyJump: true, // Allow panning across world copies
      preferCanvas: false, // Use SVG instead of Canvas for better compatibility
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      tileSize: 256,
      zoomOffset: 0,
      updateWhenZooming: true,
      updateWhenIdle: true,
    }).addTo(this.map);

    // Add click handler to add new places
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      // Only open dialog if not already open
      if (this.selectedPosition() === null) {
        this.openAddPlaceDialog(e.latlng.lat, e.latlng.lng);
      }
    });

    // Add a way to enable zoom when user clicks on the map
    this.map.on('click', () => {
      // Briefly enable zoom for better UX, then disable it again after a short delay
      this.map.scrollWheelZoom.enable();
      setTimeout(() => {
        this.map.scrollWheelZoom.disable();
      }, 3000);
    });

    // Fix for tile positioning issues - ensure map size is correct
    setTimeout(() => {
      this.map.invalidateSize(true);
    }, 100);

    // Add resize observer to handle container size changes
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      const mapElement = document.getElementById('map');
      if (mapElement) {
        const resizeObserver = new ResizeObserver(() => {
          setTimeout(() => {
            this.map.invalidateSize(true);
          }, 100);
        });
        resizeObserver.observe(mapElement);
      }
    }
  }

  private addMarkersToMap(places: VisitedPlace[]): void {
    // Remove existing markers
    this.markers.forEach((marker) => this.map.removeLayer(marker));
    this.markers = [];

    places.forEach((place) => {
      const marker = L.marker([place.lat, place.lng]).addTo(this.map);
      const popupContent = `
        <div>
          <div class="font-semibold">${place.country_name}</div>
          ${place.city ? `<div class="text-sm text-gray-300">${place.city}</div>` : ''}
          ${
            place.visit_date
              ? `<div class="text-sm text-gray-400">${new Date(
                  place.visit_date
                ).toLocaleDateString()}</div>`
              : ''
          }
          ${place.notes ? `<div class="text-sm text-gray-300 mt-1">${place.notes}</div>` : ''}
          <div class="mt-2 pt-2 border-t border-gray-600">
            <button class="edit-btn" data-place-id="${place.id}">Edit</button>
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);

      // Add click handler to open edit dialog
      marker.on('click', () => {
        this.openEditPlaceDialog(place);
      });

      this.markers.push(marker);
    });
  }

  private openAddPlaceDialog(lat: number, lng: number): void {
    this.selectedPosition.set({ lat, lng });
    this.selectedPlace.set(null);
    this.isEditMode.set(false);
    this.addPlaceForm.reset({
      lat,
      lng,
    });

    // Open dialog - this will be handled by the template
  }

  private openEditPlaceDialog(place: VisitedPlace): void {
    this.selectedPlace.set(place);
    this.selectedPosition.set({ lat: place.lat, lng: place.lng });
    this.isEditMode.set(true);

    this.addPlaceForm.patchValue({
      country_code: place.country_code,
      country_name: place.country_name,
      city: place.city || '',
      visit_date: place.visit_date || '',
      notes: place.notes || '',
      lat: place.lat,
      lng: place.lng,
    });

    // Open dialog - this will be handled by the template
  }

  onSubmitEditPlace(): void {
    if (this.addPlaceForm.invalid || !this.selectedPlace()) {
      return;
    }

    const place = this.selectedPlace()!;
    const payload: AddVisitedPlacePayload = {
      country_code: this.addPlaceForm.get('country_code')?.value,
      country_name: this.addPlaceForm.get('country_name')?.value,
      city: this.addPlaceForm.get('city')?.value || undefined,
      lat: this.addPlaceForm.get('lat')?.value,
      lng: this.addPlaceForm.get('lng')?.value,
      visit_date: this.addPlaceForm.get('visit_date')?.value || undefined,
      notes: this.addPlaceForm.get('notes')?.value || undefined,
    };

    this.visitedPlacesService.updateVisitedPlace(place.id, payload).subscribe({
      next: (updatedPlace) => {
        // Update in signal
        this.visitedPlaces.update((places) =>
          places.map((p) => (p.id === place.id ? updatedPlace : p))
        );

        // Update marker
        this.updateMarker(updatedPlace);

        // Reload stats
        this.loadStats();

        // Close dialog
        this.selectedPosition.set(null);
        this.selectedPlace.set(null);
        this.addPlaceForm.reset();
      },
      error: (err) => {
        console.error('Error updating visited place:', err);
        this.error.set('Failed to update visited place. Please try again.');
      },
    });
  }

  onDeletePlace(): void {
    const place = this.selectedPlace();
    if (!place) {
      return;
    }

    if (confirm('Are you sure you want to delete this visited place?')) {
      this.visitedPlacesService.deleteVisitedPlace(place.id).subscribe({
        next: () => {
          // Remove from signal
          this.visitedPlaces.update((places) => places.filter((p) => p.id !== place.id));

          // Remove marker
          this.removeMarker(place.lat, place.lng);

          // Reload stats
          this.loadStats();

          // Close dialog
          this.selectedPosition.set(null);
          this.selectedPlace.set(null);
          this.addPlaceForm.reset();
        },
        error: (err) => {
          console.error('Error deleting visited place:', err);
          this.error.set('Failed to delete visited place. Please try again.');
        },
      });
    }
  }

  private updateMarker(updatedPlace: VisitedPlace): void {
    // Find and update the marker
    this.markers.forEach((marker) => {
      const latlng = marker.getLatLng();
      if (latlng.lat === updatedPlace.lat && latlng.lng === updatedPlace.lng) {
        const popupContent = `
          <div>
            <div class="font-semibold">${updatedPlace.country_name}</div>
            ${
              updatedPlace.city
                ? `<div class="text-sm text-gray-300">${updatedPlace.city}</div>`
                : ''
            }
            ${
              updatedPlace.visit_date
                ? `<div class="text-sm text-gray-400">${new Date(
                    updatedPlace.visit_date
                  ).toLocaleDateString()}</div>`
                : ''
            }
            ${
              updatedPlace.notes
                ? `<div class="text-sm text-gray-300 mt-1">${updatedPlace.notes}</div>`
                : ''
            }
          </div>
        `;
        marker.bindPopup(popupContent);
      }
    });
  }

  private removeMarker(lat: number, lng: number): void {
    // Find and remove the marker
    const index = this.markers.findIndex((marker) => {
      const latlng = marker.getLatLng();
      return latlng.lat === lat && latlng.lng === lng;
    });

    if (index !== -1) {
      const marker = this.markers.splice(index, 1)[0];
      this.map.removeLayer(marker);
    }
  }

  onSubmitAddPlace(): void {
    if (this.addPlaceForm.invalid) {
      return;
    }

    const payload: AddVisitedPlacePayload = {
      country_code: this.addPlaceForm.get('country_code')?.value,
      country_name: this.addPlaceForm.get('country_name')?.value,
      city: this.addPlaceForm.get('city')?.value || undefined,
      lat: this.addPlaceForm.get('lat')?.value,
      lng: this.addPlaceForm.get('lng')?.value,
      visit_date: this.addPlaceForm.get('visit_date')?.value || undefined,
      notes: this.addPlaceForm.get('notes')?.value || undefined,
    };

    this.visitedPlacesService.addVisitedPlace(payload).subscribe({
      next: (newPlace) => {
        // Add to signal
        this.visitedPlaces.update((places) => [newPlace, ...places]);

        // Add marker to map
        const marker = L.marker([newPlace.lat, newPlace.lng]).addTo(this.map);
        const popupContent = `
          <div>
            <div class="font-semibold">${newPlace.country_name}</div>
            ${newPlace.city ? `<div class="text-sm text-gray-300">${newPlace.city}</div>` : ''}
            ${
              newPlace.visit_date
                ? `<div class="text-sm text-gray-400">${new Date(
                    newPlace.visit_date
                  ).toLocaleDateString()}</div>`
                : ''
            }
            ${
              newPlace.notes
                ? `<div class="text-sm text-gray-300 mt-1">${newPlace.notes}</div>`
                : ''
            }
          </div>
        `;
        marker.bindPopup(popupContent);
        this.markers.push(marker);

        // Reload stats
        this.loadStats();

        // Close dialog
        this.selectedPosition.set(null);
        this.addPlaceForm.reset();
      },
      error: (err) => {
        console.error('Error adding visited place:', err);
        this.error.set('Failed to add visited place. Please try again.');
      },
    });
  }

  private updateChart(countryStats: VisitedCountryStats[]): void {
    this.chartConfig.series = [
      {
        name: 'Places',
        data: countryStats.map((stat) => stat.places_count),
      },
    ];
    this.chartConfig.xaxis.categories = countryStats.map((stat) => stat.country_name);
  }

  private geocodeCountry(countryCode: string): void {
    if (!countryCode) {
      return;
    }

    this.geocodingService.geocodeCountry(countryCode).subscribe({
      next: (result) => {
        if (result) {
          this.addPlaceForm.get('lat')?.setValue(result.lat);
          this.addPlaceForm.get('lng')?.setValue(result.lon);
        }
      },
      error: (err) => {
        console.error('Geocoding error:', err);
        // Keep the coordinates from the map click if geocoding fails
      },
    });
  }

  private geocodeCity(city: string, countryCode: string): void {
    if (!countryCode) {
      return;
    }

    this.geocodingService.geocodeCity(city, countryCode).subscribe({
      next: (result) => {
        if (result) {
          this.addPlaceForm.get('lat')?.setValue(result.lat);
          this.addPlaceForm.get('lng')?.setValue(result.lon);
        } else if (!city || city.trim() === '') {
          // If no city is provided, geocode the country instead
          this.geocodeCountry(countryCode);
        }
      },
      error: (err) => {
        console.error('Geocoding error:', err);
        // Keep the coordinates from the map click if geocoding fails
      },
    });
  }

  protected readonly Math = Math;
}
