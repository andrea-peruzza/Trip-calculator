import React, { useState, useRef, useEffect } from 'react';
import { ConsumptionUnit, FuelPrices, FuelType, VehiclePreset, VehicleType, CarDatasetEntry } from '../types';
import { VEHICLE_PRESETS } from '../data/vehiclePresets';
import { searchCars, mapDatasetFuelToFuelType } from '../data/carDatasetService';
import { Car, Bike, Truck, Settings2, Percent, Search, X, Check } from 'lucide-react';
import { convertToKmPerL } from '../services/fuelService';

interface VehicleSelectorProps {
  vehicleType: VehicleType;
  onVehicleTypeChange: (type: VehicleType) => void;
  selectedPresetId: string;
  onPresetChange: (preset: VehiclePreset | null) => void;
  selectedCarDataset: CarDatasetEntry | null;
  onCarDatasetSelect: (car: CarDatasetEntry | null) => void;
  fuelType: FuelType;
  onFuelTypeChange: (fuel: FuelType) => void;
  consumption: number;
  onConsumptionChange: (val: number) => void;
  consumptionGPL: number;
  onConsumptionGPLChange: (val: number) => void;
  consumptionUnit: ConsumptionUnit;
  onConsumptionUnitChange: (unit: ConsumptionUnit) => void;
  fuelPrice: number;
  onFuelPriceChange: (price: number) => void;
  customPetrolPrice: number;
  onCustomPetrolPriceChange: (val: number) => void;
  customLpgPrice: number;
  onCustomLpgPriceChange: (val: number) => void;
  fuelPrices: FuelPrices;
  hasMotoDiscount: boolean;
  onMotoDiscountToggle: () => void;
  bifuelRatio: number; // 0 to 100 (% GPL vs Benzina)
  onBifuelRatioChange: (val: number) => void;
  co2PerKm: number | null;
  onCo2PerKmChange: (val: number | null) => void;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({
  vehicleType,
  onVehicleTypeChange,
  selectedPresetId,
  onPresetChange,
  selectedCarDataset,
  onCarDatasetSelect,
  fuelType,
  onFuelTypeChange,
  consumption,
  onConsumptionChange,
  consumptionGPL,
  onConsumptionGPLChange,
  consumptionUnit,
  onConsumptionUnitChange,
  fuelPrice,
  onFuelPriceChange,
  customPetrolPrice,
  onCustomPetrolPriceChange,
  customLpgPrice,
  onCustomLpgPriceChange,
  fuelPrices,
  hasMotoDiscount,
  onMotoDiscountToggle,
  bifuelRatio,
  onBifuelRatioChange,
  co2PerKm,
  onCo2PerKmChange,
}) => {
  const [carSearchQuery, setCarSearchQuery] = useState('');
  const [carResults, setCarResults] = useState<CarDatasetEntry[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const filteredPresets = VEHICLE_PRESETS.filter(p => p.type === vehicleType);

  // Ricerca dinamica quando l'utente scrive
  useEffect(() => {
    if (carSearchQuery.trim().length >= 1) {
      const results = searchCars(carSearchQuery, 15);
      setCarResults(results);
      setIsSearchOpen(true);
    } else {
      setCarResults([]);
      setIsSearchOpen(false);
    }
  }, [carSearchQuery]);

  // Chiudi dropdown se clicco fuori
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCarFromDataset = (car: CarDatasetEntry) => {
    onCarDatasetSelect(car);
    onPresetChange(null);
    setIsSearchOpen(false);
    setCarSearchQuery(`${car.make} ${car.model}`);

    const mappedFuel = mapDatasetFuelToFuelType(car.fuel);
    onFuelTypeChange(mappedFuel);
    onConsumptionUnitChange('l/100km');

    // Consumo combinato
    onConsumptionChange(car.fuelConsumptionComb || 0);

    // Se bifuel E/N
    if (car.fuel === 'E/N') {
      onConsumptionGPLChange(car.fuelConsumptionGPL || car.fuelConsumptionComb || 0);
      // Prezzo ponderato iniziale in base al ratio
      const ratioGpl = bifuelRatio / 100;
      const combinedPrice = ratioGpl * customLpgPrice + (1 - ratioGpl) * customPetrolPrice;
      onFuelPriceChange(Math.round(combinedPrice * 1000) / 1000);
    } else {
      if (mappedFuel === 'diesel') onFuelPriceChange(fuelPrices.diesel);
      else if (mappedFuel === 'petrol') onFuelPriceChange(customPetrolPrice || fuelPrices.petrol);
      else if (mappedFuel === 'lpg') onFuelPriceChange(customLpgPrice || fuelPrices.lpg);
      else if (mappedFuel === 'cng') onFuelPriceChange(fuelPrices.cng);
      else if (mappedFuel === 'electric') onFuelPriceChange(fuelPrices.electricFast);
    }

    // CO2 da dataset (g/km)
    onCo2PerKmChange(car.co2Emissions || null);
  };

  const handleClearCarSelection = () => {
    onCarDatasetSelect(null);
    setCarSearchQuery('');
    onCo2PerKmChange(null);
  };

  const handlePresetSelect = (id: string) => {
    if (id === 'custom') {
      onPresetChange(null);
      return;
    }
    const preset = VEHICLE_PRESETS.find(p => p.id === id);
    if (preset) {
      onCarDatasetSelect(null);
      setCarSearchQuery('');
      onCo2PerKmChange(null);
      onPresetChange(preset);
      onFuelTypeChange(preset.fuelType);
      onConsumptionChange(preset.defaultConsumption);
      onConsumptionUnitChange(preset.unit);

      // Aggiorna anche il prezzo di default corrispondente
      if (preset.fuelType === 'petrol') onFuelPriceChange(customPetrolPrice || fuelPrices.petrol);
      else if (preset.fuelType === 'diesel') onFuelPriceChange(fuelPrices.diesel);
      else if (preset.fuelType === 'lpg') onFuelPriceChange(customLpgPrice || fuelPrices.lpg);
      else if (preset.fuelType === 'cng') onFuelPriceChange(fuelPrices.cng);
      else if (preset.fuelType === 'electric') onFuelPriceChange(fuelPrices.electricFast);
    }
  };

  // Aggiornamento dinamico del prezzo per bifuel
  const handleBifuelRatioUpdate = (ratio: number, pPetrol = customPetrolPrice, pLpg = customLpgPrice) => {
    onBifuelRatioChange(ratio);
    if (fuelType === 'lpg' || (selectedCarDataset && selectedCarDataset.fuel === 'E/N')) {
      const gplPart = ratio / 100;
      const petrolPart = 1 - gplPart;
      const newPrice = gplPart * pLpg + petrolPart * pPetrol;
      onFuelPriceChange(Math.round(newPrice * 1000) / 1000);
    } else if (fuelType === 'cng') {
      const cngPart = ratio / 100;
      const petrolPart = 1 - cngPart;
      const newPrice = cngPart * fuelPrices.cng + petrolPart * pPetrol;
      onFuelPriceChange(Math.round(newPrice * 1000) / 1000);
    }
  };

  const handlePetrolPriceChange = (val: number) => {
    onCustomPetrolPriceChange(val);
    handleBifuelRatioUpdate(bifuelRatio, val, customLpgPrice);
  };

  const handleLpgPriceChange = (val: number) => {
    onCustomLpgPriceChange(val);
    handleBifuelRatioUpdate(bifuelRatio, customPetrolPrice, val);
  };

  const isBifuelVehicle = fuelType === 'lpg' || fuelType === 'cng' || (selectedCarDataset && selectedCarDataset.fuel === 'E/N');

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

      {/* Ricerca Auto da Dataset Ufficiale */}
      {vehicleType === 'car' && (
        <div ref={searchContainerRef} className="relative">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
            <span>Cerca Modello nel Dataset Ufficiale</span>
            {selectedCarDataset && (
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                Dati CO₂ e Consumi Certificati
              </span>
            )}
          </label>
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-blue-500" />
            <input
              type="text"
              value={carSearchQuery}
              onChange={(e) => setCarSearchQuery(e.target.value)}
              onFocus={() => {
                if (carResults.length > 0) setIsSearchOpen(true);
              }}
              placeholder="Es. Fiat Punto, Ford Focus, BMW 320, Golf..."
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
            />
            {carSearchQuery && (
              <button
                type="button"
                onClick={handleClearCarSelection}
                className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Risultati ricerca dataset */}
          {isSearchOpen && carResults.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto py-1 divide-y divide-slate-100">
              {carResults.map((car) => {
                const isSelected = selectedCarDataset?.id === car.id;
                let fuelLabel = 'Benzina';
                if (car.fuel === 'D') fuelLabel = 'Diesel';
                else if (car.fuel === 'E/N') fuelLabel = 'Bifuel Benzina/GPL';

                return (
                  <li
                    key={car.id}
                    onClick={() => handleSelectCarFromDataset(car)}
                    className={`px-3.5 py-2 cursor-pointer transition flex items-center justify-between gap-2 ${
                      isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {car.make} {car.model} {car.engineSize ? `${car.engineSize}L` : ''}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {fuelLabel} • Comb: {car.fuelConsumptionComb} L/100km • {car.co2Emissions} g CO₂/km
                        {car.fuelConsumptionGPL ? ` • GPL: ${car.fuelConsumptionGPL} L/100km` : ''}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Selezione Preset Modello / Categoria generica (alternativa rapida) */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          Oppure Seleziona Categoria Generica
        </label>
        <select
          value={selectedCarDataset ? 'custom' : selectedPresetId}
          onChange={(e) => handlePresetSelect(e.target.value)}
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {filteredPresets.map(preset => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
          <option value="custom">✏️ Personalizzato / Da Dataset (inserisci o modifica valori)</option>
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
                    if (f === 'petrol') onFuelPriceChange(customPetrolPrice || fuelPrices.petrol);
                    if (f === 'diesel') onFuelPriceChange(fuelPrices.diesel);
                    if (f === 'lpg') onFuelPriceChange(customLpgPrice || fuelPrices.lpg);
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

      {/* Se E/N (Bifuel Benzina/GPL) con due voci separate di consumo */}
      {selectedCarDataset && selectedCarDataset.fuel === 'E/N' ? (
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Voce Consumo Benzina */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Consumo Benzina
              </label>
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
                  L/100km
                </span>
              </div>
            </div>

            {/* Voce Consumo GPL */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Consumo GPL
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={consumptionGPL}
                  onChange={(e) => onConsumptionGPLChange(parseFloat(e.target.value) || 0)}
                  className="w-full pl-3 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 text-xs font-medium text-slate-400">
                  L/100km
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Consumo e Unità di Misura (km/l vs l/100km) per veicoli standard */
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

          {/* Prezzo Carburante standard (€/L o €/kWh) se NON bifuel */}
          {!isBifuelVehicle && (
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
          )}
        </div>
      )}

      {/* Prezzi modificabili per Bifuel: Prezzo Benzina (€/L), Prezzo GPL (€/L) e Prezzo Medio Ponderato */}
      {isBifuelVehicle && (
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Prezzi Carburanti Bifuel (Modificabili)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Prezzo Benzina (€/L)
              </label>
              <input
                type="number"
                step="0.001"
                min="0.01"
                value={customPetrolPrice}
                onChange={(e) => handlePetrolPriceChange(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Prezzo GPL (€/L)
              </label>
              <input
                type="number"
                step="0.001"
                min="0.01"
                value={customLpgPrice}
                onChange={(e) => handleLpgPriceChange(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-blue-700 mb-1">
                Prezzo Ponderato Effettivo
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.001"
                  min="0.01"
                  value={fuelPrice}
                  onChange={(e) => onFuelPriceChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 text-[11px] font-medium text-blue-500">
                  €/L
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emissioni CO2 manuali se desiderato modificare */}
      {co2PerKm !== null && (
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600 font-medium">Emissioni CO₂ da scheda:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              value={co2PerKm}
              onChange={(e) => onCo2PerKmChange(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-bold text-slate-800 text-xs"
            />
            <span className="text-slate-500 font-semibold">g/km</span>
          </div>
        </div>
      )}

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

      {/* Opzioni per Bifuel GPL / Metano con barra da 0 a 100 */}
      {isBifuelVehicle && (
        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-blue-600" />
              Ripartizione Bifuel: {bifuelRatio}% {fuelType === 'cng' ? 'Metano' : 'GPL'} / {100 - bifuelRatio}% Benzina
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={bifuelRatio}
            onChange={(e) => handleBifuelRatioUpdate(parseInt(e.target.value))}
            className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-[11px] text-slate-500">
            Imposta 100% per viaggiare esclusivamente a {fuelType === 'cng' ? 'Metano' : 'GPL'}, 0% per viaggiare solo a Benzina, oppure un valore intermedio. I litri consumati e il prezzo ponderato si aggiornano automaticamente.
          </p>
        </div>
      )}
    </div>
  );
};
