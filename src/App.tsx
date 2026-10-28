import React, { useState } from 'react';
import { Coordinates, ConsumptionUnit, FuelPrices, FuelType, RouteCalculationResult, VehiclePreset, VehicleType } from './types';
import { VEHICLE_PRESETS } from './data/vehiclePresets';
import { DEFAULT_FUEL_PRICES } from './services/fuelService';
import { calculateRoute } from './services/routingService';
import { LocationInput } from './components/LocationInput';
import { VehicleSelector } from './components/VehicleSelector';
import { CostSummary } from './components/CostSummary';
import { MapView } from './components/Map';
import { Route, ArrowUpDown, Sparkles, AlertCircle, Compass, CheckCircle2, Coins } from 'lucide-react';

export function App() {
  // Punti di partenza e arrivo (Preimpostati di esempio: Milano -> Bologna)
  const [originName, setOriginName] = useState('Milano, Lombardia, Italia');
  const [originCoords, setOriginCoords] = useState<Coordinates | null>({ lat: 45.4642, lng: 9.1900 });

  const [destName, setDestName] = useState('Bologna, Emilia-Romagna, Italia');
  const [destCoords, setDestCoords] = useState<Coordinates | null>({ lat: 44.4949, lng: 11.3426 });

  // Stato Mezzo e Carburante
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('car-diesel-compact');
  const [selectedPreset, setSelectedPreset] = useState<VehiclePreset | null>(VEHICLE_PRESETS[2]);
  
  const [fuelType, setFuelType] = useState<FuelType>('diesel');
  const [consumption, setConsumption] = useState<number>(4.8);
  const [consumptionUnit, setConsumptionUnit] = useState<ConsumptionUnit>('l/100km');
  
  const [fuelPrices] = useState<FuelPrices>(DEFAULT_FUEL_PRICES);
  const [fuelPrice, setFuelPrice] = useState<number>(DEFAULT_FUEL_PRICES.diesel);

  // Opzioni avanzate
  const [avoidTolls, setAvoidTolls] = useState<boolean>(false);
  const [hasMotoDiscount, setHasMotoDiscount] = useState<boolean>(false);
  const [bifuelRatio, setBifuelRatio] = useState<number>(90);
  const [passengers, setPassengers] = useState<number>(1);
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(false);

  // Risultato Calcolo Percorso
  const [routeResult, setRouteResult] = useState<RouteCalculationResult | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Scambia partenza e arrivo
  const handleSwapLocations = () => {
    const tempName = originName;
    const tempCoords = originCoords;
    setOriginName(destName);
    setOriginCoords(destCoords);
    setDestName(tempName);
    setDestCoords(tempCoords);
  };

  // Esegui calcolo del percorso e pedaggi
  const handleCalculate = async (overrideAvoidTolls?: boolean) => {
    if (!originCoords || !destCoords) {
      setErrorMessage('Seleziona una città di partenza e una di arrivo valide.');
      return;
    }

    setIsLoadingRoute(true);
    setErrorMessage(null);

    const shouldAvoidTolls = overrideAvoidTolls !== undefined ? overrideAvoidTolls : avoidTolls;

    try {
      const res = await calculateRoute(
        originCoords,
        destCoords,
        originName,
        destName,
        vehicleType,
        hasMotoDiscount,
        shouldAvoidTolls
      );
      setRouteResult(res);
      setSelectedRouteIndex(0);
    } catch (err: any) {
      setErrorMessage(err.message || 'Errore durante il calcolo dell\'itinerario.');
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Calcola automaticamente all'avvio se le coordinate sono precompilate
  React.useEffect(() => {
    handleCalculate();
  }, []);

  const availableRoutes = routeResult
    ? [routeResult, ...(routeResult.alternatives || [])]
    : [];
  const activeRoute = availableRoutes[selectedRouteIndex] || routeResult;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 pb-12">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight flex items-center gap-2">
                Trip Calculator
                <span className="text-[10px] font-semibold tracking-wide bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                  Open Source
                </span>
              </h1>
              <p className="text-xs text-slate-500">Costi Reali, Consumi e Pedaggi Autostradali</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Routing OpenStreetMap Gratuito
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Tariffe Caselli Italia
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Colonna Sinistra: Form e Controlli (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Box Itinerario */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Route className="w-4 h-4 text-blue-600" />
                  Itinerario di Viaggio
                </span>
                <button
                  type="button"
                  onClick={handleSwapLocations}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition text-xs flex items-center gap-1 font-medium"
                  title="Inverti partenza e arrivo"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Inverti</span>
                </button>
              </div>

              <div className="space-y-3">
                <LocationInput
                  label="Partenza"
                  placeholder="Es. Milano, Roma, Napoli..."
                  value={originName}
                  onChange={(name, coords) => {
                    setOriginName(name);
                    setOriginCoords(coords);
                  }}
                  accentColor="text-emerald-500"
                />

                <LocationInput
                  label="Arrivo"
                  placeholder="Es. Bologna, Firenze, Venezia..."
                  value={destName}
                  onChange={(name, coords) => {
                    setDestName(name);
                    setDestCoords(coords);
                  }}
                  accentColor="text-rose-500"
                />

                {/* Opzione Evita Pedaggi */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="text-xs font-semibold text-slate-700">Evita pedaggi</span>
                      <p className="text-[10px] text-slate-400">Privilegia strade statali e percorsi gratuiti</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !avoidTolls;
                      setAvoidTolls(next);
                      if (originCoords && destCoords) {
                        handleCalculate(next);
                      }
                    }}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-200 ease-in-out ${
                      avoidTolls ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-200 ease-in-out ${
                        avoidTolls ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleCalculate()}
                disabled={isLoadingRoute || !originCoords || !destCoords}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoadingRoute ? (
                  <span>Calcolo percorso in corso...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Calcola Costi e Pedaggi</span>
                  </>
                )}
              </button>

              {/* Selettore Percorsi Alternativi se disponibili */}
              {availableRoutes.length > 1 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Percorsi disponibili:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableRoutes.map((r, idx) => {
                      const isSelected = selectedRouteIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedRouteIndex(idx)}
                          className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/70 shadow-xs ring-1 ring-blue-400'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                              {r.routeName || `Percorso ${idx + 1}`}
                            </span>
                            {r.tollCost === 0 ? (
                              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full shrink-0">
                                Gratis
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full shrink-0">
                                €{r.tollCost.toFixed(2)} pedaggio
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                            <span className="font-semibold text-slate-700">{r.distanceKm} km</span>
                            <span>•</span>
                            <span>{Math.floor(r.durationMinutes / 60) > 0 ? `${Math.floor(r.durationMinutes / 60)}h ` : ''}{r.durationMinutes % 60}m</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Box Mezzo e Carburante */}
            <VehicleSelector
              vehicleType={vehicleType}
              onVehicleTypeChange={setVehicleType}
              selectedPresetId={selectedPresetId}
              onPresetChange={(preset) => {
                setSelectedPreset(preset);
                setSelectedPresetId(preset ? preset.id : 'custom');
              }}
              fuelType={fuelType}
              onFuelTypeChange={setFuelType}
              consumption={consumption}
              onConsumptionChange={setConsumption}
              consumptionUnit={consumptionUnit}
              onConsumptionUnitChange={setConsumptionUnit}
              fuelPrice={fuelPrice}
              onFuelPriceChange={setFuelPrice}
              fuelPrices={fuelPrices}
              hasMotoDiscount={hasMotoDiscount}
              onMotoDiscountToggle={() => setHasMotoDiscount(!hasMotoDiscount)}
              bifuelRatio={bifuelRatio}
              onBifuelRatioChange={setBifuelRatio}
            />

            {/* Riepilogo Costi su Mobile (visibile sotto i controlli) */}
            {activeRoute && (
              <div className="block lg:hidden">
                <CostSummary
                  route={activeRoute}
                  originName={activeRoute.originName || originName}
                  destName={activeRoute.destName || destName}
                  vehicle={selectedPreset}
                  fuelType={fuelType}
                  customConsumption={consumption}
                  consumptionUnit={consumptionUnit}
                  customFuelPrice={fuelPrice}
                  passengers={passengers}
                  onPassengersChange={setPassengers}
                  isRoundTrip={isRoundTrip}
                  onRoundTripToggle={() => setIsRoundTrip(!isRoundTrip)}
                  fuelPrices={fuelPrices}
                />
              </div>
            )}
          </div>

          {/* Colonna Destra: Mappa e Riepilogo Desktop (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Mappa Interattiva Leaflet */}
            <MapView
              start={originCoords}
              end={destCoords}
              routeGeometry={activeRoute?.geometry}
            />

            {/* Riepilogo Costi su Desktop */}
            {activeRoute && (
              <div className="hidden lg:block">
                <CostSummary
                  route={activeRoute}
                  originName={activeRoute.originName || originName}
                  destName={activeRoute.destName || destName}
                  vehicle={selectedPreset}
                  fuelType={fuelType}
                  customConsumption={consumption}
                  consumptionUnit={consumptionUnit}
                  customFuelPrice={fuelPrice}
                  passengers={passengers}
                  onPassengersChange={setPassengers}
                  isRoundTrip={isRoundTrip}
                  onRoundTripToggle={() => setIsRoundTrip(!isRoundTrip)}
                  fuelPrices={fuelPrices}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
