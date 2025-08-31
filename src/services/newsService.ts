import { mergeMap, Observable, of, throwError } from "rxjs";
import { fromFetch } from "rxjs/fetch";
import News from "../models/news";
import BaseService from "./baseService";

export default class NewsService extends BaseService<News[]> {

    protected options: any;

    constructor() {
        super('https://newsdata.io/api/1/news', { q: 'cryptocurrencies', language: 'en', page: '1' });
        this.options = {}; // Usunięto nagłówki, ponieważ to API ich nie potrzebuje
    }

    protected getQueryParams(queryParams: any) {
        queryParams['q'] = queryParams['q'] || this.queryParams['q'];
        queryParams['apikey'] = process.env.REACT_APP_RAPID_API_FREENEWS_KEY; // Dodano klucz API do parametrów
        return super.getQueryParams(queryParams);
    }

    public retrieve(queryParams: any = {}): Observable<News[]> {
        const qp = this.getQueryParams(queryParams);
        if (qp['page'] > 4) return of([]);
        const url = this.getUrl(qp);

        // get response from cache if time passed is less then 5min from the first call
        if (this.isCacheResponseValid(url)) {
            return of(this.getFromCache(url));
        }

        return fromFetch(url, this.options).pipe(
            mergeMap((res: any) => {
                if (res.ok) {
                    return res.json();
                } else {
                    return throwError(() => new Error(res.statusText));
                }
            }),
            mergeMap((res: any) => {
                this.putInCache(res['results'], url, 5); // Zmieniono na 'results'
                return of(res['results']); // Zmieniono na 'results'
            })
        ) as Observable<News[]>
        // return from(this.fetchFakeData(news.articles, 1000));
    }
}
