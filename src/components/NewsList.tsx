import React from 'react';
import NewsModel from '../models/news';
import New from './New';
import { Grid } from '@mui/material';

interface Props {
    news: NewsModel[];
}

function NewsList({ news }: Props) {
    return (
        <React.Fragment>
            {/* Używamy komponentu Grid z odpowiednimi odstępami */}
            <Grid container spacing={3}>
                {
                    news.map(newz => (
                        <Grid item key={newz.id} xs={12} sm={6} md={4}>
                            <New newz={newz} />
                        </Grid>
                    ))
                }
            </Grid>
        </React.Fragment>
    );
}

export default NewsList;
