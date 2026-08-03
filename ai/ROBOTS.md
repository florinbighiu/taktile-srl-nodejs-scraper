# Robots.txt Analysis — Taktile Ashby Board

Sursa: https://jobs.ashbyhq.com/robots.txt (Ashby) — Taktile folosește platforma Ashby pentru board-ul de job-uri.

## Reguli (Ashby)

```
User-agent: *
Disallow: /apply/*
Disallow: /c/*/apply/*
```

## Interpretare

| Cale | Accesibil? | Ce conține |
|---|---|---|
| `/` | ✅ Accesibil | Pagina board-ului de job-uri |
| `/taktile` | ✅ Accesibil | Board-ul public Taktile |
| API (`api.ashbyhq.com/posting-api/...`) | ✅ Accesibil | API-ul public JSON de unde scraper-ul extrage datele |
| `/apply/*` | ❌ Disallowed | Formularele de aplicare (nu le scraper-uim) |

## Recomandare

- API-ul `api.ashbyhq.com/posting-api/job-board/taktile` este **public**, răspunde fără autentificare și fără User-Agent special — este API-ul oficial de posting al Ashby, conceput tocmai pentru syndication/agregatoare de job-uri (similar peviitor.ro).
- Paginile individuale de job (`jobs.ashbyhq.com/taktile/{id}`) sunt accesibile și sunt folosite doar ca URL-uri de destinație în modelul de job + pentru HEAD checks în teste.
- Scraperul face o singură cerere pentru tot board-ul — comportament foarte rezonabil, nu agresiv.

**Concluzie**: Risc minim. API-ul e public și destinat agregării, iar scraperul e politicos (User-Agent standard `job_seeker_ro_spider`, o singură cerere simultană).
