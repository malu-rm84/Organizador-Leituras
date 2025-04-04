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

// Função auxiliar para normalizar títulos de livros para comparação
function normalizeTitle(title: string): string {
  return title.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, ' ')    // Normaliza espaços
    .trim();
}

// Função auxiliar para verificar se dois títulos são similares
function areSimilarTitles(title1: string, title2: string): boolean {
  const normalized1 = normalizeTitle(title1);
  const normalized2 = normalizeTitle(title2);
  
  // Verifica se um é substring do outro ou se são muito similares
  return normalized1.includes(normalized2) || 
         normalized2.includes(normalized1) || 
         (normalized1.length > 5 && normalized2.length > 5 && 
          (normalized1.substring(0, 5) === normalized2.substring(0, 5)));
}

// Função para enriquecer livros com informações adicionais de diferentes edições
function enrichBookData(books: Map<string, Partial<BookApiResult>>): Map<string, Partial<BookApiResult>> {
  const enrichedBooks = new Map<string, Partial<BookApiResult>>(books);
  const processedKeys = new Set<string>();
  
  // Primeiro passo: identificar livros com o mesmo título ou títulos muito similares
  const booksByNormalizedTitle = new Map<string, string[]>();
  
  // Agrupa os livros por títulos normalizados
  for (const [key, book] of books.entries()) {
    if (!book.title) continue;
    
    const normalizedTitle = normalizeTitle(book.title);
    if (!booksByNormalizedTitle.has(normalizedTitle)) {
      booksByNormalizedTitle.set(normalizedTitle, []);
    }
    booksByNormalizedTitle.get(normalizedTitle)!.push(key);
  }
  
  // Agrupa também por títulos similares
  for (const [title1, keys1] of booksByNormalizedTitle.entries()) {
    for (const [title2, keys2] of booksByNormalizedTitle.entries()) {
      if (title1 === title2) continue; // Pula comparação consigo mesmo
      
      if (areSimilarTitles(title1, title2)) {
        // Mescla os grupos de livros similares
        const allKeys = [...keys1, ...keys2];
        booksByNormalizedTitle.set(title1, allKeys);
        // Evita duplicação na próxima iteração
        booksByNormalizedTitle.delete(title2);
      }
    }
  }
  
  // Segundo passo: mesclar informações entre livros similares
  for (const similarBookKeys of booksByNormalizedTitle.values()) {
    if (similarBookKeys.length <= 1) continue; // Pula se não há livros similares
    
    // Cria um objeto para armazenar as informações mescladas
    const mergedBook: Partial<BookApiResult> = {};
    const uniqueGenres = new Set<string>();
    
    // Coleta informações de todos os livros similares
    for (const key of similarBookKeys) {
      const book = books.get(key)!;
      
      // Título (prioriza o mais completo)
      if (!mergedBook.title || (book.title && book.title.length > mergedBook.title.length)) {
        mergedBook.title = book.title;
      }
      
      // Autor (prioriza o preenchido)
      if (!mergedBook.author && book.author) {
        mergedBook.author = book.author;
      }
      
      // Capa (prioriza a que não é placeholder)
      if ((!mergedBook.coverUrl || mergedBook.coverUrl.includes('placeholder')) && 
          book.coverUrl && !book.coverUrl.includes('placeholder')) {
        mergedBook.coverUrl = book.coverUrl;
      }
      
      // Gêneros (combina todos)
      if (book.genres && book.genres.length > 0) {
        book.genres.forEach(genre => uniqueGenres.add(genre));
      }
      
      // Contagem de páginas (prioriza o preenchido)
      if (!mergedBook.pageCount && book.pageCount) {
        mergedBook.pageCount = book.pageCount;
      }
      
      // Sinopse (prioriza a mais longa)
      if ((!mergedBook.synopsis || (book.synopsis && book.synopsis.length > mergedBook.synopsis.length)) && book.synopsis) {
        mergedBook.synopsis = book.synopsis;
      }
      
      // Marca como processado
      processedKeys.add(key);
    }
    
    // Atualiza os gêneros no livro mesclado
    if (uniqueGenres.size > 0) {
      mergedBook.genres = Array.from(uniqueGenres);
    }
    
    // Atualiza todos os livros similares com as informações mescladas
    for (const key of similarBookKeys) {
      const originalBook = books.get(key)!;
      enrichedBooks.set(key, {
        ...originalBook,
        title: mergedBook.title || originalBook.title,
        author: mergedBook.author || originalBook.author,
        coverUrl: mergedBook.coverUrl || originalBook.coverUrl,
        genres: mergedBook.genres || originalBook.genres,
        pageCount: mergedBook.pageCount || originalBook.pageCount,
        synopsis: mergedBook.synopsis || originalBook.synopsis
      });
    }
  }
  
  return enrichedBooks;
}

export async function searchBookByTitle(title: string): Promise<BookApiResult[]> {
  try {
    // Cria um mapa para armazenar os resultados combinados por título
    const bookResults = new Map<string, Partial<BookApiResult>>();
    
    // Primeiro, tentamos o Google Books API para informações mais completas
    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=15&langRestrict=pt`;
    const googleBooksResponse = await fetch(googleBooksUrl);
    const googleBooksData: GoogleBooksResponse = await googleBooksResponse.json();
    
    // Processa os resultados do Google Books
    if (googleBooksData.items && googleBooksData.items.length > 0) {
      googleBooksData.items
        .filter(item => item.volumeInfo && item.volumeInfo.title)
        .forEach(item => {
          const volumeInfo = item.volumeInfo;
          const titleKey = volumeInfo.title.toLowerCase().trim();
          
          // Se o livro já existe no mapa, apenas completa as informações
          if (bookResults.has(titleKey)) {
            const existingBook = bookResults.get(titleKey)!;
            
            // Atualiza apenas campos ausentes
            if (!existingBook.author && volumeInfo.authors?.length) {
              existingBook.author = volumeInfo.authors[0];
            }
            
            if (!existingBook.coverUrl && volumeInfo.imageLinks?.thumbnail) {
              existingBook.coverUrl = volumeInfo.imageLinks.thumbnail.replace('http:', 'https:');
            }
            
            if ((!existingBook.genres || existingBook.genres.length === 0) && volumeInfo.categories?.length) {
              existingBook.genres = [...volumeInfo.categories];
            }
            
            if (!existingBook.pageCount && volumeInfo.pageCount) {
              existingBook.pageCount = volumeInfo.pageCount;
            }
            
            if (!existingBook.synopsis && volumeInfo.description) {
              existingBook.synopsis = volumeInfo.description;
            }
          } else {
            // Cria uma nova entrada no mapa
            bookResults.set(titleKey, {
              title: volumeInfo.title,
              author: volumeInfo.authors ? volumeInfo.authors[0] : undefined,
              coverUrl: volumeInfo.imageLinks?.thumbnail 
                ? volumeInfo.imageLinks.thumbnail.replace('http:', 'https:') 
                : undefined,
              genres: volumeInfo.categories || [],
              pageCount: volumeInfo.pageCount,
              synopsis: volumeInfo.description
            });
          }
        });
    }
    
    // Depois, tentamos OpenLibrary para complementar informações
    const openLibraryUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=15&lang=por`;
    const openLibraryResponse = await fetch(openLibraryUrl);
    const openLibraryData: OpenLibraryResponse = await openLibraryResponse.json();
    
    openLibraryData.docs
      .filter(book => book.title)
      .forEach(book => {
        const titleKey = book.title.toLowerCase().trim();
        
        if (bookResults.has(titleKey)) {
          // Completa informações faltantes
          const existingBook = bookResults.get(titleKey)!;
          
          if (!existingBook.author && book.author_name?.length) {
            existingBook.author = book.author_name[0];
          }
          
          if (!existingBook.coverUrl && book.cover_i) {
            existingBook.coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`;
          }
          
          if (book.subject?.length) {
            if (!existingBook.genres) {
              existingBook.genres = [...book.subject];
            } else {
              // Adiciona novos gêneros sem duplicar
              const uniqueGenres = new Set([...existingBook.genres]);
              book.subject.forEach(genre => uniqueGenres.add(genre));
              existingBook.genres = Array.from(uniqueGenres);
            }
          }
          
          if (!existingBook.pageCount && book.number_of_pages_median) {
            existingBook.pageCount = book.number_of_pages_median;
          }
        } else {
          // Cria uma nova entrada no mapa
          bookResults.set(titleKey, {
            title: book.title,
            author: book.author_name ? book.author_name[0] : undefined,
            coverUrl: book.cover_i 
              ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` 
              : undefined,
            genres: book.subject || [],
            pageCount: book.number_of_pages_median
          });
        }
      });
    
    // Busca adicional pelo Google Books com variações do título
    if (bookResults.size > 0) {
      // Cria variações do título para busca mais ampla
      const bookTitleVariations = Array.from(bookResults.keys())
        .map(key => {
          const book = bookResults.get(key)!;
          const words = book.title?.split(' ') || [];
          // Pega as três primeiras palavras significativas (com mais de 3 letras)
          return words.filter(word => word.length > 3).slice(0, 3).join(' ');
        })
        .filter(variation => variation.length > 0);
      
      // Busca por cada variação para complementar informações
      for (const titleVariation of bookTitleVariations) {
        const variationUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(titleVariation)}&maxResults=5`;
        try {
          const variationResponse = await fetch(variationUrl);
          const variationData: GoogleBooksResponse = await variationResponse.json();
          
          if (variationData.items) {
            variationData.items
              .filter(item => item.volumeInfo && item.volumeInfo.title)
              .forEach(item => {
                const volumeInfo = item.volumeInfo;
                
                // Verifica se este resultado é similar a algum livro que já temos
                for (const [key, existingBook] of bookResults.entries()) {
                  if (existingBook.title && areSimilarTitles(existingBook.title, volumeInfo.title)) {
                    // Completa informações faltantes
                    if (!existingBook.author && volumeInfo.authors?.length) {
                      existingBook.author = volumeInfo.authors[0];
                    }
                    
                    if ((!existingBook.coverUrl || existingBook.coverUrl.includes('placeholder')) && volumeInfo.imageLinks?.thumbnail) {
                      existingBook.coverUrl = volumeInfo.imageLinks.thumbnail.replace('http:', 'https:');
                    }
                    
                    if (volumeInfo.categories?.length) {
                      const uniqueGenres = new Set(existingBook.genres || []);
                      volumeInfo.categories.forEach(genre => uniqueGenres.add(genre));
                      existingBook.genres = Array.from(uniqueGenres);
                    }
                    
                    if (!existingBook.pageCount && volumeInfo.pageCount) {
                      existingBook.pageCount = volumeInfo.pageCount;
                    }
                    
                    if (!existingBook.synopsis && volumeInfo.description) {
                      existingBook.synopsis = volumeInfo.description;
                    }
                    
                    break; // Já encontrou um match, não precisa verificar os outros
                  }
                }
              });
          }
        } catch (error) {
          console.error("Erro na busca de variação do título:", error);
          // Continua com outras variações
        }
      }
    }
    
    // Se ainda temos poucos resultados ou resultados incompletos, tenta buscar pelo autor
    if (bookResults.size < 3) {
      const authorWords = title.split(' ').filter(word => word.length > 3);
      if (authorWords.length > 0) {
        for (const possibleAuthor of authorWords) {
          const authorUrl = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${encodeURIComponent(possibleAuthor)}&maxResults=10`;
          try {
            const authorResponse = await fetch(authorUrl);
            const authorData: GoogleBooksResponse = await authorResponse.json();
            
            if (authorData.items) {
              authorData.items
                .filter(item => item.volumeInfo && item.volumeInfo.title)
                .forEach(item => {
                  const volumeInfo = item.volumeInfo;
                  const titleKey = volumeInfo.title.toLowerCase().trim();
                  
                  if (!bookResults.has(titleKey)) {
                    bookResults.set(titleKey, {
                      title: volumeInfo.title,
                      author: volumeInfo.authors ? volumeInfo.authors[0] : undefined,
                      coverUrl: volumeInfo.imageLinks?.thumbnail 
                        ? volumeInfo.imageLinks.thumbnail.replace('http:', 'https:') 
                        : undefined,
                      genres: volumeInfo.categories || [],
                      pageCount: volumeInfo.pageCount,
                      synopsis: volumeInfo.description
                    });
                  }
                });
              
              if (bookResults.size >= 10) break;
            }
          } catch (error) {
            console.error("Erro na busca por autor:", error);
            // Continua com outros autores
          }
        }
      }
    }
    
    // Aplica o processo de enriquecimento para combinar informações de edições similares
    const enrichedBooks = enrichBookData(bookResults);
    
    // Converte o mapa em array e preenche valores padrão para campos obrigatórios que ainda estejam faltando
    const finalResults: BookApiResult[] = Array.from(enrichedBooks.values())
      .map(book => ({
        title: book.title || "Título Desconhecido",
        author: book.author || "Autor Desconhecido",
        coverUrl: book.coverUrl || "/placeholder.svg",
        genres: book.genres || [],
        pageCount: book.pageCount,
        synopsis: book.synopsis
      })) as BookApiResult[];
    
    return finalResults;
  } catch (error) {
    console.error("Erro na busca de livros:", error);
    throw error;
  }
}