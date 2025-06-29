// Datos de aeropuertos principales
export const airports = [
  // Estados Unidos
  { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' },
  { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA' },
  { code: 'MIA', name: 'Miami International Airport', city: 'Miami', country: 'USA' },
  { code: 'ORD', name: 'Chicago O\'Hare International Airport', city: 'Chicago', country: 'USA' },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'USA' },
  { code: 'DFW', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'USA' },
  { code: 'DEN', name: 'Denver International Airport', city: 'Denver', country: 'USA' },
  { code: 'LAS', name: 'McCarran International Airport', city: 'Las Vegas', country: 'USA' },
  { code: 'PHX', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', country: 'USA' },
  { code: 'IAH', name: 'George Bush Intercontinental Airport', city: 'Houston', country: 'USA' },
  
  // República Dominicana
  { code: 'SDQ', name: 'Las Américas International Airport', city: 'Santo Domingo', country: 'DOM' },
  { code: 'PUJ', name: 'Punta Cana International Airport', city: 'Punta Cana', country: 'DOM' },
  { code: 'STI', name: 'Cibao International Airport', city: 'Santiago', country: 'DOM' },
  { code: 'AZS', name: 'Samana El Catey International Airport', city: 'Samana', country: 'DOM' },
  { code: 'LRM', name: 'Casa de Campo International Airport', city: 'La Romana', country: 'DOM' },
  
  // Caribe
  { code: 'SJU', name: 'Luis Muñoz Marín International Airport', city: 'San Juan', country: 'PRI' },
  { code: 'CUN', name: 'Cancún International Airport', city: 'Cancún', country: 'MEX' },
  { code: 'NAS', name: 'Lynden Pindling International Airport', city: 'Nassau', country: 'BAH' },
  { code: 'BGI', name: 'Grantley Adams International Airport', city: 'Bridgetown', country: 'BAR' },
  { code: 'KIN', name: 'Norman Manley International Airport', city: 'Kingston', country: 'JAM' },
  
  // Europa
  { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'UK' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'FRA' },
  { code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas Airport', city: 'Madrid', country: 'ESP' },
  { code: 'FCO', name: 'Leonardo da Vinci-Fiumicino Airport', city: 'Rome', country: 'ITA' },
  { code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'NLD' },
  
  // Sudamérica
  { code: 'BOG', name: 'El Dorado International Airport', city: 'Bogotá', country: 'COL' },
  { code: 'CCS', name: 'Simón Bolívar International Airport', city: 'Caracas', country: 'VEN' },
  { code: 'PTY', name: 'Tocumen International Airport', city: 'Panama City', country: 'PAN' },
  { code: 'GRU', name: 'São Paulo/Guarulhos International Airport', city: 'São Paulo', country: 'BRA' },
  { code: 'LIM', name: 'Jorge Chávez International Airport', city: 'Lima', country: 'PER' },
];

// Tipos de aeronaves
export const aircraftTypes = [
  // Boeing
  { code: 'B737', name: 'Boeing 737', category: 'Narrow-body', capacity: '130-230' },
  { code: 'B747', name: 'Boeing 747', category: 'Wide-body', capacity: '400-660' },
  { code: 'B757', name: 'Boeing 757', category: 'Narrow-body', capacity: '200-280' },
  { code: 'B767', name: 'Boeing 767', category: 'Wide-body', capacity: '200-400' },
  { code: 'B777', name: 'Boeing 777', category: 'Wide-body', capacity: '300-550' },
  { code: 'B787', name: 'Boeing 787 Dreamliner', category: 'Wide-body', capacity: '200-350' },
  
  // Airbus
  { code: 'A320', name: 'Airbus A320', category: 'Narrow-body', capacity: '140-240' },
  { code: 'A321', name: 'Airbus A321', category: 'Narrow-body', capacity: '180-244' },
  { code: 'A330', name: 'Airbus A330', category: 'Wide-body', capacity: '250-440' },
  { code: 'A340', name: 'Airbus A340', category: 'Wide-body', capacity: '250-440' },
  { code: 'A350', name: 'Airbus A350', category: 'Wide-body', capacity: '300-440' },
  { code: 'A380', name: 'Airbus A380', category: 'Wide-body', capacity: '500-850' },
  
  // Embraer
  { code: 'E170', name: 'Embraer E170', category: 'Regional', capacity: '70-80' },
  { code: 'E175', name: 'Embraer E175', category: 'Regional', capacity: '76-88' },
  { code: 'E190', name: 'Embraer E190', category: 'Regional', capacity: '96-114' },
  
  // Bombardier
  { code: 'CRJ7', name: 'Bombardier CRJ700', category: 'Regional', capacity: '68-78' },
  { code: 'CRJ9', name: 'Bombardier CRJ900', category: 'Regional', capacity: '76-90' },
  
  // ATR
  { code: 'AT72', name: 'ATR 72', category: 'Turboprop', capacity: '68-78' },
  { code: 'AT42', name: 'ATR 42', category: 'Turboprop', capacity: '40-50' },
];

// Aerolíneas
export const airlines = [
  { code: 'AA', name: 'American Airlines', country: 'USA' },
  { code: 'DL', name: 'Delta Air Lines', country: 'USA' },
  { code: 'UA', name: 'United Airlines', country: 'USA' },
  { code: 'B6', name: 'JetBlue Airways', country: 'USA' },
  { code: 'NK', name: 'Spirit Airlines', country: 'USA' },
  { code: 'F9', name: 'Frontier Airlines', country: 'USA' },
  { code: 'WN', name: 'Southwest Airlines', country: 'USA' },
  { code: 'Z4', name: 'Zoom Air', country: 'DOM' },
  { code: 'JY', name: 'Intercaribbean Airways', country: 'TCI' },
  { code: 'CM', name: 'Copa Airlines', country: 'PAN' },
  { code: 'AV', name: 'Avianca', country: 'COL' },
  { code: 'IB', name: 'Iberia', country: 'ESP' },
  { code: 'AF', name: 'Air France', country: 'FRA' },
  { code: 'LH', name: 'Lufthansa', country: 'DEU' },
  { code: 'BA', name: 'British Airways', country: 'GBR' },
];

// Puertas por terminal
export const gates = [
  // Terminal Principal Santo Domingo
  { code: 'A1', terminal: 'Terminal Principal Santo Domingo', type: 'International' },
  { code: 'A2', terminal: 'Terminal Principal Santo Domingo', type: 'International' },
  { code: 'A3', terminal: 'Terminal Principal Santo Domingo', type: 'International' },
  { code: 'A4', terminal: 'Terminal Principal Santo Domingo', type: 'International' },
  { code: 'A5', terminal: 'Terminal Principal Santo Domingo', type: 'International' },
  { code: 'A6', terminal: 'Terminal Principal Santo Domingo', type: 'International' },
  { code: 'A7', terminal: 'Terminal Principal Santo Domingo', type: 'International' },
  { code: 'A8', terminal: 'Terminal Principal Santo Domingo', type: 'International' },
  { code: 'A9', terminal: 'Terminal Principal Santo Domingo', type: 'International' },
  { code: 'A10', terminal: 'Terminal Principal Santo Domingo', type: 'International' },
  { code: 'A11', terminal: 'Terminal Principal Santo Domingo', type: 'International' },
  { code: 'A12', terminal: 'Terminal Principal Santo Domingo', type: 'International' },
  { code: 'A13', terminal: 'Terminal Principal Santo Domingo', type: 'International' },
  { code: 'B1', terminal: 'Terminal Principal Santo Domingo', type: 'Domestic' },
  { code: 'B2', terminal: 'Terminal Principal Santo Domingo', type: 'Domestic' },
  { code: 'B3', terminal: 'Terminal Principal Santo Domingo', type: 'Domestic' },
  { code: 'B4', terminal: 'Terminal Principal Santo Domingo', type: 'Domestic' },
  { code: 'B5', terminal: 'Terminal Principal Santo Domingo', type: 'Domestic' },
];

// Funciones de utilidad para crear opciones de selección
export const getAirportOptions = () => {
  return airports.map(airport => ({
    value: airport.code,
    label: `${airport.code} - ${airport.name} (${airport.city})`
  }));
};

export const getAircraftOptions = () => {
  return aircraftTypes.map(aircraft => ({
    value: aircraft.code,
    label: `${aircraft.code} - ${aircraft.name} (${aircraft.capacity} pax)`
  }));
};

export const getAirlineOptions = () => {
  return airlines.map(airline => ({
    value: airline.code,
    label: `${airline.code} - ${airline.name}`
  }));
};

export const getGateOptions = () => {
  return gates.map(gate => ({
    value: gate.code,
    label: `${gate.code} - ${gate.terminal} (${gate.type})`
  }));
};

// Función para buscar aeropuerto por código
export const findAirportByCode = (code: string) => {
  return airports.find(airport => airport.code === code);
};

// Función para buscar aeronave por código
export const findAircraftByCode = (code: string) => {
  return aircraftTypes.find(aircraft => aircraft.code === code);
};
