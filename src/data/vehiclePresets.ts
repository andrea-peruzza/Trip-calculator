import { VehiclePreset } from '../types';

export const VEHICLE_PRESETS: VehiclePreset[] = [
  // Auto a Benzina
  {
    id: 'car-petrol-small',
    name: 'Utilitaria Benzina (es. Panda, Yaris, Clio)',
    type: 'car',
    fuelType: 'petrol',
    defaultConsumption: 5.6, // l/100km (~17.8 km/l)
    unit: 'l/100km',
    description: 'Consumo misto reale per cilindrata 1.0 - 1.2L'
  },
  {
    id: 'car-petrol-medium',
    name: 'Berlina / Crossover Benzina (es. Golf, Puma, T-Roc)',
    type: 'car',
    fuelType: 'petrol',
    defaultConsumption: 6.8, // l/100km (~14.7 km/l)
    unit: 'l/100km',
    description: 'Consumo per motori turbo 1.0 - 1.5 TSI/EcoBoost'
  },
  
  // Auto Diesel
  {
    id: 'car-diesel-compact',
    name: 'Compatta Diesel (es. Golf TDI, Focus TDCi, 208 HDi)',
    type: 'car',
    fuelType: 'diesel',
    defaultConsumption: 4.8, // l/100km (~20.8 km/l)
    unit: 'l/100km',
    description: 'Ottima efficienza in autostrada'
  },
  {
    id: 'car-diesel-suv',
    name: 'SUV / Station Wagon Diesel (es. Tiguan, Qashqai, 3008)',
    type: 'car',
    fuelType: 'diesel',
    defaultConsumption: 6.2, // l/100km (~16.1 km/l)
    unit: 'l/100km',
    description: 'Consumo autostradale per vetture più pesanti'
  },

  // Auto GPL / Bifuel
  {
    id: 'car-lpg-small',
    name: 'Auto GPL Compatta (es. Dacia Sandero, Clio GPL, Panda Eco)',
    type: 'car',
    fuelType: 'lpg',
    defaultConsumption: 7.5, // l/100km (in GPL il consumo in litri è +20% rispetto a benzina)
    unit: 'l/100km',
    description: 'Consumo effettivo GPL (resa economica elevata)'
  },

  // Auto Elettriche
  {
    id: 'car-electric-city',
    name: 'Elettrica Compatta (es. 500e, Zoe, Peugeot e-208)',
    type: 'car',
    fuelType: 'electric',
    defaultConsumption: 15.5, // kWh/100km
    unit: 'kWh/100km',
    description: 'Consumo medio reale urbano ed extraurbano'
  },
  {
    id: 'car-electric-longrange',
    name: 'Elettrica Autostrada (es. Tesla Model 3 / Y, ID.4, EV6)',
    type: 'car',
    fuelType: 'electric',
    defaultConsumption: 18.5, // kWh/100km
    unit: 'kWh/100km',
    description: 'Consumo reale a velocità di crociera autostradale'
  },

  // Moto e Scooter
  {
    id: 'moto-scooter-125',
    name: 'Scooter 125cc / 150cc (es. SH 125, Liberty)',
    type: 'motorcycle',
    fuelType: 'petrol',
    defaultConsumption: 2.4, // l/100km (~41.6 km/l)
    unit: 'l/100km',
    description: 'Consumi minimi per spostamenti urbani'
  },
  {
    id: 'moto-scooter-maxi',
    name: 'Maxi Scooter 300-500cc (es. SH 350, Beverly, T-Max)',
    type: 'motorcycle',
    fuelType: 'petrol',
    defaultConsumption: 3.8, // l/100km (~26.3 km/l)
    unit: 'l/100km',
    description: 'Consumo per tangenziali e percorsi extraurbani'
  },
  {
    id: 'moto-naked-medium',
    name: 'Moto Media 650-800cc (es. MT-07, Hornet, Z650, Monster)',
    type: 'motorcycle',
    fuelType: 'petrol',
    defaultConsumption: 4.6, // l/100km (~21.7 km/l)
    unit: 'l/100km',
    description: 'Consumo tipico misto e gite del weekend'
  },
  {
    id: 'moto-tourer-maxi',
    name: 'Maxi Enduro / Tourer 1000-1300cc (es. BMW GS 1250/1300, Africa Twin, Multistrada)',
    type: 'motorcycle',
    fuelType: 'petrol',
    defaultConsumption: 5.5, // l/100km (~18.2 km/l)
    unit: 'l/100km',
    description: 'Consumo con valigie e velocità autostradale'
  }
];
