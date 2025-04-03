
interface OpenLibraryResponse {
  docs: Array<{
    title: string;
    author_name?: string[];
    cover_i?: number;
    subject?: string[];
    first_publish_year?: number;
  }>;
}

interface GoogleBooksResponse {
  items: Array<{
    volumeInfo: {
      title: string;
      authors?: string[];
      imageLinks?: {
        thumbnail?: string;
      };
      categories?: string[];
      pageCount?: number;
      description?: string;
    };
  }>;
}

export interface BookApiResult {
  title: string;
  author: string;
  coverUrl: string;
  genres: string[];
  pageCount?: number;
  synopsis?: string;
}

export async function searchBookByTitle(title: string): Promise<BookApiResult[]> {
  try {
    // First try OpenLibrary
    const openLibraryUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=5`;
    const openLibraryResponse = await fetch(openLibraryUrl);
    const openLibraryData: OpenLibraryResponse = await openLibraryResponse.json();
    
    const openLibraryResults: BookApiResult[] = openLibraryData.docs.map(book => ({
      title: book.title,
      author: book.author_name ? book.author_name[0] : "Desconhecido",
      coverUrl: book.cover_i 
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` 
        : "/placeholder.svg",
      genres: book.subject?.slice(0, 5) || [],
      pageCount: undefined,
      synopsis: undefined
    }));

    // Then try Google Books API for more info
    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=5`;
    const googleBooksResponse = await fetch(googleBooksUrl);
    const googleBooksData: GoogleBooksResponse = await googleBooksResponse.json();
    
    // Check if we have items in the response
    if (!googleBooksData.items) {
      return openLibraryResults;
    }

    const googleBooksResults: BookApiResult[] = googleBooksData.items.map(item => {
      const volumeInfo = item.volumeInfo;
      return {
        title: volumeInfo.title,
        author: volumeInfo.authors ? volumeInfo.authors[0] : "Desconhecido",
        coverUrl: volumeInfo.imageLinks?.thumbnail || "/placeholder.svg",
        genres: volumeInfo.categories || [],
        pageCount: volumeInfo.pageCount,
        synopsis: volumeInfo.description
      };
    });

    // Combine and deduplicate results, prioritizing Google Books for extra info
    const combinedResults = [...googleBooksResults];
    
    const titles = new Set(combinedResults.map(book => book.title.toLowerCase()));
    
    openLibraryResults.forEach(book => {
      if (!titles.has(book.title.toLowerCase())) {
        combinedResults.push(book);
        titles.add(book.title.toLowerCase());
      }
    });
    
    return combinedResults;
  } catch (error) {
    console.error("Error searching for book:", error);
    throw error;
  }
}
