import { Box, Card, CardContent, CardMedia, Grid, Typography, CardActionArea } from '@mui/material';
import React from 'react';
import NewsModel from '../models/news';

interface Props {
    newz: NewsModel;
}

function New({ newz }: Props) {
    let publishedDate;
    if (newz.published_utc) { // Pole dla daty w Polygon.io to 'published_utc'
        const date = new Date(newz.published_utc);
        if (!isNaN(date.getTime())) {
            publishedDate = date;
        }
    }

    return (
        <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardActionArea component="a" href={newz.article_url} target="_blank" rel="noopener noreferrer">
                    {newz.image_url && (
                        <CardMedia
                            component="img"
                            height="140"
                            image={newz.image_url}
                            alt={newz.title}
                        />
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                        <Typography gutterBottom variant="h5" component="div">
                            {newz.title}
                        </Typography>
                        {newz.description && ( // Używamy 'description' z Polygon.io
                            <Typography variant="body2" color="text.secondary">
                                {newz.description}
                            </Typography>
                        )}
                        <Box sx={{ mt: 2 }}>
                            {newz.publisher && newz.publisher.name && ( // Używamy 'publisher.name' z Polygon.io
                                <Typography variant="caption" display="block" gutterBottom>
                                    Published by: {newz.publisher.name}
                                </Typography>
                            )}
                            {publishedDate && (
                                <Typography variant="caption" display="block" gutterBottom>
                                    Published on: {publishedDate.toLocaleDateString()}
                                </Typography>
                            )}
                        </Box>
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
    );
}

export default New;
