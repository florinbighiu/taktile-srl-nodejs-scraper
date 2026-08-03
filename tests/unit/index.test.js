import { jest } from '@jest/globals';

describe('index.js Component Tests', () => {
  let index;

  beforeAll(async () => {
    index = await import('../../scraper/index.js');
  });

  describe('transformJobsForSOLR', () => {
    it('should filter locations to only Romanian cities', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', location: ['România'] },
          { url: 'https://test.com/2', title: 'Job 2', location: ['Bucharest'] },
          { url: 'https://test.com/3', title: 'Job 3', location: ['Bulgaria'] },
          { url: 'https://test.com/4', title: 'Job 4', location: ['Cluj-Napoca'] },
          { url: 'https://test.com/5', title: 'Job 5', location: [] }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.jobs[0].location).toEqual(['România']);
      expect(result.jobs[1].location).toEqual(['Bucharest']);
      expect(result.jobs[2].location).toEqual(['România']);
      expect(result.jobs[3].location).toEqual(['Cluj-Napoca']);
      expect(result.jobs[4].location).toEqual(['România']);
    });

    it('should keep company uppercase', () => {
      const payload = {
        source: 'jobs.ashbyhq.com/taktile',
        company: 'taktile s.r.l.',
        cif: '51981214',
        jobs: [
          { url: 'https://jobs.ashbyhq.com/taktile/1', title: 'Job 1', company: 'taktile', cif: '51981214' }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.company).toBe('TAKTILE S.R.L.');
    });

    it('should normalize workmode values', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', workmode: 'Remote' },
          { url: 'https://test.com/2', title: 'Job 2', workmode: 'ON-SITE' },
          { url: 'https://test.com/3', title: 'Job 3', workmode: 'Hybrid' },
          { url: 'https://test.com/4', title: 'Job 4', workmode: 'hybrid' }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.jobs[0].workmode).toBe('remote');
      expect(result.jobs[1].workmode).toBe('on-site');
      expect(result.jobs[2].workmode).toBe('hybrid');
      expect(result.jobs[3].workmode).toBe('hybrid');
    });

    it('should handle empty jobs array', () => {
      const result = index.transformJobsForSOLR({ jobs: [] });
      expect(result.jobs).toEqual([]);
    });
  });

  describe('mapToJobModel', () => {
    it('should map raw job to job model format', () => {
      const rawJob = {
        url: 'https://jobs.ashbyhq.com/taktile/job-123',
        title: 'Senior Developer',
        location: ['Iași'],
        tags: ['Java', 'Spring'],
        workmode: 'hybrid'
      };

      const COMPANY_NAME = 'TAKTILE S.R.L.';
      const COMPANY_CIF = '51981214';

      const result = index.mapToJobModel(rawJob, COMPANY_CIF, COMPANY_NAME);

      expect(result.url).toBe(rawJob.url);
      expect(result.title).toBe(rawJob.title);
      expect(result.company).toBe(COMPANY_NAME);
      expect(result.cif).toBe(COMPANY_CIF);
      expect(result.location).toEqual(rawJob.location);
      expect(result.tags).toEqual(rawJob.tags);
      expect(result.workmode).toBe(rawJob.workmode);
      expect(result.status).toBe('scraped');
      expect(result.date).toBeDefined();
    });

    it('should remove undefined fields', () => {
      const rawJob = {
        url: 'https://test.com/1',
        title: 'Job 1'
      };

      const result = index.mapToJobModel(rawJob, '51981214');

      expect(result.location).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.workmode).toBeUndefined();
    });

    it('should handle missing title', () => {
      const rawJob = { url: 'https://test.com/1' };

      const result = index.mapToJobModel(rawJob, '51981214');

      expect(result.title).toBeUndefined();
      expect(result.url).toBe('https://test.com/1');
    });
  });

  describe('parseApiJobs', () => {
    it('should parse Ashby API response format and keep Romania/Iasi jobs', () => {
      const apiData = {
        jobs: [
          {
            id: '1411daa1',
            title: 'Software Engineer Intern',
            location: 'Iasi Office',
            workplaceType: 'Hybrid',
            jobUrl: 'https://jobs.ashbyhq.com/taktile/1411daa1',
            address: { postalAddress: { addressCountry: 'Romania', addressLocality: 'Iasi' } },
            secondaryLocations: []
          },
          {
            id: 'abc123',
            title: 'Backend Engineer - Team Atlas',
            location: 'Berlin Office',
            workplaceType: 'Hybrid',
            jobUrl: 'https://jobs.ashbyhq.com/taktile/abc123',
            address: { postalAddress: { addressCountry: 'Germany', addressLocality: 'Berlin' } },
            secondaryLocations: [
              {
                location: 'Iasi Office',
                address: { postalAddress: { addressCountry: 'Romania', addressLocality: 'Iasi' } }
              }
            ]
          },
          {
            id: 'xyz789',
            title: 'Senior Solutions Engineer',
            location: 'New York Office',
            workplaceType: 'Hybrid',
            jobUrl: 'https://jobs.ashbyhq.com/taktile/xyz789',
            address: { postalAddress: { addressCountry: 'United States', addressLocality: 'New York' } },
            secondaryLocations: []
          }
        ]
      };

      const result = index.parseApiJobs(apiData);

      expect(result.jobs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.jobs[0].title).toBe('Software Engineer Intern');
      expect(result.jobs[0].location).toEqual(['Iași']);
      expect(result.jobs[0].workmode).toBe('hybrid');
      expect(result.jobs[0].url).toBe('https://jobs.ashbyhq.com/taktile/1411daa1');
      expect(result.jobs[1].title).toBe('Backend Engineer - Team Atlas');
    });

    it('should map Ashby workplaceType to workmode', () => {
      const apiData = {
        jobs: [
          { id: '1', title: 'Remote Job', location: 'Iasi Office', workplaceType: 'Remote' },
          { id: '2', title: 'Onsite Job', location: 'Iasi Office', workplaceType: 'Onsite' },
          { id: '3', title: 'Hybrid Job', location: 'Iasi Office', workplaceType: 'Hybrid' }
        ]
      };

      const result = index.parseApiJobs(apiData);

      expect(result.jobs[0].workmode).toBe('remote');
      expect(result.jobs[1].workmode).toBe('on-site');
      expect(result.jobs[2].workmode).toBe('hybrid');
    });

    it('should handle empty job list', () => {
      const apiData = { jobs: [] };

      const result = index.parseApiJobs(apiData);

      expect(result.jobs).toEqual([]);
    });

    it('should handle missing jobs field', () => {
      const result = index.parseApiJobs({});

      expect(result.jobs).toEqual([]);
    });

    it('should exclude jobs without Romania/Iasi location', () => {
      const apiData = {
        jobs: [
          {
            id: '1',
            title: 'Berlin Only Job',
            location: 'Berlin Office',
            address: { postalAddress: { addressCountry: 'Germany' } },
            secondaryLocations: []
          }
        ]
      };

      const result = index.parseApiJobs(apiData);

      expect(result.jobs).toHaveLength(0);
    });

    it('should fallback to id-based URL when jobUrl missing', () => {
      const apiData = {
        jobs: [
          { id: 'abc456', title: 'Test Job', location: 'Iasi Office' }
        ]
      };

      const result = index.parseApiJobs(apiData);

      expect(result.jobs[0].url).toBe('https://jobs.ashbyhq.com/taktile/abc456');
    });
  });
});
