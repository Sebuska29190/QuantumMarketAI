import { mergeMap, Observable, of, throwError } from "rxjs";
import { fromFetch } from "rxjs/fetch";
import News from "../models/news";
import BaseService from "./baseService";

export default class NewsService extends BaseService<News[]> {

    protected options: any;

    constructor() {
        super('https://financialmodelingprep.com/api/v4/crypto_news', { page: '0' });
        this.options = {};
    }

    protected getQueryParams(queryParams: any) {
        queryParams['apikey'] = process.env.REACT_APP_RAPID_API_FREENEWS_KEY;
        return super.getQueryParams(queryParams);
    }

    public retrieve(queryParams: any = {}): Observable<News[]> {
        const qp = this.getQueryParams(queryParams);
        if (qp['page'] > 4) return of([]);
        const url = this.getUrl(qp);

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
                this.putInCache(res, url, 5);
                return of(res);
            })
        ) as Observable<News[]>
    }
}
