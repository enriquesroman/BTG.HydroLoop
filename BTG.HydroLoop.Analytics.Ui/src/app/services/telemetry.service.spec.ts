import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TelemetryService } from './telemetry.service';

describe('TelemetryService', () => {
  let service: TelemetryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TelemetryService]
    });
    service = TestBed.inject(TelemetryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with an empty history subject', () => {
    service.history$.subscribe(history => {
      expect(history).toEqual([]);
    });
  });

  it('should start with connectionStatus as disconnected', () => {
    service.connectionStatus$.subscribe(status => {
      expect(status).toBe('disconnected');
    });
  });

  it('should post mock telemetry correctly via REST API', () => {
    const mockTelemetry = {
      tankId: 'Test-Tank',
      waterLevelPercentage: 74.5,
      timestampUtc: 1717150000
    };

    service.pushMockTelemetry(mockTelemetry).subscribe(response => {
      expect(response).toBeTruthy();
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne('http://localhost:5033/api/telemetry');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockTelemetry);

    req.flush({ success: true, message: 'Telemetry ingested successfully.' });
  });
});
