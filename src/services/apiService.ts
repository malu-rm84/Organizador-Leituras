
interface OpenLibraryResponse {
  docs: Array<{
    title: string;
    author_name?: string[];
    cover_i?: number;
    subject?: string[];
    first_publish_year?: number;
    number_of_pages_median?: number;
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
      language?: string;
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
    // Primeiro, tentamos o Google Books API para informações mais completas
    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=10&langRestrict=pt`;
    const googleBooksResponse = await fetch(googleBooksUrl);
    const googleBooksData: GoogleBooksResponse = await googleBooksResponse.json();
    
    let googleBooksResults: BookApiResult[] = [];
    
    // Verifica se temos itens na resposta do Google Books
    if (googleBooksData.items && googleBooksData.items.length > 0) {
      googleBooksResults = googleBooksData.items
        .filter(item => item.volumeInfo && item.volumeInfo.title)
        .map(item => {
          const volumeInfo = item.volumeInfo;
          return {
            title: volumeInfo.title,
            author: volumeInfo.authors ? volumeInfo.authors[0] : "Desconhecido",
            coverUrl: volumeInfo.imageLinks?.thumbnail 
              ? volumeInfo.imageLinks.thumbnail.replace('http:', 'https:') 
              : "/placeholder.svg",
            genres: volumeInfo.categories || [],
            pageCount: volumeInfo.pageCount,
            synopsis: volumeInfo.description
          };
        });
    }
    
    // Depois, tentamos OpenLibrary para complementar, especialmente para capas e informações adicionais
    const openLibraryUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=10&lang=por`;
    const openLibraryResponse = await fetch(openLibraryUrl);
    const openLibraryData: OpenLibraryResponse = await openLibraryResponse.json();
    
    const openLibraryResults: BookApiResult[] = openLibraryData.docs
      .filter(book => book.title)
      .map(book => ({
        title: book.title,
        author: book.author_name ? book.author_name[0] : "Desconhecido",
        coverUrl: book.cover_i 
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` 
          : "/placeholder.svg",
        genres: book.subject?.slice(0, 5) || [],
        pageCount: book.number_of_pages_median,
        synopsis: undefined
      }));

    // Combina e deduplica resultados, priorizando o Google Books para informações extras
    const combinedResults: BookApiResult[] = [...googleBooksResults];
    
    const titles = new Set(combinedResults.map(book => book.title.toLowerCase()));
    
    // Adiciona resultados do OpenLibrary que não foram encontrados no Google Books
    openLibraryResults.forEach(book => {
      if (!titles.has(book.title.toLowerCase())) {
        combinedResults.push(book);
        titles.add(book.title.toLowerCase());
      } else {
        // Para livros que aparecem em ambas as APIs, complementa informações faltantes
        const existingBookIndex = combinedResults.findIndex(
          b => b.title.toLowerCase() === book.title.toLowerCase()
        );
        
        if (existingBookIndex !== -1) {
          const existingBook = combinedResults[existingBookIndex];
          
          // Completa com informações do OpenLibrary se estiverem faltando no Google
          if (!existingBook.coverUrl || existingBook.coverUrl === "/placeholder.svg") {
            existingBook.coverUrl = book.coverUrl;
          }
          
          if (!existingBook.pageCount && book.pageCount) {
            existingBook.pageCount = book.pageCount;
          }
          
          if ((!existingBook.genres || existingBook.genres.length === 0) && book.genres && book.genres.length > 0) {
            existingBook.genres = book.genres;
          }
        }
      }
    });
    
    // Se não encontrarmos resultados suficientes, expandimos a busca
    if (combinedResults.length < 2) {
      // Tenta buscar pelo autor também se o título não deu bons resultados
      const authorWords = title.split(' ').filter(word => word.length > 3);
      if (authorWords.length > 0) {
        for (const possibleAuthor of authorWords) {
          const authorUrl = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${encodeURIComponent(possibleAuthor)}&maxResults=5`;
          const authorResponse = await fetch(authorUrl);
          const authorData: GoogleBooksResponse = await authorResponse.json();
          
          if (authorData.items) {
            const authorResults = authorData.items
              .filter(item => item.volumeInfo && item.volumeInfo.title)
              .map(item => {
                const volumeInfo = item.volumeInfo;
                return {
                  title: volumeInfo.title,
                  author: volumeInfo.authors ? volumeInfo.authors[0] : "Desconhecido",
                  coverUrl: volumeInfo.imageLinks?.thumbnail 
                    ? volumeInfo.imageLinks.thumbnail.replace('http:', 'https:') 
                    : "/placeholder.svg",
                  genres: volumeInfo.categories || [],
                  pageCount: volumeInfo.pageCount,
                  synopsis: volumeInfo.description
                };
              });
              
            // Adiciona apenas novos resultados que não estão na lista ainda
            authorResults.forEach(book => {
              if (!titles.has(book.title.toLowerCase())) {
                combinedResults.push(book);
                titles.add(book.title.toLowerCase());
              }
            });
            
            if (combinedResults.length >= 5) break;
          }
        }
      }
    }
    
    return combinedResults;
  } catch (error) {
    console.error("Erro na busca de livros:", error);
    throw error;
  }
}
