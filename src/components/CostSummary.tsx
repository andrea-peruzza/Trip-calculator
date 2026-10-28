import React from 'react';
import { RouteCalculationResult, VehiclePreset, FuelPrices, ConsumptionUnit, FuelType } from '../types';
import { calculateFuelConsumed, calculateCo2Emissions } from '../services/fuelService';
import { Users, Fuel, CreditCard, ArrowLeftRight, Clock, Navigation, Leaf, Share2, Check } from 'lucide-react';

interface CostSummaryProps {
  route: RouteCalculationResult;
  originName?: string;
  destName?: string;
  vehicle: VehiclePreset | null;
  fuelType: FuelType;
  customConsumption: number;
  consumptionUnit: ConsumptionUnit;
  customFuelPrice: number;
  passengers: number;
  onPassengersChange: (val: number) => void;
  isRoundTrip: boolean;
  onRoundTripToggle: () => void;
  fuelPrices: FuelPrices;
}

export const CostSummary: React.FC<CostSummaryProps> = ({
  route,
  originName,
  destName,
  vehicle,
  fuelType,
  customConsumption,
  consumptionUnit,
  customFuelPrice,
  passengers,
  onPassengersChange,
  isRoundTrip,
  onRoundTripToggle,
}) => {
  const [copied, setCopied] = React.useState(false);

  const multiplier = isRoundTrip ? 2 : 1;
  const totalKm = Math.round(route.distanceKm * multiplier * 10) / 10;
  const totalDurationMinutes = route.durationMinutes * multiplier;

  // Calcolo consumo
  const fuelConsumedUnits = calculateFuelConsumed(totalKm, customConsumption, consumptionUnit);
  const fuelTotalCost = Math.round(fuelConsumedUnits * customFuelPrice * 100) / 100;

  // Calcolo pedaggio
  const tollTotalCost = Math.round(route.tollCost * multiplier * 100) / 100;

  // Totale complessivo
  const grandTotal = Math.round((fuelTotalCost + tollTotalCost) * 100) / 100;
  const perPerson = Math.round((grandTotal / Math.max(1, passengers)) * 100) / 100;

  // Emissioni CO2
  const co2Kg = calculateCo2Emissions(fuelType, fuelConsumedUnits);

  const formatDuration = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    return hours > 0 ? `${hours}h ${m}m` : `${m}m`;
  };

  const handleShare = () => {
    const origin = originName || route.originName || '';
    const dest = destName || route.destName || '';

    const text = `🚗 Viaggio calcolato con Trip Calculator:\n` +
      (origin ? `📍 Partenza: ${origin}\n` : '') +
      (dest ? `🏁 Arrivo: ${dest}\n` : '') +
      `Tratta: ${totalKm} km (${formatDuration(totalDurationMinutes)})${isRoundTrip ? ' [A/R]' : ''}\n` +
      `⛽ Carburante: €${fuelTotalCost.toFixed(2)} (${fuelConsumedUnits.toFixed(1)} ${fuelType === 'electric' ? 'kWh' : 'L'})\n` +
      `🛣️ Pedaggi: €${tollTotalCost.toFixed(2)}\n` +
      `💰 TOTALE: €${grandTotal.toFixed(2)} (${passengers > 1 ? `€${perPerson.toFixed(2)} a testa in ${passengers} passeggeri` : '1 passeggero'})\n`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
      {/* Header con Totale Principale */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Costo Totale Stimato {isRoundTrip && '(Andata e Ritorno)'}
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl font-extrabold text-slate-900">€{grandTotal.toFixed(2)}</span>
            {passengers > 1 && (
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                €{perPerson.toFixed(2)} / persona
              </span>
            )}
          </div>
        </div>

        {/* Pulsante Copia / Condividi */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          title="Copia riepilogo negli appunti"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span className="text-green-600 font-semibold">Copiato!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Condividi spesa</span>
            </>
          )}
        </button>
      </div>

      {/* Dati Viaggio & Toggle A/R */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <Navigation className="w-3.5 h-3.5 text-blue-500" />
            <span>Distanza</span>
          </div>
          <p className="text-base font-bold text-slate-800 mt-1">{totalKm} km</p>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Tempo stimato</span>
          </div>
          <p className="text-base font-bold text-slate-800 mt-1">{formatDuration(totalDurationMinutes)}</p>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-slate-50 p-3 rounded-xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
              <ArrowLeftRight className="w-3.5 h-3.5 text-amber-500" />
              <span>Andata/Ritorno</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{isRoundTrip ? 'Attivo (x2)' : 'Solo andata'}</p>
          </div>
          <button
            onClick={onRoundTripToggle}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-200 ease-in-out ${
              isRoundTrip ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-200 ease-in-out ${
                isRoundTrip ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dettaglio Costi: Carburante e Pedaggi */}
      <div className="space-y-3">
        {/* Voce Carburante */}
        <div className="flex items-center justify-between p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 text-white rounded-lg">
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Spesa Carburante {vehicle ? `(${vehicle.name})` : ''}
              </p>
              <p className="text-xs text-slate-500">
                {fuelConsumedUnits.toFixed(1)} {fuelType === 'electric' ? 'kWh' : 'litri'} @ €{customFuelPrice.toFixed(3)}/{fuelType === 'electric' ? 'kWh' : 'L'}
              </p>
            </div>
          </div>
          <span className="text-base font-bold text-blue-700">€{fuelTotalCost.toFixed(2)}</span>
        </div>

        {/* Voce Pedaggio */}
        <div className="flex items-center justify-between p-3.5 bg-amber-50/60 rounded-xl border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Pedaggio Autostradale
              </p>
              <p className="text-xs text-slate-500">
                {route.summary}
              </p>
            </div>
          </div>
          <span className="text-base font-bold text-amber-700">€{tollTotalCost.toFixed(2)}</span>
        </div>
      </div>

      {/* Selettore Passeggeri (Divisione Spese) */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-700">Dividi con passeggeri</span>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => onPassengersChange(Math.max(1, passengers - 1))}
            className="w-7 h-7 flex items-center justify-center rounded bg-white text-slate-700 font-bold hover:bg-slate-50 shadow-xs"
          >
            -
          </button>
          <span className="w-6 text-center text-xs font-bold text-slate-800">{passengers}</span>
          <button
            onClick={() => onPassengersChange(Math.min(9, passengers + 1))}
            className="w-7 h-7 flex items-center justify-center rounded bg-white text-slate-700 font-bold hover:bg-slate-50 shadow-xs"
          >
            +
          </button>
        </div>
      </div>

      {/* Sostenibilità / CO2 */}
      <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">
        <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>
          Impatto stimato: <strong>{co2Kg} kg di CO₂</strong> emessi per questo itinerario.
        </span>
      </div>
    </div>
  );
};
