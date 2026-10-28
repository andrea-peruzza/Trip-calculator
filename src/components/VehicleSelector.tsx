import React from 'react';
import { ConsumptionUnit, FuelPrices, FuelType, VehiclePreset, VehicleType } from '../types';
import { VEHICLE_PRESETS } from '../data/vehiclePresets';
import { Car, Bike, Truck, Settings2, Percent } from 'lucide-react';
import { convertToKmPerL } from '../services/fuelService';

interface VehicleSelectorProps {
  vehicleType: VehicleType;
  onVehicleTypeChange: (type: VehicleType) => void;
  selectedPresetId: string;
  onPresetChange: (preset: VehiclePreset | null) => void;
  fuelType: FuelType;
  onFuelTypeChange: (fuel: FuelType) => void;
  consumption: number;
  onConsumptionChange: (val: number) => void;
  consumptionUnit: ConsumptionUnit;
  onConsumptionUnitChange: (unit: ConsumptionUnit) => void;
  fuelPrice: number;
  onFuelPriceChange: (price: number) => void;
  fuelPrices: FuelPrices;
  hasMotoDiscount: boolean;
  onMotoDiscountToggle: () => void;
  bifuelRatio: number; // 0 to 100 (% GPL/Metano vs Benzina)
  onBifuelRatioChange: (val: number) => void;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  vehicleType,
  onVehicleTypeChange,
  selectedPresetId,
  onPresetChange,
  fuelType,
  onFuelTypeChange,
  consumption,
  onConsumptionChange,
  consumptionUnit,
  onConsumptionUnitChange,
  fuelPrice,
  onFuelPriceChange,
  fuelPrices,
  hasMotoDiscount,
  onMotoDiscountToggle,
  bifuelRatio,
  onBifuelRatioChange,
}) => {
  const filteredPresets = VEHICLE_PRESETS.filter(p => p.type === vehicleType);

  const handlePresetSelect = (id: string) => {
    if (id === 'custom') {
      onPresetChange(null);
      return;
    }
    const preset = VEHICLE_PRESETS.find(p => p.id === id);
    if (preset) {
      onPresetChange(preset);
      onFuelTypeChange(preset.fuelType);
      onConsumptionChange(preset.defaultConsumption);
      onConsumptionUnitChange(preset.unit);

      // Aggiorna anche il prezzo di default corrispondente
      if (preset.fuelType === 'petrol') onFuelPriceChange(fuelPrices.petrol);
      else if (preset.fuelType === 'diesel') onFuelPriceChange(fuelPrices.diesel);
      else if (preset.fuelType === 'lpg') onFuelPriceChange(fuelPrices.lpg);
      else if (preset.fuelType === 'cng') onFuelPriceChange(fuelPrices.cng);
      else if (preset.fuelType === 'electric') onFuelPriceChange(fuelPrices.electricFast);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-800">Parametri Mezzo e Carburante</h2>
        </div>
      </div>

      {/* Tabs Tipo Veicolo: Auto / Moto / Furgone */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => {
            onVehicleTypeChange('car');
            const first = VEHICLE_PRESETS.find(p => p.type === 'car');
            if (first) handlePresetSelect(first.id);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
            vehicleType === 'car'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Auto</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onVehicleTypeChange('motorcycle');
            const first = VEHICLE_PRESETS.find(p => p.type === 'motorcycle');
            if (first) handlePresetSelect(first.id);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
            vehicleType === 'motorcycle'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Moto</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onVehicleTypeChange('van');
            handlePresetSelect('custom');
          }}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition ${
            vehicleType === 'van'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Furgone / Altro</span>
        </button>
      </div>

      {/* Selezione Preset Modello */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          Modello o Categoria
        </label>
        <select
          value={selectedPresetId}
          onChange={(e) => handlePresetSelect(e.target.value)}
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {filteredPresets.map(preset => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
          <option value="custom">✏️ Personalizzato (inserisci i tuoi valori)</option>
        </select>
      </div>

      {/* Tipo Carburante */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          Alimentazione
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {(['petrol', 'diesel', 'lpg', 'cng', 'electric'] as FuelType[]).map((f) => {
            const labels: Record<FuelType, string> = {
              petrol: 'Benzina',
              diesel: 'Diesel',
              lpg: 'GPL',
              cng: 'Metano',
              electric: 'Elettrico',
            };
            const isSelected = fuelType === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => {
                  onFuelTypeChange(f);
                  if (f === 'electric') {
                    onConsumptionUnitChange('kWh/100km');
                    onFuelPriceChange(fuelPrices.electricFast);
                  } else {
                    if (consumptionUnit === 'kWh/100km') onConsumptionUnitChange('l/100km');
                    if (f === 'petrol') onFuelPriceChange(fuelPrices.petrol);
                    if (f === 'diesel') onFuelPriceChange(fuelPrices.diesel);
                    if (f === 'lpg') onFuelPriceChange(fuelPrices.lpg);
                    if (f === 'cng') onFuelPriceChange(fuelPrices.cng);
                  }
                }}
                className={`py-2 px-1 text-xs font-semibold rounded-lg border text-center transition ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Consumo e Unità di Misura (km/l vs l/100km) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Consumo Mezzo
            </label>
            {fuelType !== 'electric' && (
              <button
                type="button"
                onClick={() => {
                  if (consumptionUnit === 'l/100km') {
                    onConsumptionUnitChange('km/l');
                    onConsumptionChange(convertToKmPerL(consumption));
                  } else {
                    onConsumptionUnitChange('l/100km');
                    onConsumptionChange(Math.round((100 / consumption) * 10) / 10);
                  }
                }}
                className="text-[11px] font-medium text-blue-600 hover:underline"
              >
                Passa a {consumptionUnit === 'l/100km' ? 'km/l' : 'l/100km'}
              </button>
            )}
          </div>
          <div className="relative flex items-center">
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={consumption}
              onChange={(e) => onConsumptionChange(parseFloat(e.target.value) || 0)}
              className="w-full pl-3 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 text-xs font-medium text-slate-400">
              {consumptionUnit}
            </span>
          </div>
        </div>

        {/* Prezzo Carburante (€/L o €/kWh) */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Prezzo Carburante
            </label>
            <span className="text-[11px] text-slate-400">Media MIMIT</span>
          </div>
          <div className="relative flex items-center">
            <input
              type="number"
              step="0.001"
              min="0.01"
              value={fuelPrice}
              onChange={(e) => onFuelPriceChange(parseFloat(e.target.value) || 0)}
              className="w-full pl-3 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 text-xs font-medium text-slate-400">
              {fuelType === 'electric' ? '€/kWh' : '€/L'}
            </span>
          </div>
        </div>
      </div>

      {/* Opzioni speciali per Moto: Sconto Telepass Moto 30% */}
      {vehicleType === 'motorcycle' && (
        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <Bike className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <span className="font-bold text-amber-900">Sconto Telepass Moto (-30%)</span>
              <p className="text-amber-700 text-[11px]">Tariffa ridotta ufficiale sui caselli italiani per le due ruote con Telepass/Unipol</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={hasMotoDiscount}
            onChange={onMotoDiscountToggle}
            className="w-4 h-4 text-blue-600 rounded cursor-pointer"
          />
        </div>
      )}

      {/* Opzioni per Bifuel GPL / Metano */}
      {(fuelType === 'lpg' || fuelType === 'cng') && (
        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-blue-600" />
              Ripartizione Bifuel: {bifuelRatio}% {fuelType.toUpperCase()} / {100 - bifuelRatio}% Benzina
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={bifuelRatio}
            onChange={(e) => onBifuelRatioChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-[11px] text-slate-500">
            Considera la benzina consumata per gli avviamenti a freddo o se finisce la bombola.
          </p>
        </div>
      )}
    </div>
  );
};
