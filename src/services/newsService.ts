import { mergeMap, Observable, of, throwError } from "rxjs";
import { fromFetch } from "rxjs/fetch";
import News from "../models/news";
import BaseService from "./baseService";

export default class NewsService extends BaseService<News[]> {

    protected options: any;

    constructor() {
        super('https://api.polygon.io/v2/reference/news', { limit: 20 });
        this.options = {};
    }

    protected getQueryParams(queryParams: any) {
        queryParams['apiKey'] = process.env.REACT_APP_RAPID_API_FREENEWS_KEY;
        return super.getQueryParams(queryParams);
    }

    public retrieve(queryParams: any = {}): Observable<News[]> {
        const qp = this.getQueryParams(queryParams);
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
                this.putInCache(res['results'], url, 5);
                return of(res['results']);
            })
        ) as Observable<News[]>
    }
}
