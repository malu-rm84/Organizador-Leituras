
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface BookStatusProps {
  status: 'Lido' | 'Não Lido' | 'Lendo';
}

const BookStatus: React.FC<BookStatusProps> = ({ status }) => {
  const getStatusClass = () => {
    switch (status) {
      case 'Lido':
        return 'bg-green-500 hover:bg-green-600';
      case 'Não Lido':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'Lendo':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <Badge className={`${getStatusClass()} text-white`}>
      {status}
    </Badge>
  );
};

export default BookStatus;
