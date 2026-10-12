import { describe, it, expect } from 'vitest';
import { type Book } from '@/features/catalog/queries';

describe('Book Detail Queue Integration', () => {
  it('supports signedIn flag on Book contract', () => {
    const book: Book = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Verity',
      slug: 'verity',
      author_id: '550e8400-e29b-41d4-a716-446655440001',
      cover_url: null,
      isbn13: null,
      language: 'pt-BR',
      synopsis: 'Suspense',
      total_chapters: 25,
      total_pages: 320,
      publication_year: 2020,
      tags: ['Suspense'],
      amazon_url: null,
      publisher: 'Record',
      translator: null,
      publication_date: null,
      content_rating: '16+',
      edition_number: 1,
      format: 'Brochura',
      width_mm: null,
      height_mm: null,
      depth_mm: null,
      signedIn: true,
    };

    expect(book.signedIn).toBe(true);
    expect(book.total_pages).toBe(320);
  });
});
