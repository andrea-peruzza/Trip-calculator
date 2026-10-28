import React, { useState } from 'react';
import { Coordinates, ConsumptionUnit, FuelPrices, FuelType, RouteCalculationResult, VehiclePreset, VehicleType } from './types';
import { VEHICLE_PRESETS } from './data/vehiclePresets';
import { DEFAULT_FUEL_PRICES } from './services/fuelService';
import { calculateRoute } from './services/routingService';
import { LocationInput } from './components/LocationInput';
import { VehicleSelector } from './components/VehicleSelector';
import { CostSummary } from './components/CostSummary';
import { MapView } from './components/Map';
import { Route, ArrowUpDown, Sparkles, AlertCircle, Compass, CheckCircle2 } from 'lucide-react';

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
  const [hasMotoDiscount, setHasMotoDiscount] = useState<boolean>(false);
  const [bifuelRatio, setBifuelRatio] = useState<number>(90);
  const [passengers, setPassengers] = useState<number>(1);
  const [isRoundTrip, setIsRoundTrip] = useState<boolean>(false);

  // Risultato Calcolo Percorso
  const [routeResult, setRouteResult] = useState<RouteCalculationResult | null>(null);
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

  // Esegui calcolo del percorso e pedaggi tramite OSRM
  const handleCalculate = async () => {
    if (!originCoords || !destCoords) {
      setErrorMessage('Seleziona una città di partenza e una di arrivo valide.');
      return;
    }

    setIsLoadingRoute(true);
    setErrorMessage(null);

    try {
      const res = await calculateRoute(
        originCoords,
        destCoords,
        originName,
        destName,
        vehicleType,
        hasMotoDiscount
      );
      setRouteResult(res);
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
              Routing OSRM Gratuito
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
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleCalculate}
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
            {routeResult && (
              <div className="block lg:hidden">
                <CostSummary
                  route={routeResult}
                  originName={routeResult.originName || originName}
                  destName={routeResult.destName || destName}
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
              routeGeometry={routeResult?.geometry}
            />

            {/* Riepilogo Costi su Desktop */}
            {routeResult && (
              <div className="hidden lg:block">
                <CostSummary
                  route={routeResult}
                  originName={routeResult.originName || originName}
                  destName={routeResult.destName || destName}
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
