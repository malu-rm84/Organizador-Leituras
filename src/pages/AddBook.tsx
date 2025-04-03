
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { searchBookByTitle, BookApiResult } from '@/services/apiService';
import { addBook } from '@/services/bookService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StarRating from '@/components/StarRating';
import { toast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Book, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const AddBook = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [searchResults, setSearchResults] = useState<BookApiResult[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookApiResult | null>(null);
  const [status, setStatus] = useState<'Lido' | 'Não Lido' | 'Lendo'>('Não Lido');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    setSelectedBook(null);
    setSearchResults([]);
    setStatus('Não Lido');
    setRating(0);
    setNotes('');
  }, [title]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-purple-500">Carregando...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  const handleSearch = async () => {
    if (!title.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite o título do livro para pesquisar.",
        variant: "destructive",
      });
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchBookByTitle(title);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching for books:", error);
      toast({
        title: "Erro na pesquisa",
        description: "Não foi possível pesquisar por livros. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectBook = (book: BookApiResult) => {
    setSelectedBook(book);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBook) {
      toast({
        title: "Selecione um livro",
        description: "Por favor, selecione um livro dos resultados da pesquisa.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await addBook({
        title: selectedBook.title,
        author: selectedBook.author,
        coverUrl: selectedBook.coverUrl,
        genres: selectedBook.genres,
        pageCount: selectedBook.pageCount,
        synopsis: selectedBook.synopsis,
        status,
        rating,
        notes,
        userId: currentUser.uid,
      });

      toast({
        title: "Livro adicionado",
        description: `${selectedBook.title} foi adicionado à sua coleção.`,
      });

      // Clear form and redirect
      setTitle('');
      setSelectedBook(null);
      setSearchResults([]);
      setStatus('Não Lido');
      setRating(0);
      setNotes('');
      navigate('/collection');
    } catch (error) {
      console.error("Error adding book:", error);
      toast({
        title: "Erro ao adicionar livro",
        description: "Não foi possível adicionar o livro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Adicionar Livro</h1>

      <Card className="mb-8">
        <CardContent className="pt-6 pb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="title" className="mb-2 block">Título do Livro</Label>
              <div className="flex gap-2">
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Digite o título do livro..."
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={searchLoading}>
                  {searchLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Pesquisar"
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Digite o título do livro para buscar informações automaticamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {searchResults.length > 0 && !selectedBook && (
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Resultados da Pesquisa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((book, index) => (
              <Card 
                key={`${book.title}-${index}`} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleSelectBook(book)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-24 w-16 flex-shrink-0 overflow-hidden rounded-sm border">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-muted">
                        <Book className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium line-clamp-1">{book.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {book.author}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedBook && (
        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <h2 className="text-xl font-medium mb-4">Detalhes do Livro</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <div className="flex flex-col items-center">
                  <div className="h-60 w-40 overflow-hidden rounded-md border mb-4">
                    {selectedBook.coverUrl ? (
                      <img
                        src={selectedBook.coverUrl}
                        alt={selectedBook.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-muted">
                        <Book className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setSelectedBook(null)}
                    className="w-full"
                  >
                    Escolher outro livro
                  </Button>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="info">Informações do Livro</TabsTrigger>
                    <TabsTrigger value="status">Status e Notas</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info" className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">Título</Label>
                      <p className="font-medium">{selectedBook.title}</p>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground text-sm">Autor</Label>
                      <p>{selectedBook.author}</p>
                    </div>
                    
                    {selectedBook.pageCount && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Número de Páginas</Label>
                        <p>{selectedBook.pageCount}</p>
                      </div>
                    )}
                    
                    {selectedBook.genres && selectedBook.genres.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Gêneros</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedBook.genres.map((genre, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-secondary rounded-md text-xs"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedBook.synopsis && (
                      <div>
                        <Label className="text-muted-foreground text-sm">Sinopse</Label>
                        <p className="text-sm leading-relaxed max-h-40 overflow-y-auto mt-1">
                          {selectedBook.synopsis}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="status" className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status de Leitura</Label>
                      <Select 
                        value={status} 
                        onValueChange={(val) => setStatus(val as 'Lido' | 'Não Lido' | 'Lendo')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Lido">Lido</SelectItem>
                          <SelectItem value="Não Lido">Não Lido</SelectItem>
                          <SelectItem value="Lendo">Lendo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Avaliação</Label>
                      <div className="star-rating-container">
                        <StarRating 
                          rating={rating} 
                          editable={true}
                          onChange={setRating} 
                        />
                        <span className="ml-2 text-sm">{rating} / 5</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notas e Anotações</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Adicione suas anotações sobre este livro..."
                        className="min-h-32"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar à Coleção"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddBook;
