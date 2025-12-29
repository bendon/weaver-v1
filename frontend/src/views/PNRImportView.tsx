import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './PNRImportView.css';

export default function PNRImportView() {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const bookingIdFromQuery = searchParams.get('bookingId');
  const actualBookingId = bookingId || bookingIdFromQuery;
  const { token } = useAuth();
  const [pnrText, setPnrText] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);

  const parseMutation = useMutation({
    mutationFn: async () => {
      if (!actualBookingId || !token) {
        throw new Error('Booking ID or authentication required. Please create a booking first.');
      }
      return await api.parsePNR(actualBookingId, pnrText, token);
    },
    onSuccess: (data) => {
      setParsedData(data);
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to parse PNR');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnrText.trim()) {
      alert('Please paste PNR text');
      return;
    }
    if (!actualBookingId) {
      alert('Please create a booking first');
      navigate('/dmc');
      return;
    }
    parseMutation.mutate();
  };

  return (
    <div className="pnr-import-view">
      <div className="pnr-import-container">
        <header className="import-header">
          <button className="back-btn" onClick={() => navigate('/dmc')}>
            ← Back
          </button>
          <h1>Import PNR 🔗</h1>
          <p>Import an existing booking from Amadeus</p>
        </header>

        <form className="import-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>PNR Text (Paste from Amadeus Terminal)</label>
            <textarea
              placeholder="Paste PNR text here...
Example:
RP/NBOXX0100/
1.SMITH/JOHN MR  2.SMITH/JANE MRS
2 KQ100 Y 15JAN NBOLHR HK2 2355 0625+1
3 KQ101 Y 22JAN LHRNBO HK2 2015 0630+1
4 AP NBO +254 722 123 456"
              value={pnrText}
              onChange={(e) => setPnrText(e.target.value)}
              rows={10}
              required
              className="pnr-textarea"
            />
            <small>Paste the complete PNR text from Amadeus terminal</small>
          </div>

          <button
            type="submit"
            className="import-btn"
            disabled={parseMutation.isPending || !pnrText.trim()}
          >
            {parseMutation.isPending ? 'Parsing...' : 'Parse PNR'}
          </button>
        </form>

        {parseMutation.isError && (
          <div className="error-message">
            {parseMutation.error instanceof Error
              ? parseMutation.error.message
              : 'Failed to parse PNR'}
          </div>
        )}

        {parsedData && (
          <div className="parsed-results">
            <h3>Parsed Data</h3>
            <div className="results-section">
              <h4>Travelers ({parsedData.travelers?.length || 0})</h4>
              {parsedData.travelers?.map((t: any, i: number) => (
                <div key={i} className="result-item">
                  {t.full_name} ({t.title})
                </div>
              ))}
            </div>
            <div className="results-section">
              <h4>Flights ({parsedData.flights?.length || 0})</h4>
              {parsedData.flights?.map((f: any, i: number) => (
                <div key={i} className="result-item">
                  {f.carrier_code}{f.flight_number} - {f.departure_airport} → {f.arrival_airport}
                  <br />
                  <small>{f.departure_date} {f.departure_time} - {f.arrival_time}</small>
                </div>
              ))}
            </div>
            {parsedData.contact && (
              <div className="results-section">
                <h4>Contact</h4>
                <div className="result-item">{parsedData.contact.phone}</div>
              </div>
            )}
            <button
              className="import-btn"
              onClick={() => {
                alert('Flights will be added to booking. This feature will be implemented next.');
                navigate('/dmc');
              }}
            >
              Add to Booking
            </button>
          </div>
        )}

        <div className="info-section">
          <h3>About PNR Parsing</h3>
          <ul>
            <li>Paste raw PNR text from Amadeus terminal</li>
            <li>Automatically extracts travelers and flights</li>
            <li>Enriches flight data with Amadeus API</li>
            <li>Adds parsed data to your booking</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

