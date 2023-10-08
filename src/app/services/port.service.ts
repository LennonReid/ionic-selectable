import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { delay, share } from 'rxjs/operators';
import { Country, Port } from '../types';
import MOCKDATA from '../../assets/mocks/mock-data.json';

@Injectable()
export class PortService {
  private countries: Country[] | any = MOCKDATA;
  private portsObservable: Observable<Port[]>;
  constructor() {
  }
  getCountries(page?: number, size?: number): Country[] {
    let countries = [];

    if (page && size) {
      countries = this.countries.slice((page - 1) * size, ((page - 1) * size) + size);
    } else {
      countries = this.countries;
    }

    return countries;
  }

  getPorts(page?: number, size?: number): Port[] {
    let ports = [];

    this.countries.forEach(country => {
      country.ports.forEach(port => {
        port.country = country;
        ports.push(port);
      });
    });

    if (page && size) {
      ports = ports.slice((page - 1) * size, ((page - 1) * size) + size);
    }

    return ports;
  }

  getPortsAsync(page?: number, size?: number, timeout = 1000): Observable<Port[]> {
    if (this.portsObservable) {
      return this.portsObservable;
    }

    this.portsObservable = new Observable<Port[]>(observer => {
      observer.next(this.getPorts(page, size));
      observer.complete();
    }).pipe(
      delay(timeout),
      share()
    );

    this.portsObservable.subscribe(() => {
      // Remove completed observable.
      this.portsObservable = null;
    });

    return this.portsObservable;
  }

  filterPorts(ports: Port[], text: string): Port[] {
    return ports.filter(port => {
      return port.name.toLowerCase().indexOf(text) !== -1 ||
        port.country.name.toLowerCase().indexOf(text) !== -1;
    });
  }

  getNewPortId(): number {
    return this.getPorts().map(port => port.id).sort((portId1, portId2) => {
      return portId1 > portId2 ? -1 : 1;
    })[0] + 1;
  }

  addPort(port: Port) {
    port.id = this.getNewPortId();
    this.countries.find(country => {
      return country.id === port.country.id;
    }).ports.push(port);
  }

  addPortAsync(port: Port, timeout = 1000): Observable<any> {
    const self = this;

    return new Observable<any>(observer => {
      self.addPort(port);
      observer.next();
      observer.complete();
    }).pipe(delay(timeout));
  }

  deletePort(port: Port) {
    const country = this.countries.find(_country => {
      return _country.id === port.country.id;
    });

    if (country && country.ports) {
      country.ports = country.ports.filter(_port => {
        return _port.id !== port.id;
      });
    }
  }

  deletePortAsync(port: Port, timeout = 1000): Observable<any> {
    const self = this;

    return new Observable<any>(observer => {
      self.deletePort(port);
      observer.next();
      observer.complete();
    }).pipe(delay(timeout));
  }

  isInteger(value: any): boolean {
    return value === parseInt(value, 10);
  }

  formatNumber(value: number, length: number): string {
    let formattedNumber = '';

    for (let i = 0; i < length; i++) {
      formattedNumber += '0';
    }

    return (formattedNumber + value).slice(-length);
  }

  formatTimeZone(offset: number): string {
    if (offset === 0) {
      return 'Z';
    }

    if (!this.isInteger(offset)) {
      return '';
    }

    // Time zones vary from -12:00 to 14:00.
    if (offset < -720 || offset > 840) {
      return '';
    }

    let sign = '+';

    if (offset < 0) {
      offset *= -1;
      sign = '-';
    }

    const minutes = offset % 60,
      hours = (offset - minutes) / 60;

    return sign + this.formatNumber(hours, 2) + ':' + this.formatNumber(minutes, 2);
  }
}
