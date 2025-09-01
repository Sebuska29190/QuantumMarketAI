// Prawdopodobnie Twój plik: src/models/news.ts
export default interface News {
    id?: string;
    article_url?: string;
    description?: string;
    image_url?: string;
    published_utc?: string; // Poprawiono nazwę pola
    publisher?: {
        name?: string;
    };
    title?: string;
}
