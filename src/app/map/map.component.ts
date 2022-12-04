import { AfterViewInit, Component, Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as Polyline from 'google-polyline';
import * as L from 'leaflet';
import { AntPath } from 'leaflet-ant-path';
import { CourseService } from '../services/course.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
@Injectable()
export class MapComponent implements AfterViewInit {
  public start = new FormControl('');
  public end = new FormControl('');
  public duration = new FormControl('');
  public distance = new FormControl('');
  public steps = new FormControl('');
  private antPolyline: any;
  private userLocalisation: L.CircleMarker | undefined;

  constructor(private courceService: CourseService) {}

  ngAfterViewInit(): void {
    this.initMap();
  }

  private map: L.Map | undefined;

  private initMap(): void {
    this.map = L.map('map', {
      center: [49.43, 1.095],
      zoom: 12,
    });

    const tiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );
    tiles.addTo(this.map);

    this.map.on('click', (evt) => {
      let coords = evt.latlng.lng + ',' + evt.latlng.lat;
      this.start.setValue(this.end.value);
      this.end.setValue(coords);
      if (this.start.value !== '' && this.end.value !== '') this.drawRoute();
    });

    this.map.locate({ watch: true, enableHighAccuracy: true });

    this.map.on('locationfound', (evt) => this.updatePositition(evt));
  }

  public drawRoute(): void {
    if (this.start.value === null || this.end.value === null) throw new Error();

    this.courceService
      .getRoute(this.start.value, this.end.value, 'car')
      .subscribe((data) => {
        if (this.antPolyline !== undefined)
          this.map?.removeLayer(this.antPolyline);
        this.antPolyline = new AntPath(Polyline.decode(data.geometry));
        this.antPolyline.addTo(this.map);
        this.duration.setValue(Number(data.duration).toFixed(2) + ' minutes');
        this.distance.setValue(Number(data.distance).toFixed(2) + ' mètres');
        let steps = document.getElementById('steps');
        if (steps == null) return;
        steps.innerHTML = '';
        for (let portion of data.portions) {
          for (let step of portion.steps) {
            steps.innerHTML +=
              step.instruction.type +
              ' ' +
              step.instruction.modifier +
              ' (' +
              step.attributes.nom_1_droite +
              ')<br/>';
          }
        }
      });
  }

  public updatePositition(e: L.LocationEvent) {
    this.courceService.updatePosition(123, e.latlng.lng + ',' + e.latlng.lat);
    if (this.map === undefined) return;
    if (this.userLocalisation !== undefined) {
      this.map?.removeLayer(this.userLocalisation);
    } else {
      // première fois qu'on trouve la position
      this.map.setView(e.latlng, 13, { animate: true });
      if (this.start.value == '' && this.end.value == '')
        this.end.setValue(e.latlng.lng + ',' + e.latlng.lat);
    }
    this.userLocalisation = L.circleMarker([e.latlng.lat, e.latlng.lng], {
      radius: 5,
      color: '#000',
      weight: 1,
      opacity: 0.5,
      fillColor: '#F00',
      fillOpacity: 1,
    });
    this.userLocalisation.addTo(this.map);
  }
}
