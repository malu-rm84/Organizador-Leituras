
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchBooksByUserId, Book } from '@/services/bookService';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import StarRating from '@/components/StarRating';
import BookStatus from '@/components/BookStatus';
import { toast } from '@/components/ui/use-toast';
import { Book as BookIcon, PlusCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Todos');
  
  useEffect(() => {
    if (currentUser) {
      loadBooks();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (books.length > 0) {
      filterBooks();
    }
  }, [books, statusFilter]);

  const loadBooks = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userBooks = await fetchBooksByUserId(currentUser.uid);
      setBooks(userBooks);
      setFilteredBooks(userBooks);
    } catch (error) {
      console.error("Error loading books:", error);
      toast({
        title: "Erro ao carregar livros",
        description: "Não foi possível carregar sua coleção de livros. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBooks = () => {
    if (statusFilter === 'Todos') {
      setFilteredBooks(books);
    } else {
      setFilteredBooks(books.filter(book => book.status === statusFilter));
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-purple-500">Carregando...</div>
      </div>
    );
  }

  // Welcome screen for non-logged in users
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-800">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <BookIcon className="mx-auto h-24 w-24 text-purple-300 mb-6" />
            <h1 className="text-5xl font-bold mb-6 text-white">Organizador de Leituras</h1>
            <p className="text-xl mb-8 text-purple-100">
              Organize sua coleção de livros, acompanhe suas leituras e mantenha anotações em um só lugar.
            </p>
            <div className="space-y-4">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link to="/login">Começar agora</Link>
              </Button>
            </div>
            
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card/80 backdrop-blur p-6 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 mx-auto">
                  <BookIcon className="h-6 w-6 text-purple-300" />
                </div>
                <h3 className="text-xl font-medium mb-2">Catalogação</h3>
                <p className="text-muted-foreground">
                  Organize seus livros com informações completas e pesquisáveis.
                </p>
              </div>
              
              <div className="bg-card/80 backdrop-blur p-6 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 mx-auto">
                  <svg className="h-6 w-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-2">Acompanhamento</h3>
                <p className="text-muted-foreground">
                  Marque livros como lidos, não lidos ou em andamento.
                </p>
              </div>
              
              <div className="bg-card/80 backdrop-blur p-6 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 mx-auto">
                  <svg className="h-6 w-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-2">Anotações</h3>
                <p className="text-muted-foreground">
                  Mantenha suas impressões e pensamentos sobre cada livro.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Meu Organizador de Leituras</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {currentUser.displayName || "Leitor"}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Lido">Lido</SelectItem>
              <SelectItem value="Não Lido">Não Lido</SelectItem>
              <SelectItem value="Lendo">Lendo</SelectItem>
            </SelectContent>
          </Select>
          
          <Button asChild>
            <Link to="/add-book">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Livro
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-20">
          <BookIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">Nenhum livro encontrado</h2>
          <p className="text-muted-foreground mb-6">
            {books.length === 0 
              ? "Sua coleção está vazia. Adicione seu primeiro livro!" 
              : "Nenhum livro corresponde ao filtro selecionado."}
          </p>
          {books.length === 0 && (
            <Button asChild>
              <Link to="/add-book">
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Livro
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <Link to="/collection" key={book.id}>
              <Card className="h-full hover:border-primary transition-colors overflow-hidden">
                <CardContent className="p-0 flex">
                  <div className="h-auto w-24 overflow-hidden">
                    <img
                      src={book.coverUrl || "/placeholder.svg"}
                      alt={book.title}
                      className="h-full w-full object-cover"
                      style={{ minHeight: "180px" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <h3 className="font-medium mb-1 line-clamp-2">{book.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <BookStatus status={book.status} />
                        </div>
                        
                        {book.rating !== undefined && (
                          <div className="flex items-center">
                            <StarRating rating={book.rating} size={16} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;
