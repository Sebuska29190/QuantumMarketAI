import { Box, Card, CardContent, CardMedia, Grid, Typography } from '@mui/material';
import React from 'react';
import NewsModel from '../models/news';

// Definiujemy interfejs Props, aby komponent wiedział, jakiego typu danych oczekuje
interface Props {
    newz: NewsModel;
}

function New({ newz }: Props) {
    // ZABEZPIECZONY KOD DO TWORZENIA DATY
    let publishedDate;
    if (newz.published_date) {
        const date = new Date(newz.published_date);
        if (!isNaN(date.getTime())) {
            publishedDate = date;
        }
    }

    return (
        <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {newz.media && (
                    <CardMedia
                        component="img"
                        height="140"
                        image={newz.media}
                        alt={newz.title}
                    />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="div">
                        <a href={newz.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                            {newz.title}
                        </a>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {newz.summary}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" display="block" gutterBottom>
                            Published by: {newz.rights}
                        </Typography>
                        {publishedDate && (
                            <Typography variant="caption" display="block" gutterBottom>
                                Published on: {publishedDate.toLocaleDateString()}
                            </Typography>
                        )}
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    );
}

export default New;
