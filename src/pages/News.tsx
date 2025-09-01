import { Grid, Skeleton } from '@mui/material';
import React, { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Subject, takeUntil } from 'rxjs';
import NewsList from '../components/NewsList';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { retrieveNewsAction } from '../store/newsSlice';
import NewsListSkeleton from '../components/NewsListSkeleton';
import News from '../models/news'; // Poprawiony import

function News() {
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [destroy$] = useState(new Subject<void>());

    const newsState = useAppSelector(state => state.news);
    const dispatch = useAppDispatch();

    const retrieveNews = (page: number, search: string) => {
        retrieveNewsAction(newsState, dispatch, { page, q: search }).pipe(
            takeUntil(destroy$)
        ).subscribe(res => {
            if (page === 1) {
                setLoading(false);
            }
            if (res.length < 24) {
                setHasMore(false);
            }
            if (res.length > 0) {
                setPage(page + 1);
            }
        });
    }

    useEffect(() => {
        window.scroll({ top: 0 });
        retrieveNews(page, '');

        return () => {
            destroy$.next();
            destroy$.complete();
        }
    }, []);

    return (
        <React.Fragment>
            {
                loading ? (
                    <Grid container spacing={2}>
                        <NewsListSkeleton size={24} />
                    </Grid>
                ) : (
                    <InfiniteScroll style={{ overflow: "inherit" }}
                        scrollThreshold={"20px"}
                        next={() => retrieveNews(page, '')}
                        dataLength={newsState.data?.length}
                        hasMore={hasMore}
                        loader={<Skeleton width={"60%"} />}>
                        <Grid container spacing={2}>
                            <NewsList news={newsState.data} />
                        </Grid>
                    </InfiniteScroll>
                )
            }
        </React.Fragment>
    );
}

export default News;
